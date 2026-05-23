-- ============================================================
-- FASE 3 — EXTENSIÓN SAAS MULTI-TENANT
-- Ejecutar completo en Supabase SQL Editor
-- Orden: extensiones → nuevas tablas → RLS → grants → índices
-- ============================================================


-- ── 0. FUNCIÓN AUXILIAR: is_admin() ─────────────────────────
-- Complementa get_my_conjunto_id() para separar permisos por rol

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = auth.uid() AND rol = 'admin'
  )
$$;


-- ── 1. EXTENSIÓN DE TABLA: conjuntos ────────────────────────
-- Agrega tipo de conjunto (no rompe datos existentes)

ALTER TABLE public.conjuntos
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'torres'
    CHECK (tipo IN ('torres', 'casas', 'mixto')),
  ADD COLUMN IF NOT EXISTS ciudad VARCHAR(100),
  ADD COLUMN IF NOT EXISTS direccion TEXT,
  ADD COLUMN IF NOT EXISTS telefono VARCHAR(20),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ── 2. EXTENSIÓN DE TABLA: apartamentos ─────────────────────
-- Agrega piso (necesario para auto-generación)

ALTER TABLE public.apartamentos
  ADD COLUMN IF NOT EXISTS piso INT,
  ADD COLUMN IF NOT EXISTS tipo VARCHAR(20) DEFAULT 'apartamento'
    CHECK (tipo IN ('apartamento', 'casa', 'local', 'oficina')),
  ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();


-- ── 3. CONFIG_CONJUNTO ───────────────────────────────────────
-- Configuración operativa del conjunto (1:1 con conjuntos)
-- Separado de conjuntos para mantener esa tabla limpia

CREATE TABLE IF NOT EXISTS public.config_conjunto (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id             UUID NOT NULL UNIQUE REFERENCES public.conjuntos(id) ON DELETE CASCADE,

  -- Estructura física
  num_torres              INT DEFAULT 1,
  nomenclatura_torres     VARCHAR(20) DEFAULT 'alfabetica'
                            CHECK (nomenclatura_torres IN ('numerica', 'alfabetica', 'personalizada')),
  aptos_por_piso          INT DEFAULT 4,
  num_pisos               INT DEFAULT 10,
  nomenclatura_aptos      VARCHAR(30) DEFAULT 'piso-numero',

  -- Módulos habilitados
  modulo_parqueaderos     BOOLEAN DEFAULT false,
  modulo_visitantes       BOOLEAN DEFAULT true,
  modulo_paqueteria       BOOLEAN DEFAULT true,
  modulo_mascotas         BOOLEAN DEFAULT true,
  modulo_pqrs             BOOLEAN DEFAULT true,

  -- Cartera
  valor_cuota_mensual     NUMERIC(12,2) DEFAULT 0,
  dia_limite_pago         INT DEFAULT 10 CHECK (dia_limite_pago BETWEEN 1 AND 31),
  mora_automatica         BOOLEAN DEFAULT false,
  porcentaje_mora         NUMERIC(5,2) DEFAULT 0,

  -- Links de pago
  link_pse                TEXT,
  link_banco              TEXT,
  instrucciones_pago      TEXT,

  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. PARQUEADEROS ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.parqueaderos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID REFERENCES public.apartamentos(id) ON DELETE SET NULL,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,

  numero          VARCHAR(20) NOT NULL,
  tipo            VARCHAR(20) NOT NULL DEFAULT 'carro'
                    CHECK (tipo IN ('carro', 'moto', 'visitante', 'bicicleta')),
  cubierto        BOOLEAN DEFAULT false,
  activo          BOOLEAN DEFAULT true,
  observaciones   TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (conjunto_id, numero)
);


