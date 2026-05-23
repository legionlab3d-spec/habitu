import type { SupabaseClient } from '@supabase/supabase-js'

export interface Vehiculo {
  id: string
  conjunto_id: string
  apartamento_id: string | null
  usuario_id: string | null
  parqueadero_id: string | null
  placa: string
  marca: string | null
  modelo: string | null
  color: string | null
  tipo: 'carro' | 'moto' | 'bicicleta' | 'otro'
  activo: boolean
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const TIPO_VEHICULO: Record<Vehiculo['tipo'], string> = {
  carro:     'Carro',
  moto:      'Moto',
  bicicleta: 'Bicicleta',
  otro:      'Otro',
}

export async function getVehiculos(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Vehiculo[]> {
  const { data } = await supabase
    .from('vehiculos')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Vehiculo[]
}

export async function getMisVehiculos(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Vehiculo[]> {
  const { data } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('usuario_id', usuarioId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Vehiculo[]
}
