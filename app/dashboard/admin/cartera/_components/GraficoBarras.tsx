'use client'

import type { PeriodoRecaudo } from '@/src/services/cartera'

interface Props {
  historico: PeriodoRecaudo[]
}

function labelMes(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number)
  return new Date(y, m - 1).toLocaleDateString('es-CO', { month: 'short' })
    .replace('.', '').toUpperCase()
}

function formatK(valor: number): string {
  if (valor >= 1_000_000) return `$${(valor / 1_000_000).toFixed(1)}M`
  if (valor >= 1_000)     return `$${Math.round(valor / 1_000)}K`
  return `$${valor}`
}

export default function GraficoBarras({ historico }: Props) {
  const maxValor = Math.max(...historico.map(p => p.valor_pagado + p.valor_pendiente), 1)

  return (
    <div className="flex items-end gap-2 h-28 w-full">
      {historico.map((p) => {
        const pagPct  = (p.valor_pagado    / maxValor) * 100
        const pendPct = (p.valor_pendiente / maxValor) * 100
        const totalH  = pagPct + pendPct
        return (
          <div key={p.periodo} className="flex-1 flex flex-col items-center gap-1 min-w-0">
            <div className="w-full flex flex-col justify-end" style={{ height: '80px' }}>
              {totalH > 0 && (
                <div className="w-full rounded-t-md overflow-hidden" style={{ height: `${totalH}%` }}>
                  {pendPct > 0 && (
                    <div
                      title={`Pendiente: ${formatK(p.valor_pendiente)}`}
                      className="w-full bg-[#ffc9c9]"
                      style={{ height: `${(pendPct / totalH) * 100}%` }}
                    />
                  )}
                  {pagPct > 0 && (
                    <div
                      title={`Recaudado: ${formatK(p.valor_pagado)}`}
                      className="w-full bg-[#69db7c]"
                      style={{ height: `${(pagPct / totalH) * 100}%` }}
                    />
                  )}
                </div>
              )}
              {totalH === 0 && (
                <div className="w-full bg-[#f5f3f3] rounded-t-md" style={{ height: '6px' }} />
              )}
            </div>
            <p className="text-[9px] font-semibold text-[#6f7978]">{labelMes(p.periodo)}</p>
          </div>
        )
      })}
    </div>
  )
}
