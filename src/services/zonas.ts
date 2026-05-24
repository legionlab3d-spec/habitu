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

export interface ReservaRaw {
  id: string
  zona_id: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  duracion_horas: number
  valor_total: number
  estado: 'pendiente_pago' | 'confirmada' | 'cancelada' | 'expirada'
  created_at: string
  zonas_comunes: { id: string; nombre: string } | null
  usuarios: { id: string; nombre: string } | null
}

export interface ZonaStats {
  id: string
  nombre: string
  totalReservas: number
  reservasMes: number
  ingresos: number
  ingresosMes: number
  horasMes: number
  activa: boolean
}

export interface ZonasAnalytics {
  zonas: ZonaComun[]
  zonaStats: ZonaStats[]
  // KPIs del mes
  reservasMes: number
  reservasMesAnterior: number
  ingresosMes: number
  reservasActivas: number
  reservasPendientePago: number
  tasaOcupacionPromedio: number
  // Distribución horaria (7-21, índice = hora)
  porHora: number[]
  // Top residentes
  topResidentes: { id: string; nombre: string; count: number }[]
  // Cancelaciones
  canceladas: number
  expiradas: number
  totalHistorico: number
  // Crecimiento
  crecimientoMes: number
}

const HORAS_DISPONIBLES_MES = 14 * 30 // 7-21h, ~30 días

export async function getZonas(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<ZonaComun[]> {
  const { data } = await supabase
    .from('zonas_comunes')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .order('nombre', { ascending: true })

  return (data ?? []) as ZonaComun[]
}

export async function getZonasAnalytics(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<ZonasAnalytics> {
  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const mesAnteriorDate = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1)
  const periodoAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}`

  const [{ data: zonas }, { data: reservas }] = await Promise.all([
    supabase
      .from('zonas_comunes')
      .select('*')
      .eq('conjunto_id', conjuntoId)
      .order('nombre', { ascending: true }),
    supabase
      .from('reservas')
      .select(`
        id, zona_id, fecha, hora_inicio, hora_fin, duracion_horas,
        valor_total, estado, created_at,
        zonas_comunes:zona_id(id, nombre),
        usuarios:usuario_id(id, nombre)
      `)
      .eq('conjunto_id', conjuntoId),
  ])

  const allZonas = (zonas ?? []) as ZonaComun[]
  const allReservas = (reservas ?? []) as unknown as ReservaRaw[]

  // ── Zonas stats ─────────────────────────────────────────────
  const zonaMap = new Map<string, ZonaStats>()
  for (const z of allZonas) {
    zonaMap.set(z.id, {
      id: z.id,
      nombre: z.nombre,
      totalReservas: 0,
      reservasMes: 0,
      ingresos: 0,
      ingresosMes: 0,
      horasMes: 0,
      activa: z.activa,
    })
  }

  // ── Distribución horaria ─────────────────────────────────────
  const porHora = Array(24).fill(0)

  // ── Top residentes ───────────────────────────────────────────
  const residenteMap = new Map<string, { id: string; nombre: string; count: number }>()

  let reservasMes = 0
  let reservasMesAnterior = 0
  let ingresosMes = 0
  let reservasActivas = 0
  let reservasPendientePago = 0
  let canceladas = 0
  let expiradas = 0

  for (const r of allReservas) {
    const esMes = r.fecha.startsWith(periodoActual)
    const esMesAnterior = r.fecha.startsWith(periodoAnterior)
    const confirmada = r.estado === 'confirmada'
    const pendiente = r.estado === 'pendiente_pago'
    const activa = confirmada || pendiente

    // Zonas stats
    const zs = zonaMap.get(r.zona_id)
    if (zs) {
      zs.totalReservas++
      if (esMes) {
        zs.reservasMes++
        if (activa) zs.horasMes += r.duracion_horas
        if (confirmada) zs.ingresosMes += r.valor_total
      }
      if (confirmada) zs.ingresos += r.valor_total
    }

    // KPIs
    if (esMes && r.estado !== 'cancelada' && r.estado !== 'expirada') reservasMes++
    if (esMesAnterior && r.estado !== 'cancelada' && r.estado !== 'expirada') reservasMesAnterior++
    if (esMes && confirmada) ingresosMes += r.valor_total
    if (activa) reservasActivas++
    if (pendiente) reservasPendientePago++
    if (r.estado === 'cancelada') canceladas++
    if (r.estado === 'expirada') expiradas++

    // Horarios (solo reservas válidas)
    if (activa || confirmada) {
      const hora = parseInt(r.hora_inicio.slice(0, 2))
      if (hora >= 0 && hora <= 23) porHora[hora]++
    }

    // Residentes
    const u = r.usuarios
    if (u && (activa || confirmada || esMes)) {
      const entry = residenteMap.get(u.id)
      if (entry) entry.count++
      else residenteMap.set(u.id, { id: u.id, nombre: u.nombre, count: 1 })
    }
  }

  const zonaStats = Array.from(zonaMap.values())
    .sort((a, b) => b.totalReservas - a.totalReservas)

  const topResidentes = Array.from(residenteMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  // Tasa de ocupación promedio (este mes, zonas activas con al menos 1 reserva)
  const zonasConActividad = zonaStats.filter(z => z.activa && z.horasMes > 0)
  const tasaOcupacionPromedio = zonasConActividad.length > 0
    ? Math.round(
        zonasConActividad.reduce((s, z) => s + (z.horasMes / HORAS_DISPONIBLES_MES) * 100, 0) /
        zonasConActividad.length
      )
    : 0

  const crecimientoMes = reservasMesAnterior > 0
    ? Math.round(((reservasMes - reservasMesAnterior) / reservasMesAnterior) * 100)
    : reservasMes > 0 ? 100 : 0

  return {
    zonas: allZonas,
    zonaStats,
    reservasMes,
    reservasMesAnterior,
    ingresosMes,
    reservasActivas,
    reservasPendientePago,
    tasaOcupacionPromedio,
    porHora,
    topResidentes,
    canceladas,
    expiradas,
    totalHistorico: allReservas.length,
    crecimientoMes,
  }
}
