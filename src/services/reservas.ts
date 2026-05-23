import type { SupabaseClient } from '@supabase/supabase-js'

export interface Reserva {
  id: string
  conjunto_id: string
  usuario_id: string
  zona_id: string
  apartamento_id: string | null
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion_horas: number
  valor_total: number
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada'
  observaciones: string | null
  codigo_reserva: string | null
  created_at: string
  zonas_comunes?: { nombre: string }
  usuarios?: { nombre: string }
}

export async function getReservas(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Reserva[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, zonas_comunes(nombre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('fecha', { ascending: false })

  if (error || !data) return []
  return data as Reserva[]
}

export async function getReservasResidente(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Reserva[]> {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, zonas_comunes(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('usuario_id', usuarioId)
    .order('fecha', { ascending: false })

  if (error || !data) return []
  return data as Reserva[]
}
