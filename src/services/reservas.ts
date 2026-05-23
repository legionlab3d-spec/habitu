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
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada' | 'expirada'
  pago_expira_en: string | null
  observaciones: string | null
  codigo_reserva: string | null
  created_at: string
  zonas_comunes?: { nombre: string }
  usuarios?: { nombre: string }
}

export interface ReservaActiva {
  id: string
  zona_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  estado: string
  pago_expira_en: string | null
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

// Todas las reservas activas del conjunto (para mostrar disponibilidad)
export async function getReservasActivas(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<ReservaActiva[]> {
  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('reservas')
    .select('id, zona_id, fecha, hora_inicio, hora_fin, estado, pago_expira_en')
    .eq('conjunto_id', conjuntoId)
    .in('estado', ['pendiente_pago', 'confirmada'])
    .gte('fecha', today)

  return (data ?? []) as ReservaActiva[]
}

export async function getReserva(
  supabase: SupabaseClient,
  id: string,
  usuarioId: string
): Promise<Reserva | null> {
  const { data } = await supabase
    .from('reservas')
    .select('*, zonas_comunes(nombre)')
    .eq('id', id)
    .eq('usuario_id', usuarioId)
    .single()

  return (data as Reserva) ?? null
}
