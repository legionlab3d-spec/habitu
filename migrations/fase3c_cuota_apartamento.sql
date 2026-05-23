-- ============================================================
-- FASE 3C — CUOTA POR APARTAMENTO
-- Extiende apartamentos con cuota_mensual individual
-- Actualiza generar_estados_cuenta() para usar COALESCE
-- ============================================================

-- Cuota individual por apartamento (NULL = usa cuota por defecto del conjunto)
ALTER TABLE public.apartamentos
  ADD COLUMN IF NOT EXISTS cuota_mensual NUMERIC(12,2);

COMMENT ON COLUMN public.apartamentos.cuota_mensual IS
  'Cuota mensual específica. NULL = usa config_conjunto.valor_cuota_mensual';

-- Índice para queries de cuota por conjunto
CREATE INDEX IF NOT EXISTS idx_apartamentos_cuota
  ON public.apartamentos(conjunto_id, cuota_mensual)
  WHERE cuota_mensual IS NOT NULL;


-- ── Actualizar generar_estados_cuenta() ─────────────────────
-- Usa COALESCE(a.cuota_mensual, v_cuota) por apartamento

CREATE OR REPLACE FUNCTION public.generar_estados_cuenta(
  p_conjunto_id       UUID,
  p_periodo           VARCHAR(7),
  p_fecha_vencimiento DATE
)
RETURNS TABLE (insertados INT, omitidos INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cuota_default NUMERIC(12,2);
  v_insertados    INT := 0;
  v_total_aptos   INT := 0;
  v_caller_id     UUID := auth.uid();
  v_is_admin      BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE id = v_caller_id
      AND conjunto_id = p_conjunto_id
      AND rol = 'admin'
  ) INTO v_is_admin;

  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Solo el administrador del conjunto puede generar estados de cuenta';
  END IF;

  IF p_periodo !~ '^\d{4}-\d{2}$' THEN
    RAISE EXCEPTION 'Formato de período inválido. Use YYYY-MM';
  END IF;

  SELECT valor_cuota_mensual INTO v_cuota_default
  FROM public.config_conjunto
  WHERE conjunto_id = p_conjunto_id;

  -- Contar apartamentos activos para calcular omitidos
  SELECT COUNT(*) INTO v_total_aptos
  FROM public.apartamentos
  WHERE conjunto_id = p_conjunto_id AND activo = true;

  -- Insertar usando cuota del apartamento o la cuota por defecto
  -- Si el apartamento no tiene cuota individual Y el conjunto tampoco tiene
  -- cuota default configurada, se inserta con 0 (el admin puede editar después)
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
      COALESCE(a.cuota_mensual, v_cuota_default, 0),
      p_fecha_vencimiento
    FROM public.apartamentos a
    WHERE a.conjunto_id = p_conjunto_id
      AND a.activo = true
    ON CONFLICT (conjunto_id, apartamento_id, periodo) DO NOTHING
    RETURNING id
  )
  SELECT COUNT(*) INTO v_insertados FROM resultado;

  RETURN QUERY SELECT v_insertados, (v_total_aptos - v_insertados);
END;
$$;