-- ── 5. VEHÍCULOS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vehiculos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID REFERENCES public.apartamentos(id) ON DELETE SET NULL,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  parqueadero_id  UUID REFERENCES public.parqueaderos(id) ON DELETE SET NULL,

  placa           VARCHAR(10) NOT NULL,
  marca           VARCHAR(50),
  modelo          VARCHAR(50),
  color           VARCHAR(30),
  tipo            VARCHAR(20) DEFAULT 'carro'
                    CHECK (tipo IN ('carro', 'moto', 'bicicleta', 'otro')),
  activo          BOOLEAN DEFAULT true,

  created_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (conjunto_id, placa)
);


-- ── 6. ESTADOS DE CUENTA ────────────────────────────────────
-- Un registro por apartamento por período (YYYY-MM)
-- El admin los genera; los residentes los visualizan

CREATE TABLE IF NOT EXISTS public.estados_cuenta (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,

  periodo         VARCHAR(7) NOT NULL,  -- formato: 2025-05
  valor_cuota     NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_mora      NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_otros     NUMERIC(12,2) NOT NULL DEFAULT 0,
  valor_total     NUMERIC(12,2) GENERATED ALWAYS AS (valor_cuota + valor_mora + valor_otros) STORED,

  estado          VARCHAR(20) NOT NULL DEFAULT 'pendiente'
                    CHECK (estado IN ('pendiente', 'pagado', 'mora', 'exonerado', 'parcial')),

  fecha_vencimiento DATE NOT NULL,
  fecha_pago        DATE,
  observaciones     TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (conjunto_id, apartamento_id, periodo)
);


-- ── 7. PAGOS ────────────────────────────────────────────────
-- Registro de cada pago realizado o reportado
-- Diseñado para integrar PSE/Stripe/MercadoPago en el futuro

