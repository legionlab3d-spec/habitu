import Link from 'next/link'
import type { StatsCartera, PeriodoRecaudo } from '@/src/services/cartera'
import { formatValor } from '@/src/services/cartera'

interface Props {
  stats: StatsCartera
  historico: PeriodoRecaudo[]
  pagos_por_verificar: number
  periodo: string
}

function labelMes(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '').toUpperCase()
}

const R = 38
const CIRC = 2 * Math.PI * R

function DonutSegment({ segmentos, total }: { segmentos: { valor: number; color: string; label: string }[]; total: number }) {
  if (total === 0) return <div className="flex items-center justify-center h-20"><p className="text-xs text-[#6f7978]">Sin datos</p></div>
  let offset = 0
  const arcos = segmentos.map((s) => {
    const pct = s.valor / total
    const largo = Math.max(0, pct * CIRC - 1.5)
    const a = { ...s, largo, offset }
    offset += pct * CIRC
    return a
  })
  return (
    <div className="flex items-center gap-4">
      <svg width="80" height="80" viewBox="0 0 90 90" className="flex-shrink-0">
        <circle cx="45" cy="45" r={R} fill="none" stroke="#f5f3f3" strokeWidth="10" />
        {arcos.map((a, i) => (
          <circle key={i} cx="45" cy="45" r={R} fill="none" stroke={a.color} strokeWidth="10"
            strokeDasharray={`${a.largo} ${CIRC}`}
            strokeDashoffset={CIRC / 4 - a.offset} strokeLinecap="butt" />
        ))}
      </svg>
      <div className="flex flex-col gap-1">
        {arcos.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: a.color }} />
            <span className="text-xs text-[#3f4948]">{a.label}</span>
            <span className="text-xs font-semibold text-[#1b1c1c] ml-auto pl-2">{a.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function SeccionFinanciero({ stats, historico, pagos_por_verificar, periodo }: Props) {
  const maxVal = Math.max(...historico.map(p => p.valor_pagado + p.valor_pendiente), 1)
  const pctRecaudo = stats.total_periodo > 0 ? Math.round((stats.pagado / stats.total_periodo) * 100) : 0
  const mes = new Date(parseInt(periodo.split('-')[0]), parseInt(periodo.split('-')[1]) - 1)
    .toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] capitalize">
          Cartera — {mes}
        </h2>
        <div className="flex items-center gap-2">
          {pagos_por_verificar > 0 && (
            <Link href="/dashboard/admin/cartera" className="text-[10px] font-bold bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full">
              {pagos_por_verificar} por verificar
            </Link>
          )}
          <Link href="/dashboard/admin/cartera" className="text-xs text-[#004746] hover:underline">
            Ver detalle →
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-5">
        {/* Donut */}
        <div>
          <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-3">
            Distribución de estados
          </p>
          <DonutSegment
            total={stats.total_periodo}
            segmentos={[
              { valor: stats.pagado,    color: '#69db7c', label: 'Al día' },
              { valor: stats.pendiente, color: '#ffd43b', label: 'Pendiente' },
              { valor: stats.mora,      color: '#ff6b6b', label: 'En mora' },
              { valor: stats.exonerado, color: '#ced4da', label: 'Exonerado' },
            ]}
          />
        </div>

        {/* KPIs */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-3 py-2.5 bg-[#f5f3f3] rounded-xl">
            <p className="text-xs text-[#3f4948]">% recaudo</p>
            <p className={`font-[family-name:var(--font-outfit)] text-xl font-bold ${pctRecaudo >= 70 ? 'text-[#2f9e44]' : pctRecaudo >= 40 ? 'text-[#e67700]' : 'text-[#ba1a1a]'}`}>
              {pctRecaudo}%
            </p>
          </div>
          <Link href="/dashboard/admin/cartera" className="flex items-center justify-between px-3 py-2.5 bg-[#d3f9d8]/60 rounded-xl hover:opacity-80 transition-opacity">
            <p className="text-xs text-[#2f9e44]">Recaudado</p>
            <p className="font-[family-name:var(--font-outfit)] font-bold text-[#2f9e44] text-sm">{formatValor(stats.valor_pagado)}</p>
          </Link>
          <Link href="/dashboard/admin/cartera?filtro=mora" className="flex items-center justify-between px-3 py-2.5 bg-[#ffdad6]/60 rounded-xl hover:opacity-80 transition-opacity">
            <p className="text-xs text-[#ba1a1a]">Por recaudar</p>
            <p className="font-[family-name:var(--font-outfit)] font-bold text-[#ba1a1a] text-sm">{formatValor(stats.valor_pendiente)}</p>
          </Link>
        </div>
      </div>

      {/* Barras históricas */}
      <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-2">
        Recaudo últimos 6 meses
      </p>
      <div className="flex items-end gap-1.5 h-16 mb-1">
        {historico.map((p) => {
          const pagPct  = (p.valor_pagado    / maxVal) * 100
          const pendPct = (p.valor_pendiente / maxVal) * 100
          const total   = pagPct + pendPct
          return (
            <div key={p.periodo} className="flex-1 flex flex-col items-center justify-end">
              {total > 0 ? (
                <div className="w-full rounded-t-sm overflow-hidden" style={{ height: `${Math.max(total, 4)}%` }}>
                  {pendPct > 0 && <div className="w-full bg-[#ffc9c9]" style={{ height: `${(pendPct / total) * 100}%` }} />}
                  {pagPct > 0  && <div className="w-full bg-[#69db7c]" style={{ height: `${(pagPct / total) * 100}%` }} />}
                </div>
              ) : (
                <div className="w-full bg-[#f5f3f3] rounded-t-sm" style={{ height: '4px' }} />
              )}
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5">
        {historico.map((p) => (
          <div key={p.periodo} className="flex-1 text-center">
            <span className="text-[9px] text-[#6f7978]">{labelMes(p.periodo)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
