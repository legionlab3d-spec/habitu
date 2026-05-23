import type { SupabaseClient } from '@supabase/supabase-js'
import type { Usuario } from '@/src/types'

export async function getUsuariosSinApartamento(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Pick<Usuario, 'id' | 'nombre' | 'email' | 'rol'>[]> {
  // Usuarios del conjunto que no son admin y no están vinculados a ningún apartamento
  const { data: vinculados } = await supabase
    .from('apartamentos')
    .select('propietario_id, residente_id')
    .eq('conjunto_id', conjuntoId)

  const idsVinculados = new Set<string>()
  for (const a of vinculados ?? []) {
    if (a.propietario_id) idsVinculados.add(a.propietario_id)
    if (a.residente_id)   idsVinculados.add(a.residente_id)
  }

  const { data } = await supabase
    .from('usuarios')
    .select('id, nombre, email, rol')
    .eq('conjunto_id', conjuntoId)
    .in('rol', ['propietario', 'residente'])
    .order('nombre')

  return (data ?? []).filter((u) => !idsVinculados.has(u.id)) as Pick<Usuario, 'id' | 'nombre' | 'email' | 'rol'>[]
}

export async function getUsuarioPerfil(
  supabase: SupabaseClient,
  userId: string
): Promise<Usuario | null> {
  const { data, error } = await supabase
    .from('usuarios')
    .select('*, conjuntos(id, nombre)')
    .eq('id', userId)
    .single()

  if (error || !data) return null
  return data as Usuario
}
