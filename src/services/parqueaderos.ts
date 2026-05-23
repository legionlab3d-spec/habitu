import type { SupabaseClient } from '@supabase/supabase-js'

export interface Parqueadero {
  id: string
  conjunto_id: string
  apartamento_id: string | null
  usuario_id: string | null
  numero: string
  tipo: 'carro' | 'moto' | 'visitante' | 'bicicleta'
  cubierto: boolean
  activo: boolean
  observaciones: string | null
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const TIPO_PARQUEADERO: Record<Parqueadero['tipo'], string> = {
  carro:     'Carro',
  moto:      'Moto',
  visitante: 'Visitante',
  bicicleta: 'Bicicleta',
}

export async function getParqueaderos(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Parqueadero[]> {
  const { data } = await supabase
    .from('parqueaderos')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('activo', true)
    .order('numero', { ascending: true })

  return (data ?? []) as Parqueadero[]
}

export async function getMiParqueadero(
  supabase: SupabaseClient,
  conjuntoId: string,
  apartamentoId: string
): Promise<Parqueadero | null> {
  const { data } = await supabase
    .from('parqueaderos')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('apartamento_id', apartamentoId)
    .eq('activo', true)
    .limit(1)

  return data?.[0] as Parqueadero ?? null
}
