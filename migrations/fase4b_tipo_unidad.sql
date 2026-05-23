-- ═══════════════════════════════════════════════════════════════
-- FASE 4B — Tipo de unidad en apartamentos
-- ═══════════════════════════════════════════════════════════════
-- Agrega columna tipo_unidad para soportar copropiedades mixtas:
-- apartamentos, casas, locales y bodegas en el mismo conjunto.
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE public.apartamentos
  ADD COLUMN IF NOT EXISTS tipo_unidad TEXT NOT NULL DEFAULT 'apartamento'
  CHECK (tipo_unidad IN ('apartamento', 'casa', 'local', 'bodega'));
