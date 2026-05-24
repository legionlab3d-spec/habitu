import type { SupabaseClient } from '@supabase/supabase-js'
import { getStatsCarteraPeriodo, getHistoricoRecaudo, type StatsCartera, type PeriodoRecaudo } from './cartera'

// ─── Legacy (mantener para compatibilidad) ─────────────────────────────────
export interface AdminDashboardData {
  apartamentos_total: number
  apartamentos_ocupados: number
  cartera_pendiente: number
  cartera_mora: number
  cartera_valor_pendiente: number
  cartera_valor_recaudado: number
  pagos_por_verificar: number
  pqrs_sin_responder: number
  paquetes_en_porteria: number
  visitantes_activos: number
  llamados_activos: number
  reservas_mes: number
  anuncios_publicados: number
  pqrs_recientes: { id: string; asunto: string; tipo: string; created_at: string }[]
  pagos_recientes: { id: string; monto: number; metodo: string; created_at: string; apartamentos: { numero: string; torre: string | null } | null }[]
}

export interface ResidenteDashboardData {
  estado_cuenta: {
    id: string; periodo: string; estado: string; valor_total: number
    valor_cuota: number; valor_mora: number; fecha_vencimiento: string
  } | null
  paquetes_en_porteria: number
  llamados_activos: number
  pqrs_pendientes: number
  anuncios_recientes: { id: string; titulo: string; created_at: string }[]
  apartamento: { numero: string; torre: string | null } | null
}

// ─── Full dashboard types ───────────────────────────────────────────────────

export interface Alerta {
  nivel: 'urgent' | 'warning' | 'info'
  mensaje: string
  href: string
  count?: number
  detalle?: string
}

export interface Insight {
  tipo: 'positivo' | 'warning' | 'info'
  mensaje: string
  href?: string
}

export interface ActividadItem {
  tipo: 'pqrs' | 'reserva' | 'pago' | 'vehiculo' | 'anuncio' | 'llamado'
  descripcion: string
  href: string
  created_at: string
}

export interface PqrsCategoriaStats {
  categoria: string
  label: string
  count: number
}

export interface ZonaMini {
  id: string
  nombre: string
  reservas: number
  ingresos: number
}

export interface AdminDashboardFull {
  periodo: string
  // Estructura
  apartamentos_total: number
  apartamentos_ocupados: number
  residentes_activos: number
  // Operativo
  reservas_hoy: number
  reservas_mes: number
  reservas_activas: number
  visitantes_activos: number
  paquetes_porteria: number
  vehiculos_pendientes: number
  llamados_activos: number
  zonas_activas: number
  // Cartera
  stats_cartera: StatsCartera
  historico_recaudo: PeriodoRecaudo[]
  pagos_por_verificar: number
  apartamentos_mora_detalle: { numero: string; torre: string | null }[]
  // PQRS
  pqrs_total: number
  pqrs_abiertas: number
  pqrs_en_proceso: number
  pqrs_resueltas: number
  pqrs_por_categoria: PqrsCategoriaStats[]
  pqrs_sin_respuesta_5d: number
  pqrs_dias_promedio: number
  // Alertas compuestas
  alertas: Alerta[]
  paquetes_viejos: { numero: string; torre: string | null; dias: number }[]
  visitantes_expirados: { nombre: string; numero: string | null }[]
  // Zonas mini
  zonas_top3: ZonaMini[]
  hora_pico: number
  zonas_canceladas: number
  // Actividad reciente
  actividad: ActividadItem[]
  // Insights rule-based
  insights: Insight[]
}

// ─── Helper ─────────────────────────────────────────────────────────────────

function daysSince(isoDate: string): number {
  return Math.floor((Date.now() - new Date(isoDate).getTime()) / 86_400_000)
}

