import type { SupabaseClient } from '@supabase/supabase-js'

export interface AdminDashboardData {
  // Estructura
  apartamentos_total: number
  apartamentos_ocupados: number
  // Cartera
  cartera_pendiente: number
  cartera_mora: number
  cartera_valor_pendiente: number
  cartera_valor_recaudado: number
  pagos_por_verificar: number
  // Operaciones
  pqrs_sin_responder: number
  paquetes_en_porteria: number
  visitantes_activos: number
  llamados_activos: number
  // Contenido
  reservas_mes: number
  anuncios_publicados: number
  // Actividad reciente
  pqrs_recientes: { id: string; asunto: string; tipo: string; created_at: string }[]
  pagos_recientes: { id: string; monto: number; metodo: string; created_at: string; apartamentos: { numero: string; torre: string | null } | null }[]
}

export interface ResidenteDashboardData {
  // Cartera
  estado_cuenta: {
    id: string
    periodo: string
    estado: string
    valor_total: number
    valor_cuota: number
    valor_mora: number
    fecha_vencimiento: string
  } | null
  // Alertas
  paquetes_en_porteria: number
  llamados_activos: number
  pqrs_pendientes: number
  // Contenido
  anuncios_recientes: { id: string; titulo: string; created_at: string }[]
  // Info apartamento
  apartamento: { numero: string; torre: string | null } | null
}

export async function getAdminDashboardData(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<AdminDashboardData> {
  const periodoActual = (() => {
    const h = new Date()
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
  })()

  const mesInicio = `${periodoActual}-01`
  const mesFin = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
    .toISOString().split('T')[0]

  const [
    aptoTotal, aptoOcupados,
    carteraPendiente, carteraMora,
    valorPendiente, valorRecaudado,
    pagosPorVerificar,
    pqrsSinResponder,
    paquetesPorteria,
    visitantesActivos,
    llamadosActivos,
    reservasMes,
    anuncios,
    pqrsRecientes,
    pagosRecientes,
  ] = await Promise.all([
    supabase.from('apartamentos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId),
    supabase.from('apartamentos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).not('residente_id', 'is', null),
    supabase.from('estados_cuenta').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('periodo', periodoActual).eq('estado', 'pendiente'),
    supabase.from('estados_cuenta').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('periodo', periodoActual).eq('estado', 'mora'),
    supabase.from('estados_cuenta').select('valor_total').eq('conjunto_id', conjuntoId).eq('periodo', periodoActual).in('estado', ['pendiente', 'mora']),
    supabase.from('estados_cuenta').select('valor_total').eq('conjunto_id', conjuntoId).eq('periodo', periodoActual).eq('estado', 'pagado'),
    supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('estado', 'pendiente_verificacion'),
    supabase.from('pqrs').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('estado', 'recibido'),
    supabase.from('paquetes').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('estado', 'en_porteria'),
    supabase.from('visitantes').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('activo', true).not('fecha_ingreso', 'is', null).is('fecha_salida', null),
    supabase.from('llamados_atencion').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).in('estado', ['activo', 'en_proceso']),
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('anuncios').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId),
    supabase.from('pqrs').select('id, asunto, tipo, created_at').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(5),
    supabase.from('pagos').select('id, monto, metodo, created_at, apartamentos(numero, torre)').eq('conjunto_id', conjuntoId).eq('estado', 'pendiente_verificacion').order('created_at', { ascending: false }).limit(3),
  ])

  const sumaValores = (rows: { valor_total: number }[] | null) =>
    (rows ?? []).reduce((s, r) => s + (r.valor_total ?? 0), 0)

  return {
    apartamentos_total: aptoTotal.count ?? 0,
    apartamentos_ocupados: aptoOcupados.count ?? 0,
    cartera_pendiente: carteraPendiente.count ?? 0,
    cartera_mora: carteraMora.count ?? 0,
    cartera_valor_pendiente: sumaValores(valorPendiente.data),
    cartera_valor_recaudado: sumaValores(valorRecaudado.data),
    pagos_por_verificar: pagosPorVerificar.count ?? 0,
    pqrs_sin_responder: pqrsSinResponder.count ?? 0,
    paquetes_en_porteria: paquetesPorteria.count ?? 0,
    visitantes_activos: visitantesActivos.count ?? 0,
    llamados_activos: llamadosActivos.count ?? 0,
    reservas_mes: reservasMes.count ?? 0,
    anuncios_publicados: anuncios.count ?? 0,
    pqrs_recientes: (pqrsRecientes.data ?? []) as AdminDashboardData['pqrs_recientes'],
    pagos_recientes: (pagosRecientes.data ?? []) as unknown as AdminDashboardData['pagos_recientes'],
  }
}

export async function getResidenteDashboardData(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<ResidenteDashboardData> {
  // Buscar apartamento del residente
  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id, numero, torre')
    .eq('conjunto_id', conjuntoId)
    .or(`residente_id.eq.${usuarioId},propietario_id.eq.${usuarioId}`)
    .single()

  const [estadoCuenta, paquetes, llamados, pqrs, anuncios] = await Promise.all([
    apto
      ? supabase.from('estados_cuenta').select('id, periodo, estado, valor_total, valor_cuota, valor_mora, fecha_vencimiento').eq('conjunto_id', conjuntoId).eq('apartamento_id', apto.id).order('periodo', { ascending: false }).limit(1)
      : Promise.resolve({ data: [] }),
    apto
      ? supabase.from('paquetes').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('apartamento_id', apto.id).eq('estado', 'en_porteria')
      : Promise.resolve({ count: 0 }),
    apto
      ? supabase.from('llamados_atencion').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('apartamento_id', apto.id).in('estado', ['activo', 'en_proceso'])
      : Promise.resolve({ count: 0 }),
    supabase.from('pqrs').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('usuario_id', usuarioId).in('estado', ['recibido', 'en_proceso']),
    supabase.from('anuncios').select('id, titulo, created_at').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(4),
  ])

  const ec = (estadoCuenta as { data: unknown[] }).data?.[0] ?? null

  return {
    estado_cuenta: ec as ResidenteDashboardData['estado_cuenta'],
    paquetes_en_porteria: (paquetes as { count: number | null }).count ?? 0,
    llamados_activos: (llamados as { count: number | null }).count ?? 0,
    pqrs_pendientes: (pqrs as { count: number | null }).count ?? 0,
    anuncios_recientes: ((anuncios as { data: unknown[] | null }).data ?? []) as ResidenteDashboardData['anuncios_recientes'],
    apartamento: apto ? { numero: apto.numero, torre: apto.torre } : null,
  }
}