CREATE TABLE IF NOT EXISTS public.pagos (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id       UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id    UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  usuario_id        UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  estado_cuenta_id  UUID REFERENCES public.estados_cuenta(id) ON DELETE SET NULL,

  monto             NUMERIC(12,2) NOT NULL,
  metodo            VARCHAR(30) NOT NULL DEFAULT 'transferencia'
                      CHECK (metodo IN ('pse', 'transferencia', 'efectivo', 'tarjeta', 'nequi', 'daviplata', 'otro')),

  referencia        VARCHAR(100),
  comprobante_url   TEXT,
  notas             TEXT,

  estado            VARCHAR(30) NOT NULL DEFAULT 'pendiente_verificacion'
                      CHECK (estado IN ('pendiente_verificacion', 'verificado', 'rechazado')),

  reportado_por     UUID REFERENCES public.usuarios(id),
  verificado_por    UUID REFERENCES public.usuarios(id),
  fecha_pago        DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Campos para integración futura con pasarelas de pago
  pasarela          VARCHAR(30),       -- 'stripe', 'mercadopago', 'pse', null
  pasarela_ref      VARCHAR(200),      -- ID de transacción externo
  pasarela_estado   VARCHAR(30),       -- estado devuelto por la pasarela

  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ── 8. LLAMADOS DE ATENCIÓN ─────────────────────────────────

CREATE TABLE IF NOT EXISTS public.llamados_atencion (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  creado_por      UUID NOT NULL REFERENCES public.usuarios(id),

  categoria       VARCHAR(30) NOT NULL
                    CHECK (categoria IN ('ruido', 'mascotas', 'convivencia', 'parqueadero', 'daños', 'incumplimiento', 'otro')),
  descripcion     TEXT NOT NULL,
  evidencia_url   TEXT,

  estado          VARCHAR(20) NOT NULL DEFAULT 'abierto'
                    CHECK (estado IN ('abierto', 'notificado', 'resuelto', 'cerrado')),

  respuesta_admin TEXT,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 9. PAQUETES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.paquetes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  usuario_id      UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  registrado_por  UUID NOT NULL REFERENCES public.usuarios(id),
  recibido_por    UUID REFERENCES public.usuarios(id),

  descripcion     TEXT,
  empresa_envio   VARCHAR(100),
  numero_guia     VARCHAR(100),
  foto_url        TEXT,

  estado          VARCHAR(20) NOT NULL DEFAULT 'en_porteria'
                    CHECK (estado IN ('en_porteria', 'entregado', 'devuelto')),

  fecha_recepcion TIMESTAMPTZ DEFAULT NOW(),
  fecha_entrega   TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 10. VISITANTES ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.visitantes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id       UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id    UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  autorizado_por    UUID NOT NULL REFERENCES public.usuarios(id),

  nombre            VARCHAR(200) NOT NULL,
  documento         VARCHAR(30),
  placa_vehiculo    VARCHAR(15),

  tipo_visita       VARCHAR(20) DEFAULT 'persona'
                      CHECK (tipo_visita IN ('persona', 'vehiculo', 'delivery', 'servicio')),

  codigo_acceso     VARCHAR(10),
  fecha_expiracion  TIMESTAMPTZ,
  fecha_ingreso     TIMESTAMPTZ,
  fecha_salida      TIMESTAMPTZ,

  activo            BOOLEAN DEFAULT true,
  observaciones     TEXT,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ── 11. MASCOTAS ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.mascotas (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id       UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id    UUID NOT NULL REFERENCES public.apartamentos(id) ON DELETE CASCADE,
  usuario_id        UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,

  nombre            VARCHAR(100) NOT NULL,
  tipo              VARCHAR(20) NOT NULL DEFAULT 'perro'
                      CHECK (tipo IN ('perro', 'gato', 'ave', 'reptil', 'otro')),
  raza              VARCHAR(100),
  color             VARCHAR(50),
  vacunas_al_dia    BOOLEAN DEFAULT false,
  soporte_emocional BOOLEAN DEFAULT false,
  foto_url          TEXT,
  activo            BOOLEAN DEFAULT true,

  created_at        TIMESTAMPTZ DEFAULT NOW()
);


-- ── 12. DOCUMENTOS DEL CONJUNTO ─────────────────────────────

CREATE TABLE IF NOT EXISTS public.documentos_conjunto (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  subido_por      UUID NOT NULL REFERENCES public.usuarios(id),

  nombre          VARCHAR(200) NOT NULL,
  descripcion     TEXT,
  categoria       VARCHAR(30) NOT NULL DEFAULT 'otro'
                    CHECK (categoria IN ('reglamento', 'manual_convivencia', 'acta', 'certificado', 'circular', 'presupuesto', 'otro')),
  url             TEXT NOT NULL,
  publico         BOOLEAN DEFAULT true,

  created_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ── 13. PQRS ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.pqrs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conjunto_id     UUID NOT NULL REFERENCES public.conjuntos(id) ON DELETE CASCADE,
  apartamento_id  UUID REFERENCES public.apartamentos(id) ON DELETE SET NULL,
  usuario_id      UUID NOT NULL REFERENCES public.usuarios(id),
  asignado_a      UUID REFERENCES public.usuarios(id),

  tipo            VARCHAR(20) NOT NULL
                    CHECK (tipo IN ('peticion', 'queja', 'reclamo', 'sugerencia')),
  categoria       VARCHAR(30) NOT NULL DEFAULT 'otro'
                    CHECK (categoria IN ('infraestructura', 'convivencia', 'administracion', 'servicios', 'financiero', 'otro')),

  asunto          VARCHAR(300) NOT NULL,
  descripcion     TEXT NOT NULL,
  adjunto_url     TEXT,

  estado          VARCHAR(20) NOT NULL DEFAULT 'recibido'
                    CHECK (estado IN ('recibido', 'en_proceso', 'resuelto', 'cerrado')),

  respuesta       TEXT,
  fecha_respuesta TIMESTAMPTZ,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);


-- ══════════════════════════════════════════════════════════════
-- RLS — HABILITAR + POLÍTICAS
-- Patrón uniforme: SELECT abierto al conjunto, mutaciones según rol
-- ══════════════════════════════════════════════════════════════

ALTER TABLE public.config_conjunto      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parqueaderos         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehiculos            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estados_cuenta       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.llamados_atencion    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paquetes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitantes           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mascotas             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documentos_conjunto  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pqrs                 ENABLE ROW LEVEL SECURITY;


-- ── config_conjunto ──────────────────────────────────────────
-- Solo admin puede ver y modificar la config

CREATE POLICY "config_conjunto_select"
  ON public.config_conjunto FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "config_conjunto_all"
  ON public.config_conjunto FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── parqueaderos ─────────────────────────────────────────────

CREATE POLICY "parqueaderos_select"
  ON public.parqueaderos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "parqueaderos_all"
  ON public.parqueaderos FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── vehiculos ────────────────────────────────────────────────
-- Admin gestiona todos; residente gestiona los suyos

CREATE POLICY "vehiculos_select"
  ON public.vehiculos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "vehiculos_insert_residente"
  ON public.vehiculos FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "vehiculos_update_residente"
  ON public.vehiculos FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id() AND usuario_id = auth.uid());

CREATE POLICY "vehiculos_admin_all"
  ON public.vehiculos FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── estados_cuenta ───────────────────────────────────────────
-- Admin crea/modifica; todos del conjunto ven

CREATE POLICY "estados_cuenta_select"
  ON public.estados_cuenta FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "estados_cuenta_all"
  ON public.estados_cuenta FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── pagos ────────────────────────────────────────────────────
-- Residente puede reportar pago; admin verifica

CREATE POLICY "pagos_select"
  ON public.pagos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "pagos_insert"
  ON public.pagos FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND reportado_por = auth.uid()
  );

