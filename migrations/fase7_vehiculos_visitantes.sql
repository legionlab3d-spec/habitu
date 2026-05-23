-- ============================================================
-- FASE 7 — VEHÍCULOS CON APROBACIÓN + VISITANTES CON VEHÍCULO
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================


-- ── 1. VEHICULOS: columnas de aprobación ────────────────────

ALTER TABLE public.vehiculos
  ADD COLUMN IF NOT EXISTS estado TEXT NOT NULL DEFAULT 'pendiente_aprobacion'
    CHECK (estado IN ('pendiente_aprobacion', 'aprobado', 'rechazado')),
  ADD COLUMN IF NOT EXISTS aprobado_por UUID REFERENCES public.usuarios(id),
  ADD COLUMN IF NOT EXISTS aprobado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS comentarios_admin TEXT;


-- ── 2. VISITANTES: campos de vehículo ───────────────────────

ALTER TABLE public.visitantes
  ADD COLUMN IF NOT EXISTS tipo_vehiculo_visitante TEXT
    CHECK (tipo_vehiculo_visitante IN ('carro', 'moto')),
  ADD COLUMN IF NOT EXISTS color_vehiculo_visitante TEXT,
  ADD COLUMN IF NOT EXISTS parqueadero_tipo TEXT DEFAULT 'ninguno'
    CHECK (parqueadero_tipo IN ('ninguno', 'propio', 'visitantes'));


-- ── 3. VEHICULO_DOCUMENTOS ──────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vehiculo_documentos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehiculo_id   UUID NOT NULL REFERENCES public.vehiculos(id) ON DELETE CASCADE,
  conjunto_id   UUID NOT NULL REFERENCES public.conjuntos(id),
  tipo_documento TEXT NOT NULL
    CHECK (tipo_documento IN ('soat', 'tarjeta_propiedad', 'otro')),
  archivo_url   TEXT NOT NULL,
  nombre_archivo TEXT,
  uploaded_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.vehiculo_documentos ENABLE ROW LEVEL SECURITY;

-- Todos los del conjunto pueden ver los documentos (admin y propietario)
CREATE POLICY "vdoc_select"
  ON public.vehiculo_documentos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

-- Solo insertar los del propio conjunto
CREATE POLICY "vdoc_insert"
  ON public.vehiculo_documentos FOR INSERT
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

-- Solo admin puede eliminar
CREATE POLICY "vdoc_delete_admin"
  ON public.vehiculo_documentos FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── 4. RLS vehiculos: admin puede actualizar estado ─────────

DROP POLICY IF EXISTS "vehiculos_update_residente" ON public.vehiculos;
DROP POLICY IF EXISTS "vehiculos_admin_all" ON public.vehiculos;

-- Residente actualiza solo sus propios vehículos (campos no-estado)
CREATE POLICY "vehiculos_update_residente"
  ON public.vehiculos FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id() AND usuario_id = auth.uid())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

-- Admin puede hacer todo (incluye aprobar/rechazar)
CREATE POLICY "vehiculos_admin_all"
  ON public.vehiculos FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id() AND public.is_admin());


-- ── 5. GRANTS ───────────────────────────────────────────────

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehiculo_documentos TO authenticated;


-- ── 6. ÍNDICES ──────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vehiculo_docs_vehiculo
  ON public.vehiculo_documentos(vehiculo_id);
CREATE INDEX IF NOT EXISTS idx_vehiculo_docs_conjunto
  ON public.vehiculo_documentos(conjunto_id);
CREATE INDEX IF NOT EXISTS idx_vehiculos_estado
  ON public.vehiculos(conjunto_id, estado);
