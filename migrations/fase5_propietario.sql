-- ═══════════════════════════════════════════════════════════════
-- FASE 5 — Rol propietario
-- ═══════════════════════════════════════════════════════════════
-- Agrega el rol 'propietario' para diferenciar dueños de arrendatarios.
-- Un apartamento puede tener propietario_id Y residente_id distintos.
-- El propietario tiene el mismo acceso que el residente.
-- ═══════════════════════════════════════════════════════════════

-- 1. Ampliar el check constraint de rol
ALTER TABLE public.usuarios
  DROP CONSTRAINT IF EXISTS usuarios_rol_check;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_rol_check
  CHECK (rol IN ('admin', 'propietario', 'residente'));

-- 2. Actualizar get_my_apartamento_id para cubrir propietario también
CREATE OR REPLACE FUNCTION public.get_my_apartamento_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.apartamentos
  WHERE conjunto_id = public.get_my_conjunto_id()
    AND (residente_id = auth.uid() OR propietario_id = auth.uid())
  LIMIT 1;
$$;

-- 3. RLS: llamados — el propietario también puede ver los llamados de su apto
DROP POLICY IF EXISTS "llamados_select_residente" ON public.llamados_atencion;
CREATE POLICY "llamados_select_residente"
  ON public.llamados_atencion FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND EXISTS (
      SELECT 1 FROM public.apartamentos a
      WHERE a.id = public.llamados_atencion.apartamento_id
        AND (a.residente_id = auth.uid() OR a.propietario_id = auth.uid())
    )
  );

-- 4. RLS: visitantes — propietario también puede insertar
DROP POLICY IF EXISTS "visitantes_insert_residente" ON public.visitantes;
CREATE POLICY "visitantes_insert_residente"
  ON public.visitantes FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND autorizado_por = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.apartamentos a
      WHERE a.id = public.visitantes.apartamento_id
        AND (a.residente_id = auth.uid() OR a.propietario_id = auth.uid())
    )
  );

-- 5. RLS: mascotas — propietario también puede insertar
DROP POLICY IF EXISTS "mascotas_insert_residente" ON public.mascotas;
CREATE POLICY "mascotas_insert_residente"
  ON public.mascotas FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.apartamentos a
      WHERE a.id = public.mascotas.apartamento_id
        AND (a.residente_id = auth.uid() OR a.propietario_id = auth.uid())
    )
  );
