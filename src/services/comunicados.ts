import type { SupabaseClient } from '@supabase/supabase-js'

export interface Comunicado {
  id: string
  conjunto_id: string
  creado_por: string
  titulo: string
  contenido: string
  tipo: 'informativo' | 'urgente' | 'evento' | 'mantenimiento'
  destinatario: 'todos' | 'propietarios' | 'residentes'
  activo: boolean
  created_at: string
}

export async function getComunicados(
  supabase: SupabaseClient,
  conjuntoId: string,
  soloActivos = false
): Promise<Comunicado[]> {
  let query = supabase
    .from('anuncios')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .order('created_at', { ascending: false })

  if (soloActivos) query = query.eq('activo', true)

  const { data, error } = await query
  if (error || !data) return []
  return data as Comunicado[]
}
