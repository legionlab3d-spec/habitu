import type { SupabaseClient } from '@supabase/supabase-js'

export interface Apartamento {
  id: string
  conjunto_id: string
  torre: string | null
  numero: string
  propietario_id: string | null
  residente_id: string | null
  created_at: string
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