function formatK(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

const CATEGORIA_LABEL: Record<string, string> = {
  infraestructura: 'Infraestructura',
  convivencia:     'Convivencia',
  administracion:  'Administración',
  servicios:       'Servicios',
  financiero:      'Financiero',
  otro:            'Otro',
}

const HORA_LABEL: Record<number, string> = {
  7: '7am', 8: '8am', 9: '9am', 10: '10am', 11: '11am', 12: '12pm',
  13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm', 18: '6pm',
  19: '7pm', 20: '8pm', 21: '9pm',
}

// ─── Main fetch ─────────────────────────────────────────────────────────────

export async function getAdminDashboardFull(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<AdminDashboardFull> {
  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const mesInicio = `${periodoActual}-01`
  const mesFin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]
  const hace5dias = new Date(hoy.getTime() - 5 * 86_400_000).toISOString()
  const hace7dias = new Date(hoy.getTime() - 7 * 86_400_000).toISOString()

  const [
    aptoTotal, aptoOcupados,
    usuariosActivos,
    pqrsRaw,
    statsCartera, historicoRecaudo,
    pagosVerificarCount,
    moraDetalle,
    reservasMesRaw, reservasHoyCount, reservasActivasCount,
    visitantesActivosCount, visitantesExpiradosRaw,
    vehiculosPendientesCount,
    paquetesRaw,
    llamadosRaw,
    zonasActivasCount,
    reservasMesZonasRaw,
    actPqrs, actReservas, actVehiculos, actPagos, actLlamados,
  ] = await Promise.all([
    supabase.from('apartamentos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId),
    supabase.from('apartamentos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).not('residente_id', 'is', null),
    supabase.from('usuarios').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).in('rol', ['propietario', 'residente']),
    supabase.from('pqrs').select('id, tipo, categoria, estado, created_at, updated_at, fecha_respuesta, asunto').eq('conjunto_id', conjuntoId),
    getStatsCarteraPeriodo(supabase, conjuntoId, periodoActual),
    getHistoricoRecaudo(supabase, conjuntoId, 6),
    supabase.from('pagos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('estado', 'pendiente_verificacion'),
    supabase.from('estados_cuenta').select('apartamentos(numero, torre)').eq('conjunto_id', conjuntoId).eq('periodo', periodoActual).eq('estado', 'mora').limit(5),
    supabase.from('reservas').select('id, zona_id, hora_inicio, valor_total, estado, created_at, zonas_comunes:zona_id(id, nombre)').eq('conjunto_id', conjuntoId).gte('fecha', mesInicio).lte('fecha', mesFin),
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('fecha', hoyStr).in('estado', ['confirmada', 'pendiente_pago']),
    supabase.from('reservas').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).in('estado', ['confirmada', 'pendiente_pago']),
    supabase.from('visitantes').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('activo', true).not('fecha_ingreso', 'is', null).is('fecha_salida', null),
    supabase.from('visitantes').select('nombre, apartamentos:apartamento_id(numero, torre), fecha_expiracion').eq('conjunto_id', conjuntoId).eq('activo', true).not('fecha_expiracion', 'is', null).lt('fecha_expiracion', hoyStr).limit(5),
    supabase.from('vehiculos').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('activo', true).eq('estado', 'pendiente_aprobacion'),
    supabase.from('paquetes').select('id, created_at, apartamentos:apartamento_id(numero, torre)').eq('conjunto_id', conjuntoId).eq('estado', 'en_porteria'),
    supabase.from('llamados_atencion').select('id, tipo, created_at, apartamentos:apartamento_id(numero, torre)').eq('conjunto_id', conjuntoId).in('estado', ['activo', 'en_proceso']).order('created_at', { ascending: false }).limit(4),
    supabase.from('zonas_comunes').select('*', { count: 'exact', head: true }).eq('conjunto_id', conjuntoId).eq('activa', true),
    supabase.from('reservas').select('zona_id, valor_total, estado, hora_inicio, zonas_comunes:zona_id(id, nombre)').eq('conjunto_id', conjuntoId),
    supabase.from('pqrs').select('id, asunto, tipo, created_at').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(4),
    supabase.from('reservas').select('id, created_at, valor_total, zonas_comunes:zona_id(nombre)').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(4),
    supabase.from('vehiculos').select('id, placa, tipo, created_at').eq('conjunto_id', conjuntoId).eq('activo', true).order('created_at', { ascending: false }).limit(3),
    supabase.from('pagos').select('id, monto, created_at, apartamentos:apartamento_id(numero, torre)').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(3),
    supabase.from('llamados_atencion').select('id, tipo, created_at, apartamentos:apartamento_id(numero, torre)').eq('conjunto_id', conjuntoId).order('created_at', { ascending: false }).limit(3),
  ])

  // ── PQRS aggregation ─────────────────────────────────────────
  const pqrs = (pqrsRaw.data ?? []) as {
    id: string; tipo: string; categoria: string; estado: string
    created_at: string; updated_at: string; fecha_respuesta: string | null; asunto: string
  }[]

  const pqrsAbiertas = pqrs.filter(p => p.estado === 'recibido').length
  const pqrsEnProceso = pqrs.filter(p => p.estado === 'en_proceso').length
  const pqrsResueltas = pqrs.filter(p => p.estado === 'resuelto' || p.estado === 'cerrado').length
  const pqrsSin5d = pqrs.filter(p => p.estado === 'recibido' && daysSince(p.created_at) > 5).length

  const categMap = new Map<string, number>()
  for (const p of pqrs) {
    categMap.set(p.categoria, (categMap.get(p.categoria) ?? 0) + 1)
  }
  const pqrsPorCategoria: PqrsCategoriaStats[] = Array.from(categMap.entries())
    .map(([categoria, count]) => ({ categoria, label: CATEGORIA_LABEL[categoria] ?? categoria, count }))
    .sort((a, b) => b.count - a.count)

  const respondidas = pqrs.filter(p => p.fecha_respuesta)
  const diasPromedio = respondidas.length > 0
    ? Math.round(respondidas.reduce((s, p) => {
        const d = (new Date(p.fecha_respuesta!).getTime() - new Date(p.created_at).getTime()) / 86_400_000
        return s + Math.max(0, d)
      }, 0) / respondidas.length)
    : 0

  // ── Zonas aggregation (from full reservas) ───────────────────
  type ReservaZona = { zona_id: string; valor_total: number; estado: string; hora_inicio: string; zonas_comunes: { id: string; nombre: string } | null }
  const allReservas = (reservasMesZonasRaw.data ?? []) as unknown as ReservaZona[]
  const zonaMap = new Map<string, ZonaMini>()
  const porHora = Array(24).fill(0)
  let zonasCanceladas = 0

  for (const r of allReservas) {
    const z = r.zonas_comunes
    if (z) {
      const entry = zonaMap.get(z.id) ?? { id: z.id, nombre: z.nombre, reservas: 0, ingresos: 0 }
      entry.reservas++
      if (r.estado === 'confirmada') entry.ingresos += r.valor_total
      zonaMap.set(z.id, entry)
    }
    if (r.estado === 'cancelada' || r.estado === 'expirada') zonasCanceladas++
    if (r.estado === 'confirmada' || r.estado === 'pendiente_pago') {
      const h = parseInt(r.hora_inicio?.slice(0, 2) ?? '0')
      if (h >= 0 && h <= 23) porHora[h]++
    }
  }
  const zonaTop3 = Array.from(zonaMap.values()).sort((a, b) => b.reservas - a.reservas).slice(0, 3)
  const maxHoraVal = Math.max(...porHora)
  const horaPico = maxHoraVal > 0 ? porHora.indexOf(maxHoraVal) : -1

  // ── Reservas mes aggregation ─────────────────────────────────
  type ReservaMes = { id: string; zona_id: string; hora_inicio: string; valor_total: number; estado: string; created_at: string; zonas_comunes: { id: string; nombre: string } | null }
  const reservasMes = (reservasMesRaw.data ?? []) as unknown as ReservaMes[]
  const reservasMesCount = reservasMes.filter(r => r.estado !== 'cancelada' && r.estado !== 'expirada').length

  // ── Paquetes viejos (> 7 días) ───────────────────────────────
  type PaqueteRaw = { id: string; created_at: string; apartamentos: { numero: string; torre: string | null } | null }
  const paquetes = (paquetesRaw.data ?? []) as unknown as PaqueteRaw[]
  const paquetesViejos = paquetes
    .filter(p => daysSince(p.created_at) > 7)
    .slice(0, 5)
    .map(p => ({
      numero: p.apartamentos?.numero ?? '?',
      torre: p.apartamentos?.torre ?? null,
      dias: daysSince(p.created_at),
    }))

  // ── Visitantes expirados ─────────────────────────────────────
  type VisitanteExp = { nombre: string; apartamentos: { numero: string } | null }
  const visitantesExpirados = ((visitantesExpiradosRaw.data ?? []) as unknown as VisitanteExp[])
    .map(v => ({ nombre: v.nombre, numero: v.apartamentos?.numero ?? null }))

  // ── Apartamentos mora detalle ────────────────────────────────
  type MoraDetalle = { apartamentos: { numero: string; torre: string | null } | null }
  const apartamentosMoraDetalle = ((moraDetalle.data ?? []) as unknown as MoraDetalle[])
    .map(m => m.apartamentos)
    .filter(Boolean) as { numero: string; torre: string | null }[]

  // ── Alertas compuestas (ordenadas por urgencia) ──────────────
  const alertas: Alerta[] = []

  if (pqrsSin5d > 0) {
    alertas.push({
      nivel: 'urgent',
      mensaje: `${pqrsSin5d} PQRS sin respuesta hace más de 5 días`,
      href: '/dashboard/admin/pqrs?estado=recibido',
      count: pqrsSin5d,
    })
  }
  if ((statsCartera.mora ?? 0) > 0) {
    alertas.push({
      nivel: 'warning',
      mensaje: `${statsCartera.mora} apartamento${statsCartera.mora !== 1 ? 's' : ''} en mora`,
      href: '/dashboard/admin/cartera?filtro=mora',
      count: statsCartera.mora,
      detalle: formatK(statsCartera.valor_pendiente),
    })
  }
  if ((vehiculosPendientesCount.count ?? 0) > 0) {
    alertas.push({
      nivel: 'warning',
      mensaje: `${vehiculosPendientesCount.count} vehículo${(vehiculosPendientesCount.count ?? 0) !== 1 ? 's' : ''} pendiente${(vehiculosPendientesCount.count ?? 0) !== 1 ? 's' : ''} de aprobación`,
      href: '/dashboard/admin/vehiculos',
      count: vehiculosPendientesCount.count ?? 0,
    })
  }
  if ((pagosVerificarCount.count ?? 0) > 0) {
    alertas.push({
      nivel: 'warning',
      mensaje: `${pagosVerificarCount.count} pago${(pagosVerificarCount.count ?? 0) !== 1 ? 's' : ''} por verificar`,
      href: '/dashboard/admin/cartera',
      count: pagosVerificarCount.count ?? 0,
    })
  }
  if (visitantesExpirados.length > 0) {
    alertas.push({
      nivel: 'info',
      mensaje: `${visitantesExpirados.length} visita${visitantesExpirados.length !== 1 ? 'ntes' : 'nte'} con autorización expirada`,
      href: '/dashboard/admin/visitantes',
      count: visitantesExpirados.length,
    })
  }
  if (paquetesViejos.length > 0) {
    alertas.push({
      nivel: 'info',
      mensaje: `${paquetesViejos.length} paquete${paquetesViejos.length !== 1 ? 's' : ''} hace más de 7 días en portería`,
      href: '/dashboard/admin/paquetes',
      count: paquetesViejos.length,
    })
  }
  const llamadosCount = (llamadosRaw.data ?? []).length
  if (llamadosCount > 0) {
    alertas.push({
      nivel: 'info',
      mensaje: `${llamadosCount} llamado${llamadosCount !== 1 ? 's' : ''} de atención activo${llamadosCount !== 1 ? 's' : ''}`,
      href: '/dashboard/admin/llamados',
      count: llamadosCount,
    })
  }

  // ── Insights rule-based ──────────────────────────────────────
  const insights: Insight[] = []
  const mesAnteriorStats = historicoRecaudo[historicoRecaudo.length - 2]
  const mesActualStats = historicoRecaudo[historicoRecaudo.length - 1]

  if (mesAnteriorStats && mesActualStats) {
    if (mesActualStats.mora > mesAnteriorStats.mora) {
      insights.push({
        tipo: 'warning',
        mensaje: `La mora aumentó respecto al mes anterior (${mesAnteriorStats.mora} → ${mesActualStats.mora} apartamentos)`,
        href: '/dashboard/admin/cartera?filtro=mora',
      })
    } else if (mesActualStats.pagado > mesAnteriorStats.pagado) {
      insights.push({
        tipo: 'positivo',
        mensaje: `El recaudo mejoró frente al mes anterior`,
        href: '/dashboard/admin/cartera',
      })
    }
  }

  if (statsCartera.mora > 0 && statsCartera.total_periodo > 0) {
    const pctMora = Math.round((statsCartera.mora / statsCartera.total_periodo) * 100)
    if (pctMora >= 30) {
      insights.push({
        tipo: 'warning',
        mensaje: `${pctMora}% de los apartamentos están en mora este período`,
        href: '/dashboard/admin/cartera?filtro=mora',
      })
    }
  }

  if (pqrsPorCategoria.length > 0 && pqrs.length >= 3) {
    const top = pqrsPorCategoria[0]
    const pct = Math.round((top.count / pqrs.length) * 100)
    if (pct >= 30) {
      insights.push({
        tipo: 'info',
        mensaje: `"${top.label}" representa el ${pct}% de las PQRS del conjunto`,
        href: '/dashboard/admin/pqrs',
      })
    }
  }

  if (diasPromedio > 0) {
    insights.push({
      tipo: diasPromedio <= 2 ? 'positivo' : diasPromedio <= 5 ? 'info' : 'warning',
      mensaje: `Tiempo promedio de respuesta a PQRS: ${diasPromedio} día${diasPromedio !== 1 ? 's' : ''}`,
      href: '/dashboard/admin/pqrs',
    })
  }

  if (horaPico >= 0 && maxHoraVal > 0) {
    insights.push({
      tipo: 'info',
      mensaje: `La franja de mayor demanda en zonas es ${HORA_LABEL[horaPico] ?? `${horaPico}h`}`,
      href: '/dashboard/admin/zonas',
    })
  }

  if (zonasCanceladas > 0 && allReservas.length > 0) {
    const pctCancel = Math.round((zonasCanceladas / allReservas.length) * 100)
    if (pctCancel >= 20) {
      insights.push({
        tipo: 'warning',
        mensaje: `${pctCancel}% de las reservas se cancelaron o expiraron`,
        href: '/dashboard/admin/reservas',
      })
    }
  }

  if ((vehiculosPendientesCount.count ?? 0) >= 3) {
    insights.push({
      tipo: 'warning',
      mensaje: `Hay ${vehiculosPendientesCount.count} vehículos esperando aprobación`,
      href: '/dashboard/admin/vehiculos',
    })
  }

  // ── Actividad reciente ───────────────────────────────────────
  const actividad: ActividadItem[] = []

  for (const p of actPqrs.data ?? []) {
    actividad.push({ tipo: 'pqrs', descripcion: `PQRS: ${(p as { asunto: string }).asunto}`, href: '/dashboard/admin/pqrs', created_at: (p as { created_at: string }).created_at })
  }
  type ActReserva = { id: string; created_at: string; valor_total: number; zonas_comunes: { nombre: string } | null }
  for (const r of (actReservas.data ?? []) as unknown as ActReserva[]) {
    actividad.push({ tipo: 'reserva', descripcion: `Reserva: ${r.zonas_comunes?.nombre ?? 'Zona'}`, href: '/dashboard/admin/reservas', created_at: r.created_at })
  }
  for (const v of actVehiculos.data ?? []) {
    actividad.push({ tipo: 'vehiculo', descripcion: `Vehículo: ${(v as { placa: string }).placa}`, href: '/dashboard/admin/vehiculos', created_at: (v as { created_at: string }).created_at })
  }
  type ActPago = { id: string; monto: number; created_at: string; apartamentos: { numero: string } | null }
  for (const p of (actPagos.data ?? []) as unknown as ActPago[]) {
    actividad.push({ tipo: 'pago', descripcion: `Pago reportado${p.apartamentos ? ` — Apto ${p.apartamentos.numero}` : ''}`, href: '/dashboard/admin/cartera', created_at: p.created_at })
  }
  type ActLlamado = { id: string; tipo: string; created_at: string; apartamentos: { numero: string } | null }
  for (const l of (actLlamados.data ?? []) as unknown as ActLlamado[]) {
    actividad.push({ tipo: 'llamado', descripcion: `Llamado ${l.tipo}${l.apartamentos ? ` — Apto ${l.apartamentos.numero}` : ''}`, href: '/dashboard/admin/llamados', created_at: l.created_at })
  }

  actividad.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  return {
    periodo: periodoActual,
    apartamentos_total: aptoTotal.count ?? 0,
    apartamentos_ocupados: aptoOcupados.count ?? 0,
    residentes_activos: usuariosActivos.count ?? 0,
    reservas_hoy: reservasHoyCount.count ?? 0,
    reservas_mes: reservasMesCount,
    reservas_activas: reservasActivasCount.count ?? 0,
    visitantes_activos: visitantesActivosCount.count ?? 0,
    paquetes_porteria: paquetes.length,
    vehiculos_pendientes: vehiculosPendientesCount.count ?? 0,
    llamados_activos: llamadosCount,
    zonas_activas: zonasActivasCount.count ?? 0,
    stats_cartera: statsCartera,
    historico_recaudo: historicoRecaudo,
    pagos_por_verificar: pagosVerificarCount.count ?? 0,
    apartamentos_mora_detalle: apartamentosMoraDetalle,
    pqrs_total: pqrs.length,
    pqrs_abiertas: pqrsAbiertas,
    pqrs_en_proceso: pqrsEnProceso,
    pqrs_resueltas: pqrsResueltas,
    pqrs_por_categoria: pqrsPorCategoria,
    pqrs_sin_respuesta_5d: pqrsSin5d,
    pqrs_dias_promedio: diasPromedio,
    alertas,
    paquetes_viejos: paquetesViejos,
    visitantes_expirados: visitantesExpirados,
    zonas_top3: zonaTop3,
    hora_pico: horaPico,
    zonas_canceladas: zonasCanceladas,
    actividad: actividad.slice(0, 10),
    insights,
  }
}

// ─── Legacy function (keep for potential reuse) ─────────────────────────────
export async function getAdminDashboardData(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<AdminDashboardData> {
  const periodoActual = (() => {
    const h = new Date()
    return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`
  })()
  const mesInicio = `${periodoActual}-01`
  const mesFin = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]

  const [
    aptoTotal, aptoOcupados, carteraPendiente, carteraMora,
    valorPendiente, valorRecaudado, pagosPorVerificar,
    pqrsSinResponder, paquetesPorteria, visitantesActivos,
    llamadosActivos, reservasMes, anuncios, pqrsRecientes, pagosRecientes,
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
