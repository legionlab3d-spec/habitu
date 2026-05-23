import type { SupabaseClient } from '@supabase/supabase-js'

export interface EstadoCuenta {
  id: string
  conjunto_id: string
  apartamento_id: string
  usuario_id: string | null
  periodo: string
  valor_cuota: number
  valor_mora: number
  valor_otros: number
  valor_total: number
  estado: 'pendiente' | 'pagado' | 'mora' | 'exonerado' | 'parcial'
  fecha_vencimiento: string
  fecha_pago: string | null
  observaciones: string | null
  created_at: string
  apartamentos?: { numero: string; torre: string | null }
  usuarios?: { nombre: string } | null
}

export interface Pago {
  id: string
  conjunto_id: string
  apartamento_id: string
  usuario_id: string | null
  estado_cuenta_id: string | null
  monto: number
  metodo: string
  referencia: string | null
  comprobante_url: string | null
  notas: string | null
  estado: 'pendiente_verificacion' | 'verificado' | 'rechazado'
  reportado_por: string
  verificado_por: string | null
  fecha_pago: string
  created_at: string
  apartamentos?: { numero: string; torre: string | null }
  usuarios?: { nombre: string } | null
  estados_cuenta?: { periodo: string } | null
}

export interface ConfigCartera {
  id: string
  conjunto_id: string
  valor_cuota_mensual: number
  dia_limite_pago: number
  mora_automatica: boolean
  porcentaje_mora: number
  link_pse: string | null
  link_banco: string | null
  instrucciones_pago: string | null
}

export interface StatsCartera {
  pendiente: number
  pagado: number
  mora: number
  exonerado: number
  total_periodo: number
  valor_pendiente: number
  valor_pagado: number
}

export async function getEstadosCuentaPeriodo(
  supabase: SupabaseClient,
  conjuntoId: string,
  periodo: string
): Promise<EstadoCuenta[]> {
  const { data } = await supabase
    .from('estados_cuenta')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('periodo', periodo)
    .order('created_at', { ascending: true })

  return (data ?? []) as EstadoCuenta[]
}

export async function getPagosPendientesVerificacion(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Pago[]> {
  const { data } = await supabase
    .from('pagos')
    .select('*, apartamentos(numero, torre), usuarios(nombre), estados_cuenta(periodo)')
    .eq('conjunto_id', conjuntoId)
    .eq('estado', 'pendiente_verificacion')
    .order('created_at', { ascending: true })

  return (data ?? []) as Pago[]
}

export async function getMisEstadosCuenta(
  supabase: SupabaseClient,
  conjuntoId: string,
  apartamentoId: string
): Promise<EstadoCuenta[]> {
  const { data } = await supabase
    .from('estados_cuenta')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('apartamento_id', apartamentoId)
    .order('periodo', { ascending: false })

  return (data ?? []) as EstadoCuenta[]
}

export async function getMisPagos(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Pago[]> {
  const { data } = await supabase
    .from('pagos')
    .select('*, estados_cuenta(periodo)')
    .eq('conjunto_id', conjuntoId)
    .eq('reportado_por', usuarioId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Pago[]
}

export async function getConfigCartera(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<ConfigCartera | null> {
  const { data } = await supabase
    .from('config_conjunto')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .single()

  return data ?? null
}

export async function getStatsCarteraPeriodo(
  supabase: SupabaseClient,
  conjuntoId: string,
  periodo: string
): Promise<StatsCartera> {
  const { data } = await supabase
    .from('estados_cuenta')
    .select('estado, valor_total')
    .eq('conjunto_id', conjuntoId)
    .eq('periodo', periodo)

  if (!data) return { pendiente: 0, pagado: 0, mora: 0, exonerado: 0, total_periodo: 0, valor_pendiente: 0, valor_pagado: 0 }

  const stats = data.reduce((acc, r) => {
    acc.total_periodo++
    acc[r.estado as keyof StatsCartera] = (acc[r.estado as keyof StatsCartera] as number || 0) + 1
    if (r.estado === 'pendiente' || r.estado === 'mora') acc.valor_pendiente += r.valor_total
    if (r.estado === 'pagado') acc.valor_pagado += r.valor_total
    return acc
  }, { pendiente: 0, pagado: 0, mora: 0, exonerado: 0, total_periodo: 0, valor_pendiente: 0, valor_pagado: 0 } as StatsCartera)

  return stats
}

export function periodoAnterior(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  const date = new Date(y, m - 2)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function periodoSiguiente(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  const date = new Date(y, m)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function formatPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })
}

export function formatValor(valor: number): string {
  return `$${valor.toLocaleString('es-CO')}`
}
