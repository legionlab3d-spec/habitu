-- ═══════════════════════════════════════════════════════════════
-- FASE 6 — Reservas: expiración de pago + estado expirada
-- ═══════════════════════════════════════════════════════════════

-- 1. Columna pago_expira_en (10 min desde reserva)
ALTER TABLE public.reservas
  ADD COLUMN IF NOT EXISTS pago_expira_en TIMESTAMPTZ;

-- 2. Ampliar constraint de estado para incluir 'expirada'
ALTER TABLE public.reservas DROP CONSTRAINT IF EXISTS reservas_estado_check;
ALTER TABLE public.reservas
  ADD CONSTRAINT reservas_estado_check
  CHECK (estado IN ('pendiente_pago', 'confirmada', 'cancelada', 'expirada'));

-- 3. RLS: permitir que todos los miembros del conjunto vean reservas
--    (necesario para mostrar disponibilidad en el calendario)
DROP POLICY IF EXISTS "reservas_select_residente" ON public.reservas;
DROP POLICY IF EXISTS "reservas_select" ON public.reservas;

CREATE POLICY "reservas_select"
  ON public.reservas FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());
