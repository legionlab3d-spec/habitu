import type { SupabaseClient } from '@supabase/supabase-js'

export interface Visitante {
  id: string
  conjunto_id: string
  apartamento_id: string
  autorizado_por: string
  nombre: string
  documento: string | null
  placa_vehiculo: string | null
  tipo_visita: 'persona' | 'vehiculo' | 'delivery' | 'servicio'
  tipo_vehiculo_visitante: 'carro' | 'moto' | null
  color_vehiculo_visitante: string | null
  parqueadero_tipo: 'ninguno' | 'propio' | 'visitantes'
  codigo_acceso: string | null
  fecha_expiracion: string | null
  fecha_ingreso: string | null
  fecha_salida: string | null
  activo: boolean
  observaciones: string | null
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  autorizadores?: { nombre: string } | null
}

export const TIPO_VISITA: Record<Visitante['tipo_visita'], string> = {
  persona:  'Persona',
  vehiculo: 'Vehículo',
  delivery: 'Delivery',
  servicio: 'Servicio',
}

export async function getVisitantes(
  supabase: SupabaseClient,
  conjuntoId: string,
  soloActivos = false
): Promise<Visitante[]> {
  let query = supabase
    .from('visitantes')
    .select('*, apartamentos(numero, torre), autorizadores:usuarios!visitantes_autorizado_por_fkey(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (soloActivos) {
    query = query.eq('activo', true).is('fecha_salida', null)
  }

  const { data } = await query
  return (data ?? []) as Visitante[]
}

export async function getMisVisitantes(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Visitante[]> {
  const { data } = await supabase
    .from('visitantes')
    .select('*, apartamentos(numero, torre)')
    .eq('conjunto_id', conjuntoId)
    .eq('autorizado_por', usuarioId)
    .order('created_at', { ascending: false })
    .limit(50)

  return (data ?? []) as Visitante[]
}
