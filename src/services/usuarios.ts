import type { SupabaseClient } from '@supabase/supabase-js'
import type { Usuario } from '@/src/types'

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
