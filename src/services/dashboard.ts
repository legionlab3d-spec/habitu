import type { SupabaseClient } from '@supabase/supabase-js'
import type { DashboardStats } from '@/src/types'

export async function getDashboardStats(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<DashboardStats> {
  const [apartamentos, reservas, zonas, anuncios] = await Promise.all([
    supabase
      .from('apartamentos')
      .select('*', { count: 'exact', head: true })
      .eq('conjunto_id', conjuntoId),
    supabase
      .from('reservas')
      .select('*', { count: 'exact', head: true })
      .eq('conjunto_id', conjuntoId),
    supabase
      .from('zonas_comunes')
      .select('*', { count: 'exact', head: true })
      .eq('conjunto_id', conjuntoId),
    supabase
      .from('anuncios')
      .select('*', { count: 'exact', head: true })
      .eq('conjunto_id', conjuntoId),
  ])

  return {
    apartamentos: apartamentos.count ?? 0,
    reservas:     reservas.count     ?? 0,
    zonas_comunes: zonas.count       ?? 0,
    anuncios:     anuncios.count     ?? 0,
  }
}