CREATE POLICY "pagos_update_admin"
  ON public.pagos FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());

CREATE POLICY "pagos_delete_admin"
  ON public.pagos FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── llamados_atencion ────────────────────────────────────────
-- Solo admin crea y gestiona; residente solo ve los que le corresponden

CREATE POLICY "llamados_select_admin"
  ON public.llamados_atencion FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());

CREATE POLICY "llamados_select_residente"
  ON public.llamados_atencion FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "llamados_all_admin"
  ON public.llamados_atencion FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── paquetes ─────────────────────────────────────────────────
-- Admin/portería registra; residente ve los suyos

CREATE POLICY "paquetes_select_admin"
  ON public.paquetes FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());

CREATE POLICY "paquetes_select_residente"
  ON public.paquetes FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "paquetes_all_admin"
  ON public.paquetes FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── visitantes ───────────────────────────────────────────────
-- Residente autoriza sus propios visitantes; admin ve todos

CREATE POLICY "visitantes_select_admin"
  ON public.visitantes FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());

CREATE POLICY "visitantes_select_residente"
  ON public.visitantes FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND autorizado_por = auth.uid()
  );

CREATE POLICY "visitantes_insert_residente"
  ON public.visitantes FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND autorizado_por = auth.uid()
  );

CREATE POLICY "visitantes_update_residente"
  ON public.visitantes FOR UPDATE
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND autorizado_por = auth.uid()
  );

CREATE POLICY "visitantes_all_admin"
  ON public.visitantes FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── mascotas ─────────────────────────────────────────────────

CREATE POLICY "mascotas_select"
  ON public.mascotas FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "mascotas_insert_residente"
  ON public.mascotas FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "mascotas_update_residente"
  ON public.mascotas FOR UPDATE
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "mascotas_all_admin"
  ON public.mascotas FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── documentos_conjunto ──────────────────────────────────────

CREATE POLICY "documentos_select"
  ON public.documentos_conjunto FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "documentos_all_admin"
  ON public.documentos_conjunto FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── pqrs ─────────────────────────────────────────────────────
-- Residente crea y ve las suyas; admin ve y responde todas

CREATE POLICY "pqrs_select_admin"
  ON public.pqrs FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());

CREATE POLICY "pqrs_select_residente"
  ON public.pqrs FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "pqrs_insert_residente"
  ON public.pqrs FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
  );

