-- ============================================================
-- FASE 2 — Políticas RLS (versión corregida sin recursión)
-- Ejecutar completo en Supabase SQL Editor
-- ============================================================

-- ── 1. FUNCIÓN AUXILIAR (evita recursión infinita) ──────────
-- SECURITY DEFINER = bypassa RLS al leer usuarios
CREATE OR REPLACE FUNCTION public.get_my_conjunto_id()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT conjunto_id FROM public.usuarios WHERE id = auth.uid()
$$;

-- ── 2. LIMPIAR POLÍTICAS PREVIAS ─────────────────────────────

DROP POLICY IF EXISTS "Admin ve su conjunto"                        ON conjuntos;
DROP POLICY IF EXISTS "Usuario autenticado puede crear conjunto"    ON conjuntos;
DROP POLICY IF EXISTS "Admin puede actualizar su conjunto"          ON conjuntos;

DROP POLICY IF EXISTS "Usuarios ven su conjunto"                    ON usuarios;
DROP POLICY IF EXISTS "Usuario puede crear su perfil"               ON usuarios;
DROP POLICY IF EXISTS "Usuario puede actualizar su perfil"          ON usuarios;

DROP POLICY IF EXISTS "Usuarios ven apartamentos de su conjunto"    ON apartamentos;
DROP POLICY IF EXISTS "Admin puede gestionar apartamentos"          ON apartamentos;

DROP POLICY IF EXISTS "Usuarios ven zonas de su conjunto"           ON zonas_comunes;
DROP POLICY IF EXISTS "Admin puede gestionar zonas"                 ON zonas_comunes;

DROP POLICY IF EXISTS "Usuarios ven reservas de su conjunto"        ON reservas;
DROP POLICY IF EXISTS "Residente puede crear reservas"              ON reservas;
DROP POLICY IF EXISTS "Admin puede gestionar todas las reservas"    ON reservas;

DROP POLICY IF EXISTS "Usuarios ven anuncios de su conjunto"        ON anuncios;
DROP POLICY IF EXISTS "Admin puede gestionar anuncios"              ON anuncios;

-- ── 3. CONJUNTOS ─────────────────────────────────────────────

ALTER TABLE conjuntos ENABLE ROW LEVEL SECURITY;

-- Leer: usuario ve su propio conjunto (usando función, sin recursión)
CREATE POLICY "conjuntos_select"
  ON conjuntos FOR SELECT
  USING (id = public.get_my_conjunto_id());

-- Insertar: cualquier usuario autenticado puede crear un conjunto
-- (necesario para el flujo de registro inicial)
CREATE POLICY "conjuntos_insert"
  ON conjuntos FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Actualizar: solo admin de ese conjunto
CREATE POLICY "conjuntos_update"
  ON conjuntos FOR UPDATE
  USING (id = public.get_my_conjunto_id());

-- Borrar: solo admin
CREATE POLICY "conjuntos_delete"
  ON conjuntos FOR DELETE
  USING (id = public.get_my_conjunto_id());

-- ── 4. USUARIOS ──────────────────────────────────────────────

ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;

-- Leer propio perfil (sin subquery, sin recursión)
CREATE POLICY "usuarios_select_own"
  ON usuarios FOR SELECT
  USING (id = auth.uid());

-- Leer perfiles del mismo conjunto (usando función, sin recursión)
CREATE POLICY "usuarios_select_conjunto"
  ON usuarios FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

-- Insertar: solo tu propio perfil
CREATE POLICY "usuarios_insert"
  ON usuarios FOR INSERT
  WITH CHECK (id = auth.uid());

-- Actualizar: solo tu propio perfil
CREATE POLICY "usuarios_update"
  ON usuarios FOR UPDATE
  USING (id = auth.uid());

-- ── 5. APARTAMENTOS ──────────────────────────────────────────

ALTER TABLE apartamentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "apartamentos_select"
  ON apartamentos FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "apartamentos_insert"
  ON apartamentos FOR INSERT
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "apartamentos_update"
  ON apartamentos FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "apartamentos_delete"
  ON apartamentos FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id());

-- ── 6. ZONAS_COMUNES ─────────────────────────────────────────

ALTER TABLE zonas_comunes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "zonas_select"
  ON zonas_comunes FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "zonas_insert"
  ON zonas_comunes FOR INSERT
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "zonas_update"
  ON zonas_comunes FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "zonas_delete"
  ON zonas_comunes FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id());

-- ── 7. RESERVAS ──────────────────────────────────────────────

ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reservas_select"
  ON reservas FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "reservas_insert"
  ON reservas FOR INSERT
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "reservas_update"
  ON reservas FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "reservas_delete"
  ON reservas FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id());

-- ── 8. ANUNCIOS ──────────────────────────────────────────────

ALTER TABLE anuncios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anuncios_select"
  ON anuncios FOR SELECT
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "anuncios_insert"
  ON anuncios FOR INSERT
  WITH CHECK (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "anuncios_update"
  ON anuncios FOR UPDATE
  USING (conjunto_id = public.get_my_conjunto_id());

CREATE POLICY "anuncios_delete"
  ON anuncios FOR DELETE
  USING (conjunto_id = public.get_my_conjunto_id());
