import type { SupabaseClient } from '@supabase/supabase-js'

export type TipoUnidad = 'apartamento' | 'casa' | 'local' | 'bodega'

export const TIPO_UNIDAD: Record<TipoUnidad, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  local: 'Local',
  bodega: 'Bodega',
}

export interface Apartamento {
  id: string
  conjunto_id: string
  torre: string | null
  numero: string
  tipo_unidad: TipoUnidad
  propietario_id: string | null
  residente_id: string | null
  created_at: string
}

export async function getMyApartamento(
  supabase: SupabaseClient,
  conjuntoId: string,
  userId: string
): Promise<{ id: string; numero: string; torre: string | null } | null> {
  const { data } = await supabase
    .from('apartamentos')
    .select('id, numero, torre')
    .eq('conjunto_id', conjuntoId)
    .or(`residente_id.eq.${userId},propietario_id.eq.${userId}`)
    .single()
  return data ?? null
}

export async function getApartamentos(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Apartamento[]> {
  const { data, error } = await supabase
    .from('apartamentos')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .order('torre', { ascending: true, nullsFirst: false })
    .order('numero', { ascending: true })

  if (error || !data) return []
  return data as Apartamento[]
}
