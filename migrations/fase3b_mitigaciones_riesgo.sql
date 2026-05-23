-- ============================================================
-- FASE 3B — MITIGACIONES DE RIESGO
-- Ejecutar completo en Supabase SQL Editor
--
-- 1. Función batch: generar_estados_cuenta()
-- 2. Supabase Storage: buckets + RLS
-- 3. Mora automática: función + pg_cron
-- 4. Código acceso visitantes: trigger automático
-- ============================================================


-- ══════════════════════════════════════════════════════════════
-- MITIGACIÓN 1 — BATCH ESTADOS DE CUENTA
-- Genera cuotas mensuales para todos los apartamentos activos
-- Se llama desde el panel admin, nunca en loop desde Next.js
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.generar_estados_cuenta(
  p_conjunto_id       UUID,
  p_periodo           VARCHAR(7),   -- formato: '2025-05'
  p_fecha_vencimiento DATE
)
RETURNS TABLE (insertados INT, omitidos INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cuota       NUMERIC(12,2);
  v_insertados  INT := 0;
  v_omitidos    INT := 0;
  v_caller_id   UUID := auth.uid();
  v_is_admin    BOOLEAN;
BEGIN
  -- Verificar que el caller es admin del conjunto
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = v_caller_id
      AND conjunto_id = p_conjunto_id
      AND rol = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo el administrador del conjunto puede generar estados de cuenta';
  END IF;

  -- Validar formato de período
  IF p_periodo !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Formato de período inválido. Use YYYY-MM (ej: 2025-05)';
  END IF;

  -- Obtener cuota configurada
  SELECT valor_cuota_mensual INTO v_cuota
  FROM public.config_conjunto
  WHERE conjunto_id = p_conjunto_id;

  IF v_cuota IS NULL THEN
    RAISE EXCEPTION 'El conjunto no tiene configurada la cuota mensual. Configúrala antes de generar estados de cuenta.';
  END IF;

  IF v_cuota = 0 THEN
    RAISE EXCEPTION 'La cuota mensual está en $0. Configura el valor antes de generar.';
  END IF;

  -- Insertar para cada apartamento activo del conjunto
  -- ON CONFLICT DO NOTHING: la constraint UNIQUE protege duplicados
  WITH resultado AS (
    INSERT INTO public.estados_cuenta (
      conjunto_id,
      apartamento_id,
      usuario_id,
      periodo,
      valor_cuota,
      fecha_vencimiento
    )
    SELECT
      a.conjunto_id,
      a.id,
      a.residente_id,
      p_periodo,
      v_cuota,
      p_fecha_vencimiento
    FROM public.apartamentos a
    WHERE a.conjunto_id = p_conjunto_id
      AND a.activo = true
    ON CONFLICT (conjunto_id, apartamento_id, periodo) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO v_insertados FROM resultado;

  -- Calcular omitidos (ya existían)
  SELECT COUNT(*) INTO v_omitidos
  FROM public.estados_cuenta
  WHERE conjunto_id = p_conjunto_id
    AND periodo = p_periodo;

  v_omitidos := v_omitidos - v_insertados;

  RETURN QUERY SELECT v_insertados, v_omitidos;
END;
$$;

-- Dar acceso a usuarios autenticados (la función valida rol internamente)
GRANT EXECUTE ON FUNCTION public.generar_estados_cuenta(UUID, VARCHAR, DATE) TO authenticated;

-- Comentario para documentación
COMMENT ON FUNCTION public.generar_estados_cuenta IS
  'Genera estados de cuenta mensuales para todos los apartamentos activos del conjunto.
   Solo puede ser llamada por el admin del conjunto.
   Uso: SELECT * FROM generar_estados_cuenta(''uuid'', ''2025-05'', ''2025-05-10'');';


-- ══════════════════════════════════════════════════════════════
-- MITIGACIÓN 2 — SUPABASE STORAGE
-- Buckets multi-tenant con RLS por conjunto_id como carpeta raíz
-- Estructura de archivos: {bucket}/{conjunto_id}/{filename}
-- ══════════════════════════════════════════════════════════════

-- Crear buckets (privados por defecto)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'comprobantes',
    'comprobantes',
    false,
    5242880,  -- 5 MB
    '{image/jpeg,image/png,image/webp,application/pdf}'
  ),
  (
    'documentos',
    'documentos',
    false,
    10485760,  -- 10 MB
    '{application/pdf,image/jpeg,image/png}'
  ),
  (
    'evidencias',
    'evidencias',
    false,
    5242880,  -- 5 MB
    '{image/jpeg,image/png,image/webp}'
  ),
  (
    'fotos',
    'fotos',
    false,
    3145728,  -- 3 MB
    '{image/jpeg,image/png,image/webp}'
  )
ON CONFLICT (id) DO NOTHING;


-- ── RLS en storage.objects ───────────────────────────────────
-- Patrón: el primer segmento del path DEBE ser el conjunto_id del usuario
-- Ejemplo path válido: "comprobantes/e29bb679-.../pago-mayo.pdf"

-- SELECT: ver solo archivos de tu conjunto
CREATE POLICY "storage_select_propio_conjunto"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id IN ('comprobantes', 'documentos', 'evidencias', 'fotos')
    AND (storage.foldername(name))[1] = public.get_my_conjunto_id()::text
  );

