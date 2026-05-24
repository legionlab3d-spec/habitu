-- ─────────────────────────────────────────────────────────────────────────────
-- FASE 9 — Trazabilidad: Llamados de Atención + Paquetes
-- ─────────────────────────────────────────────────────────────────────────────
-- Ejecutar en Supabase SQL Editor


-- ═══════════════════════════════════════════════════════════════════════════
-- 1. LLAMADOS DE ATENCIÓN — fecha de transición a "en_proceso"
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE llamados_atencion
  ADD COLUMN IF NOT EXISTS fecha_en_proceso TIMESTAMPTZ;

-- Asegurar que updated_at se actualiza automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_llamados_atencion_updated_at ON llamados_atencion;
CREATE TRIGGER update_llamados_atencion_updated_at
  BEFORE UPDATE ON llamados_atencion
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ═══════════════════════════════════════════════════════════════════════════
-- 2. PAQUETES — trazabilidad recepción y entrega
-- ═══════════════════════════════════════════════════════════════════════════

-- Quién recibió el paquete del courier (texto libre: "Portero Carlos")
ALTER TABLE paquetes
  ADD COLUMN IF NOT EXISTS recibido_por_nombre TEXT;

-- Quién retiró el paquete (residente o persona autorizada)
ALTER TABLE paquetes
  ADD COLUMN IF NOT EXISTS entregado_a TEXT;

-- Quién hizo la entrega al residente (portero/admin)
ALTER TABLE paquetes
  ADD COLUMN IF NOT EXISTS entregado_por TEXT;

-- Asegurar que fecha_recepcion tiene componente de hora (TIMESTAMPTZ)
-- Si ya es TIMESTAMPTZ esta línea no cambia nada; si es DATE la convierte.
ALTER TABLE paquetes
  ALTER COLUMN fecha_recepcion TYPE TIMESTAMPTZ
  USING fecha_recepcion::TIMESTAMPTZ;

ALTER TABLE paquetes
  ALTER COLUMN fecha_recepcion SET DEFAULT NOW();

-- Ampliar el check constraint para incluir pendiente_entrega
-- (se elimina el anterior y se crea el nuevo)
ALTER TABLE paquetes DROP CONSTRAINT IF EXISTS paquetes_estado_check;
ALTER TABLE paquetes ADD CONSTRAINT paquetes_estado_check
  CHECK (estado IN ('en_porteria', 'pendiente_entrega', 'entregado', 'devuelto'));

-- updated_at para paquetes (si no existe)
ALTER TABLE paquetes
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

DROP TRIGGER IF EXISTS update_paquetes_updated_at ON paquetes;
CREATE TRIGGER update_paquetes_updated_at
  BEFORE UPDATE ON paquetes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