CREATE POLICY "pqrs_update_residente"
  ON public.pqrs FOR UPDATE
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
    AND estado = 'recibido'
  );

CREATE POLICY "pqrs_all_admin"
  ON public.pqrs FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ══════════════════════════════════════════════════════════════
-- GRANTS — acceso al rol authenticated
-- ══════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.config_conjunto     TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parqueaderos        TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehiculos           TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.estados_cuenta      TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pagos               TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.llamados_atencion   TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.paquetes            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.visitantes          TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.mascotas            TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.documentos_conjunto TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.pqrs                TO authenticated;


-- ══════════════════════════════════════════════════════════════
-- ÍNDICES — rendimiento en queries multi-tenant frecuentes
-- ══════════════════════════════════════════════════════════════

-- config_conjunto
CREATE INDEX IF NOT EXISTS idx_config_conjunto_conjunto ON public.config_conjunto(conjunto_id);

-- parqueaderos
CREATE INDEX IF NOT EXISTS idx_parqueaderos_conjunto    ON public.parqueaderos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_parqueaderos_apartamento ON public.parqueaderos(apartamento_id);

-- vehiculos
CREATE INDEX IF NOT EXISTS idx_vehiculos_conjunto       ON public.vehiculos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_usuario        ON public.vehiculos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_placa          ON public.vehiculos(conjunto_id, placa);

-- estados_cuenta
CREATE INDEX IF NOT EXISTS idx_estados_cuenta_conjunto  ON public.estados_cuenta(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_estados_cuenta_apto      ON public.estados_cuenta(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_estados_cuenta_periodo   ON public.estados_cuenta(conjunto_id, periodo);
CREATE INDEX IF NOT EXISTS idx_estados_cuenta_estado    ON public.estados_cuenta(conjunto_id, estado);

-- pagos
CREATE INDEX IF NOT EXISTS idx_pagos_conjunto           ON public.pagos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_pagos_apartamento        ON public.pagos(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado_cuenta      ON public.pagos(estado_cuenta_id);
CREATE INDEX IF NOT EXISTS idx_pagos_estado             ON public.pagos(conjunto_id, estado);

-- llamados_atencion
CREATE INDEX IF NOT EXISTS idx_llamados_conjunto        ON public.llamados_atencion(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_llamados_apartamento     ON public.llamados_atencion(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_llamados_estado          ON public.llamados_atencion(conjunto_id, estado);

-- paquetes
CREATE INDEX IF NOT EXISTS idx_paquetes_conjunto        ON public.paquetes(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_apartamento     ON public.paquetes(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_estado          ON public.paquetes(conjunto_id, estado);

-- visitantes
CREATE INDEX IF NOT EXISTS idx_visitantes_conjunto      ON public.visitantes(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_visitantes_apartamento   ON public.visitantes(apartamento_id);
CREATE INDEX IF NOT EXISTS idx_visitantes_activo        ON public.visitantes(conjunto_id, activo);

-- mascotas
CREATE INDEX IF NOT EXISTS idx_mascotas_conjunto        ON public.mascotas(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_mascotas_apartamento     ON public.mascotas(apartamento_id);

-- documentos
CREATE INDEX IF NOT EXISTS idx_documentos_conjunto      ON public.documentos_conjunto(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_documentos_categoria     ON public.documentos_conjunto(conjunto_id, categoria);

-- pqrs
CREATE INDEX IF NOT EXISTS idx_pqrs_conjunto            ON public.pqrs(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_pqrs_usuario             ON public.pqrs(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pqrs_estado              ON public.pqrs(conjunto_id, estado);
CREATE INDEX IF NOT EXISTS idx_pqrs_tipo                ON public.pqrs(conjunto_id, tipo);

-- apartamentos (nuevas columnas)
CREATE INDEX IF NOT EXISTS idx_apartamentos_piso        ON public.apartamentos(conjunto_id, piso);
