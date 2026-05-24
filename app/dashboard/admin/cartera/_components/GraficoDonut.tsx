'use client'

interface Segmento {
  valor: number
  color: string
  label: string
}

interface Props {
  segmentos: Segmento[]
  total: number
}

const R = 38
const CIRCUNF = 2 * Math.PI * R
const GAP = 2 // gap between segments in px

export default function GraficoDonut({ segmentos, total }: Props) {
  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[120px]">
        <p className="text-xs text-[#6f7978]">Sin datos</p>
      </div>
    )
  }

  let offset = 0
  const arcos = segmentos.map((s) => {
    const porcentaje = s.valor / total
    const largo = Math.max(0, porcentaje * CIRCUNF - GAP)
    const arco = { ...s, largo, offset, porcentaje }
    offset += porcentaje * CIRCUNF
    return arco
  })

  return (
    <div className="flex items-center gap-5">
      <svg width="90" height="90" viewBox="0 0 90 90" className="flex-shrink-0">
        <circle cx="45" cy="45" r={R} fill="none" stroke="#f5f3f3" strokeWidth="10" />
        {arcos.map((a, i) => (
          <circle
            key={i}
            cx="45" cy="45" r={R}
            fill="none"
            stroke={a.color}
            strokeWidth="10"
            strokeDasharray={`${a.largo} ${CIRCUNF}`}
            strokeDashoffset={CIRCUNF / 4 - a.offset}
            strokeLinecap="butt"
          />
        ))}
      </svg>
      <div className="flex flex-col gap-1.5 min-w-0">
        {arcos.map((a, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: a.color }} />
            <span className="text-xs text-[#3f4948] truncate">{a.label}</span>
            <span className="text-xs font-semibold text-[#1b1c1c] ml-auto pl-2">{a.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
