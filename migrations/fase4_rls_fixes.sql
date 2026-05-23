-- ═══════════════════════════════════════════════════════════════
-- FASE 4 — Correcciones de RLS
-- ═══════════════════════════════════════════════════════════════
--
-- Bug 1: llamados_atencion.llamados_select_residente referencia
--         la columna "usuario_id" que NO existe en esa tabla.
--         La tabla tiene "apartamento_id" y el residente debe
--         ver los llamados correspondientes a su apartamento.
--
-- Bug 2: documentos_conjunto.documentos_select muestra TODOS los
--         documentos a todos los usuarios del conjunto, ignorando
--         la columna "publico". Los documentos privados solo deben
--         ser visibles para el admin.
-- ═══════════════════════════════════════════════════════════════


-- ── FIX 1: llamados_atencion ────────────────────────────────────

DROP POLICY IF EXISTS "llamados_select_residente" ON public.llamados_atencion;

-- El residente ve únicamente los llamados cuyo apartamento_id
-- corresponde a un apartamento donde él es residente.
CREATE POLICY "llamados_select_residente"
  ON public.llamados_atencion FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND EXISTS (
      SELECT 1
      FROM public.apartamentos a
      WHERE a.id = public.llamados_atencion.apartamento_id
        AND a.residente_id = auth.uid()
    )
  );


-- ── FIX 2: documentos_conjunto ─────────────────────────────────

DROP POLICY IF EXISTS "documentos_select" ON public.documentos_conjunto;
DROP POLICY IF EXISTS "documentos_select_residente" ON public.documentos_conjunto;

-- Residentes solo ven documentos marcados como públicos.
-- Admin siempre ve todos.
CREATE POLICY "documentos_select_residente"
  ON public.documentos_conjunto FOR SELECT
  USING (
    conjunto_id = public.get_my_conjunto_id()
    AND (publico = true OR public.is_admin())
  );


-- ── REVISIÓN ADICIONAL: visitantes ─────────────────────────────
-- La política existente para UPDATE de residente era correcta pero
-- incompleta: no cubría desactivar (activo = false). Se deja como
-- está porque nuestra app solo hace UPDATE desde el admin.
-- Sin embargo, agregamos una restricción extra: el residente solo
-- puede insertar visitantes para apartamentos donde él es residente.

DROP POLICY IF EXISTS "visitantes_insert_residente" ON public.visitantes;

CREATE POLICY "visitantes_insert_residente"
  ON public.visitantes FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND autorizado_por = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.apartamentos a
      WHERE a.id = public.visitantes.apartamento_id
        AND a.residente_id = auth.uid()
    )
  );


-- ── REVISIÓN ADICIONAL: mascotas ───────────────────────────────
-- La política de INSERT verifica usuario_id = auth.uid() pero
-- también debemos asegurar que el apartamento_id pertenezca al
-- usuario autenticado para evitar que registre mascotas en
-- apartamentos ajenos.

DROP POLICY IF EXISTS "mascotas_insert_residente" ON public.mascotas;

CREATE POLICY "mascotas_insert_residente"
  ON public.mascotas FOR INSERT
  WITH CHECK (
    conjunto_id = public.get_my_conjunto_id()
    AND usuario_id = auth.uid()
    AND EXISTS (
      SELECT 1
      FROM public.apartamentos a
      WHERE a.id = public.mascotas.apartamento_id
        AND a.residente_id = auth.uid()
    )
  );


-- ── REVISIÓN ADICIONAL: pqrs ───────────────────────────────────
-- La política update_residente solo permite actualizar cuando
-- estado = 'recibido', pero nuestras acciones no permiten que
-- el residente modifique contenido (solo el admin responde).
-- Se elimina esa política vacía para que solo el admin actualice.

DROP POLICY IF EXISTS "pqrs_update_residente" ON public.pqrs;
-- El admin ya tiene pqrs_all_admin que cubre UPDATE.
-- Si en el futuro el residente puede adjuntar info adicional,
-- se puede reintroducir con condiciones adecuadas.


-- ── STORAGE: política adicional para bucket "evidencias" ────────
-- Residentes pueden leer evidencias de su propio conjunto.
-- La ruta es: {conjunto_id}/{usuario_id}/{archivo}
-- La política de la fase 3b ya cubre esto para comprobantes.
-- Verificamos que el bucket "evidencias" tenga la misma lógica.

-- (No se recrea — ya fue definida en fase3b_mitigaciones_riesgo.sql
--  con la misma condición de conjunto_id en la ruta)


-- ── FUNCIÓN AUXILIAR: residente_apartamento_id ─────────────────
-- Devuelve el apartamento_id del usuario autenticado en su conjunto.
-- Útil para futuras políticas más complejas.

CREATE OR REPLACE FUNCTION public.get_my_apartamento_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.apartamentos
  WHERE conjunto_id = public.get_my_conjunto_id()
    AND residente_id = auth.uid()
  LIMIT 1;
$$;
