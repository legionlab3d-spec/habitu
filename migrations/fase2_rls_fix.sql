-- ============================================================
-- FASE 2 — FIX COMPLETO (ejecutar completo en SQL Editor)
-- Borra TODAS las políticas existentes antes de recrearlas
-- ============================================================

-- ── 1. BORRAR TODAS LAS POLÍTICAS EXISTENTES ────────────────
-- Usa pg_policies para eliminar cualquier política sin importar nombre

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'conjuntos', 'usuarios', 'apartamentos',
        'zonas_comunes', 'reservas', 'anuncios'
      )
  LOOP
    EXECUTE format(
      'DROP POLICY IF EXISTS %I ON public.%I',
      r.policyname, r.tablename
    );
  END LOOP;
END;
$$;

-- ── 2. FUNCIÓN AUXILIAR (evita recursión) ───────────────────

CREATE OR REPLACE FUNCTION public.get_my_conjunto_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conjunto_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- ── 3. HABILITAR RLS ────────────────────────────────────────

ALTER TABLE conjuntos     ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios      ENABLE ROW LEVEL SECURITY;
ALTER TABLE apartamentos  ENABLE ROW LEVEL SECURITY;
ALTER TABLE zonas_comunes ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas      ENABLE ROW LEVEL SECURITY;
ALTER TABLE anuncios      ENABLE ROW LEVEL SECURITY;

-- ── 4. CONJUNTOS ─────────────────────────────────────────────

-- Usuario autenticado puede insertar (flujo de registro inicial)
CREATE POLICY "conjuntos_insert"
  ON conjuntos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Solo puede leer su propio conjunto
CREATE POLICY "conjuntos_select"
  ON conjuntos FOR SELECT
  USING (id = public.get_my_conjunto_id());

CREATE POLICY "conjuntos_update"
  ON conjuntos FOR UPDATE
  USING (id = public.get_my_conjunto_id());

CREATE POLICY "conjuntos_delete"
  ON conjuntos FOR DELETE
  USING (id = public.get_my_conjunto_id());

-- ── 5. USUARIOS ──────────────────────────────────────────────

-- Puede ver su propio perfil (sin subquery, sin recursión)
CREATE POLICY "usuarios_select_own"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- Puede ver otros del mismo conjunto (función no recursiva)
CREATE POLICY "usuarios_select_conjunto"
  ON usuarios FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

-- Solo puede insertar su propio perfil
CREATE POLICY "usuarios_insert"
  ON usuarios FOR INSERT
  WITH CHECK (id = auth.uid());

-- Solo puede actualizar su propio perfil
CREATE POLICY "usuarios_update"
  ON usuarios FOR UPDATE
  USING (id = auth.uid());

-- ── 6. APARTAMENTOS ──────────────────────────────────────────

CREATE POLICY "apartamentos_select"
  ON apartamentos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "apartamentos_all"
  ON apartamentos FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

-- ── 7. ZONAS_COMUNES ─────────────────────────────────────────

CREATE POLICY "zonas_select"
  ON zonas_comunes FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "zonas_all"
  ON zonas_comunes FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

-- ── 8. RESERVAS ──────────────────────────────────────────────

CREATE POLICY "reservas_select"
  ON reservas FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "reservas_all"
  ON reservas FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

-- ── 9. ANUNCIOS ──────────────────────────────────────────────

CREATE POLICY "anuncios_select"
  ON anuncios FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "anuncios_all"
  ON anuncios FOR ALL
  USING (conjunto_id = public.get_my_conjunto_id())
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());
