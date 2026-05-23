import type { SupabaseClient } from '@supabase/supabase-js'

export interface ZonaComun {
  id: string
  conjunto_id: string
  nombre: string
  descripcion: string | null
  capacidad: number | null
  precio_por_hora: number
  requiere_aprobacion: boolean
  activa: boolean
  created_at: string
}

export async function getZonas(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<ZonaComun[]> {
  const { data, error } = await supabase
    .from('zonas_comunes')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .order('nombre', { ascending: true })

  if (error || !data) return []
  return data as ZonaComun[]
}
