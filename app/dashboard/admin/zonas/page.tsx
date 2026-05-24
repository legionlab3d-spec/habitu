import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getZonasAnalytics } from '@/src/services/zonas'

function formatValor(v: number) {
  if (v === 0) return '$0'
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v.toLocaleString('es-CO')}`
}

function BarHorizontal({ valor, max, color = '#004746' }: { valor: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.max(2, (valor / max) * 100) : 2
  return (
    <div className="h-2 bg-[#f5f3f3] rounded-full overflow-hidden w-full">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

function Crecimiento({ valor }: { valor: number }) {
  if (valor === 0) return <span className="text-[10px] text-[#6f7978]">Sin cambio</span>
  const positivo = valor > 0
  return (
    <span className={`text-[10px] font-semibold ${positivo ? 'text-[#2f9e44]' : 'text-[#ba1a1a]'}`}>
      {positivo ? '↑' : '↓'} {Math.abs(valor)}% vs mes anterior
    </span>
  )
}

const HORA_LABELS: Record<number, string> = {
  7: '7am', 8: '8am', 9: '9am', 10: '10am', 11: '11am', 12: '12pm',
  13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm', 18: '6pm',
  19: '7pm', 20: '8pm', 21: '9pm',
}

export default async function ZonasDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const analytics = await getZonasAnalytics(supabase, perfil.conjunto_id)
  const {
    zonas, zonaStats, reservasMes, ingresosMes, reservasActivas,
    reservasPendientePago, tasaOcupacionPromedio, porHora,
    topResidentes, canceladas, expiradas, totalHistorico, crecimientoMes,
  } = analytics

  const maxReservas = Math.max(...zonaStats.map(z => z.totalReservas), 1)
  const maxIngresos = Math.max(...zonaStats.map(z => z.ingresos), 1)
  const maxHora = Math.max(...porHora, 1)
  const zonasActivas = zonas.filter(z => z.activa).length

  // Zonas con baja utilización (activas, < 20% de la zona con más reservas, con al menos 1 zona activa con reservas)
  const umbralBaja = maxReservas * 0.2
  const zonasBajaUso = zonaStats.filter(z => z.activa && z.totalReservas < umbralBaja && zonaStats.some(x => x.totalReservas >= 5))

  const mes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
            Admin · Zonas Comunes
          </p>
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
            Zonas Comunes
          </h1>
          <p className="text-sm text-[#3f4948] mt-1 capitalize">{mes} · {zonasActivas} zona{zonasActivas !== 1 ? 's' : ''} activa{zonasActivas !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/dashboard/admin/zonas/gestion"
          className="flex items-center gap-2 h-9 px-4 bg-[#004746] hover:bg-[#08605f] text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
          Gestión de zonas
        </Link>
      </div>

      {/* Sin zonas */}
      {zonas.length === 0 && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-12 text-center">
          <p className="text-[#3f4948] text-sm font-medium mb-2">No hay zonas comunes configuradas.</p>
          <Link href="/dashboard/admin/zonas/gestion" className="text-sm text-[#004746] font-semibold hover:underline">
            Agregar primera zona →
          </Link>
        </div>
      )}

      {zonas.length > 0 && (
        <>
          {/* ── KPI CARDS ──────────────────────────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              {
                label: 'Reservas este mes',
                val: reservasMes,
                sub: <Crecimiento valor={crecimientoMes} />,
                color: 'text-[#1b1c1c]',
              },
              {
                label: 'Ingresos este mes',
                val: formatValor(ingresosMes),
                sub: <span className="text-[10px] text-[#6f7978]">Solo confirmadas</span>,
                color: 'text-[#2f9e44]',
              },
              {
                label: 'Activas ahora',
                val: reservasActivas,
                sub: <span className="text-[10px] text-[#6f7978]">{reservasPendientePago} pendientes pago</span>,
                color: 'text-[#1971c2]',
              },
              {
                label: 'Ocupación prom.',
                val: `${tasaOcupacionPromedio}%`,
                sub: <span className="text-[10px] text-[#6f7978]">Este mes</span>,
                color: tasaOcupacionPromedio >= 60 ? 'text-[#2f9e44]' : tasaOcupacionPromedio >= 30 ? 'text-[#e67700]' : 'text-[#ba1a1a]',
              },
            ].map((k) => (
              <div key={k.label} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{k.label}</p>
                <p className={`font-[family-name:var(--font-outfit)] text-2xl font-bold ${k.color}`}>{k.val}</p>
                <div className="mt-1">{k.sub}</div>
              </div>
            ))}
          </div>

          {/* ── ROW 2: Ranking + Ingresos ──────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Zonas más reservadas */}
            <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
                Zonas más reservadas
              </p>
              {zonaStats.filter(z => z.totalReservas > 0).length === 0 ? (
                <p className="text-xs text-[#6f7978]">Sin reservas aún.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {zonaStats.slice(0, 6).map((z, i) => (
                    <div key={z.id}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold text-[#6f7978] w-4 flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-sm text-[#1b1c1c] truncate">{z.nombre}</span>
                          {!z.activa && (
                            <span className="text-[9px] text-[#6f7978] bg-[#f5f3f3] px-1.5 py-0.5 rounded-full flex-shrink-0">
                              Inactiva
                            </span>
                          )}
                        </div>
                        <span className="text-xs font-semibold text-[#1b1c1c] ml-2 flex-shrink-0">
                          {z.totalReservas}
                        </span>
                      </div>
                      <BarHorizontal valor={z.totalReservas} max={maxReservas} color="#004746" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ingresos por zona */}
            <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
                Ingresos por zona
                <span className="text-[#6f7978] normal-case font-normal ml-1">· histórico</span>
              </p>
              {zonaStats.filter(z => z.ingresos > 0).length === 0 ? (
                <p className="text-xs text-[#6f7978]">
                  {zonas.every(z => z.precio_por_hora === 0) ? 'Todas las zonas son gratuitas.' : 'Sin ingresos registrados.'}
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {zonaStats
                    .filter(z => z.ingresos > 0)
                    .sort((a, b) => b.ingresos - a.ingresos)
                    .slice(0, 6)
                    .map((z) => (
                      <div key={z.id}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[#1b1c1c] truncate">{z.nombre}</span>
                          <span className="text-xs font-semibold text-[#2f9e44] ml-2 flex-shrink-0">
                            {formatValor(z.ingresos)}
                          </span>
                        </div>
                        <BarHorizontal valor={z.ingresos} max={maxIngresos} color="#2f9e44" />
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* ── ROW 3: Horarios más demandados ─────────────── */}
          <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
            <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
              Horarios más demandados
            </p>
            {porHora.every(h => h === 0) ? (
              <p className="text-xs text-[#6f7978]">Sin datos de reservas aún.</p>
            ) : (
              <>
                <div className="flex items-end gap-1 h-20 mb-2">
                  {Array.from({ length: 15 }, (_, i) => i + 7).map((hora) => {
                    const count = porHora[hora] ?? 0
                    const pct = maxHora > 0 ? (count / maxHora) * 100 : 0
                    const esTop = count === maxHora && count > 0
                    return (
                      <div key={hora} className="flex-1 flex flex-col items-center justify-end gap-0.5">
                        <div
                          className={`w-full rounded-t-sm transition-all ${esTop ? 'bg-[#004746]' : 'bg-[#bec9c8]'}`}
                          style={{ height: `${Math.max(pct, 2)}%` }}
                          title={`${HORA_LABELS[hora] ?? `${hora}h`}: ${count} reserva${count !== 1 ? 's' : ''}`}
                        />
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 15 }, (_, i) => i + 7).map((hora) => (
                    <div key={hora} className="flex-1 text-center">
                      {hora % 3 === 0 && (
                        <span className="text-[8px] text-[#6f7978]">{HORA_LABELS[hora]}</span>
                      )}
                    </div>
                  ))}
                </div>
                {/* Franja de mayor demanda */}
                {(() => {
                  const maxCount = maxHora
                  if (maxCount === 0) return null
                  const horaTop = porHora.indexOf(maxCount)
                  return (
                    <p className="text-xs text-[#3f4948] mt-2">
                      Franja de mayor demanda:{' '}
                      <span className="font-semibold text-[#004746]">
                        {HORA_LABELS[horaTop] ?? `${horaTop}:00`} — {HORA_LABELS[horaTop + 1] ?? `${horaTop + 1}:00`}
                      </span>
                      {' '}con {maxCount} reserva{maxCount !== 1 ? 's' : ''}
                    </p>
                  )
                })()}
              </>
            )}
          </div>

          {/* ── ROW 4: Top residentes + Cancelaciones ──────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

            {/* Top residentes */}
            <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
                Residentes más activos
              </p>
              {topResidentes.length === 0 ? (
                <p className="text-xs text-[#6f7978]">Sin datos aún.</p>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {topResidentes.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-[#6f7978] w-4 flex-shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-[#1b1c1c] truncate">{r.nombre}</p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <div className="h-1.5 rounded-full bg-[#004746]"
                          style={{ width: `${Math.max(16, (r.count / topResidentes[0].count) * 64)}px` }} />
                        <span className="text-xs font-semibold text-[#1b1c1c] w-6 text-right">{r.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cancelaciones y expiradas */}
            <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
                Cancelaciones y pérdidas
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-3 py-2.5 bg-[#f5f3f3] rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-[#3f4948]">Canceladas</p>
                    <p className="text-[10px] text-[#6f7978]">Por el residente o admin</p>
                  </div>
                  <p className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#6f7978]">{canceladas}</p>
                </div>
                <div className="flex items-center justify-between px-3 py-2.5 bg-[#ffdad6]/60 rounded-xl">
                  <div>
                    <p className="text-xs font-semibold text-[#ba1a1a]">Expiradas</p>
                    <p className="text-[10px] text-[#6f7978]">Sin completar pago</p>
                  </div>
                  <p className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#ba1a1a]">{expiradas}</p>
                </div>
                {totalHistorico > 0 && (canceladas + expiradas) > 0 && (
                  <p className="text-[10px] text-[#6f7978] px-1">
                    {Math.round(((canceladas + expiradas) / totalHistorico) * 100)}% de pérdida sobre {totalHistorico} reservas totales
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── ROW 5: Ocupación por zona ───────────────────── */}
          {zonaStats.some(z => z.activa) && (
            <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-4">
                Tasa de ocupación — este mes
                <span className="text-[#6f7978] normal-case font-normal ml-1">
                  · sobre {14 * 30}h disponibles por zona
                </span>
              </p>
              <div className="flex flex-col gap-3">
                {zonaStats.filter(z => z.activa).map((z) => {
                  const tasa = Math.min(100, Math.round((z.horasMes / (14 * 30)) * 100))
                  const color = tasa >= 60 ? '#2f9e44' : tasa >= 30 ? '#e67700' : '#bec9c8'
                  return (
                    <div key={z.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[#1b1c1c] truncate">{z.nombre}</span>
                        <span className="text-xs font-semibold ml-2 flex-shrink-0" style={{ color }}>
                          {tasa}%
                        </span>
                      </div>
                      <div className="h-2 bg-[#f5f3f3] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${Math.max(tasa, 1)}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Alerta zonas baja utilización ──────────────── */}
          {zonasBajaUso.length > 0 && (
            <div className="bg-[#fff9db] border border-[#f59f00]/30 rounded-2xl p-4 mb-4">
              <p className="text-xs font-semibold text-[#e67700] uppercase tracking-wide mb-2">
                Zonas con baja utilización
              </p>
              <div className="flex flex-col gap-1.5">
                {zonasBajaUso.map(z => (
                  <div key={z.id} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#e67700] flex-shrink-0" />
                    <span className="text-sm text-[#1b1c1c]">
                      <strong>{z.nombre}</strong>
                      {' '}— {z.totalReservas === 0 ? 'sin reservas' : `solo ${z.totalReservas} reserva${z.totalReservas !== 1 ? 's' : ''}`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-[#6f7978] mt-2">
                Considera promoverlas o revisar su configuración desde Gestión de zonas.
              </p>
            </div>
          )}

          {/* ── Link a reservas ─────────────────────────────── */}
          <div className="flex justify-end">
            <Link
              href="/dashboard/admin/reservas"
              className="text-xs text-[#004746] hover:underline"
            >
              Ver todas las reservas →
            </Link>
          </div>
        </>
      )}
    </div>
  )
}