-- INSERT: subir solo a tu carpeta de conjunto
CREATE POLICY "storage_insert_propio_conjunto"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id IN ('comprobantes', 'documentos', 'evidencias', 'fotos')
    AND (storage.foldername(name))[1] = public.get_my_conjunto_id()::text
  );

-- UPDATE: modificar solo archivos de tu conjunto
CREATE POLICY "storage_update_propio_conjunto"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id IN ('comprobantes', 'documentos', 'evidencias', 'fotos')
    AND (storage.foldername(name))[1] = public.get_my_conjunto_id()::text
  );

-- DELETE: eliminar solo archivos de tu conjunto (admin)
CREATE POLICY "storage_delete_admin"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id IN ('comprobantes', 'documentos', 'evidencias', 'fotos')
    AND (storage.foldername(name))[1] = public.get_my_conjunto_id()::text
    AND public.is_admin()
  );


-- ══════════════════════════════════════════════════════════════
-- MITIGACIÓN 3 — MORA AUTOMÁTICA
-- Función que aplica mora a estados de cuenta vencidos
-- Se programa con pg_cron para ejecutar diariamente
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.aplicar_mora_automatica()
RETURNS TABLE (
  procesados       INT,
  con_mora         INT,
  ya_en_mora       INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_procesados  INT := 0;
  v_con_mora    INT := 0;
  v_ya_en_mora  INT := 0;
BEGIN
  -- Contar los que ya están en mora (informativo)
  SELECT COUNT(*) INTO v_ya_en_mora
  FROM public.estados_cuenta ec
  JOIN public.config_conjunto cc ON cc.conjunto_id = ec.conjunto_id
  WHERE ec.estado = 'mora'
    AND cc.mora_automatica = true;

  -- Aplicar mora: estados pendientes + vencidos + conjunto con mora habilitada
  WITH actualizados AS (
    UPDATE public.estados_cuenta ec
    SET
      valor_mora = ROUND(ec.valor_cuota * cc.porcentaje_mora / 100, 2),
      estado     = 'mora',
      updated_at = NOW()
    FROM public.config_conjunto cc
    WHERE ec.conjunto_id  = cc.conjunto_id
      AND ec.estado        = 'pendiente'
      AND ec.fecha_vencimiento < CURRENT_DATE
      AND cc.mora_automatica   = true
      AND cc.porcentaje_mora   > 0
    RETURNING ec.id
  )
  SELECT COUNT(*) INTO v_con_mora FROM actualizados;

  v_procesados := v_con_mora + v_ya_en_mora;

  RETURN QUERY SELECT v_procesados, v_con_mora, v_ya_en_mora;
END;
$$;

-- Solo postgres/service_role puede ejecutar esto (cron lo llama como postgres)
REVOKE ALL ON FUNCTION public.aplicar_mora_automatica() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.aplicar_mora_automatica() FROM authenticated;

COMMENT ON FUNCTION public.aplicar_mora_automatica IS
  'Aplica mora automática a estados de cuenta vencidos.
   Solo se ejecuta via pg_cron como postgres.
   Respeta la configuración mora_automatica y porcentaje_mora de cada conjunto.';


-- ── Habilitar pg_cron (requiere extensión activa en Supabase) ─
-- Activar primero en: Dashboard → Database → Extensions → pg_cron

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programar ejecución diaria a las 8:00 AM UTC
-- Ajustar zona horaria: 8 UTC = 3 AM Colombia (UTC-5)
SELECT cron.schedule(
  'mora-automatica-diaria',
  '0 8 * * *',
  'SELECT public.aplicar_mora_automatica()'
);

-- Para verificar que quedó programado:
-- SELECT * FROM cron.job;

-- Para detener el cron si es necesario:
-- SELECT cron.unschedule('mora-automatica-diaria');


-- ══════════════════════════════════════════════════════════════
-- MITIGACIÓN 4 — CÓDIGO DE ACCESO VISITANTES
-- Trigger que genera código automático en el servidor
-- Nunca se confía en el código enviado por el cliente
-- ══════════════════════════════════════════════════════════════

-- Función generadora: 6 caracteres alfanuméricos legibles
-- Excluye caracteres confusos: 0, O, I, 1, L
CREATE OR REPLACE FUNCTION public.generate_access_code()
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT upper(
    substring(
      translate(
        gen_random_uuid()::text,
        '01iIlLoO-',
        '23456789'
      ),
      1, 6
    )
  )
$$;

-- Trigger: siempre sobreescribe codigo_acceso al insertar
-- El cliente no puede elegir ni manipular el código
CREATE OR REPLACE FUNCTION public.set_codigo_acceso_visitante()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Siempre generar en servidor, ignorar lo que venga del cliente
  NEW.codigo_acceso := public.generate_access_code();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS visitantes_codigo_acceso ON public.visitantes;

CREATE TRIGGER visitantes_codigo_acceso
  BEFORE INSERT ON public.visitantes
  FOR EACH ROW
  EXECUTE FUNCTION public.set_codigo_acceso_visitante();

COMMENT ON TRIGGER visitantes_codigo_acceso ON public.visitantes IS
  'Genera automáticamente el código de acceso en el servidor.
   El valor enviado por el cliente siempre se reemplaza.';


-- ══════════════════════════════════════════════════════════════
-- FUNCIÓN AUXILIAR — MARCAR PAGO COMO VERIFICADO
-- Actualiza el estado del pago Y del estado de cuenta en una sola
-- transacción atómica. Evita inconsistencias si falla a mitad.
-- ══════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.verificar_pago(
  p_pago_id        UUID,
  p_nuevo_estado   VARCHAR(30)  -- 'verificado' o 'rechazado'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pago              RECORD;
  v_caller_conjunto   UUID := public.get_my_conjunto_id();
BEGIN
  -- Solo admin puede verificar
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Solo el administrador puede verificar pagos';
  END IF;

  -- Obtener el pago
  SELECT * INTO v_pago FROM public.pagos WHERE id = p_pago_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pago no encontrado';
  END IF;

  -- Verificar que el pago pertenece al conjunto del admin
  IF v_pago.conjunto_id != v_caller_conjunto THEN
    RAISE EXCEPTION 'No tienes permisos sobre este pago';
  END IF;

  -- Actualizar pago
  UPDATE public.pagos
  SET
    estado         = p_nuevo_estado,
    verificado_por = auth.uid()
  WHERE id = p_pago_id;

  -- Si se verifica, marcar el estado de cuenta como pagado
  IF p_nuevo_estado = 'verificado' AND v_pago.estado_cuenta_id IS NOT NULL THEN
    UPDATE public.estados_cuenta
    SET
      estado      = 'pagado',
      fecha_pago  = v_pago.fecha_pago,
      valor_mora  = 0,
      updated_at  = NOW()
    WHERE id = v_pago.estado_cuenta_id;
  END IF;

END;
$$;

GRANT EXECUTE ON FUNCTION public.verificar_pago(UUID, VARCHAR) TO authenticated;
