-- ============================================================
-- FASE 8 — CARTERA: CAMPOS INTEGRACIÓN API FUTURA
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================

-- Campos de integración contable en config_conjunto
-- Permiten conectar el conjunto a su software contable externo
-- sin modificar la lógica de cartera interna (modo manual)

ALTER TABLE public.config_conjunto
  ADD COLUMN IF NOT EXISTS sistema_contable TEXT DEFAULT 'manual'
    CHECK (sistema_contable IN ('manual', 'siigo', 'helisa', 'sisco', 'world_office', 'otro')),
  ADD COLUMN IF NOT EXISTS contable_api_url TEXT,
  ADD COLUMN IF NOT EXISTS contable_ultima_sync TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contable_estado TEXT DEFAULT 'no_configurado'
    CHECK (contable_estado IN ('no_configurado', 'conectado', 'error'));

-- Índice útil para filtrar conjuntos conectados
CREATE INDEX IF NOT EXISTS idx_config_sistema_contable
  ON public.config_conjunto(conjunto_id, sistema_contable);
