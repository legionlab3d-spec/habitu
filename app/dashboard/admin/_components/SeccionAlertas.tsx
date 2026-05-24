import Link from 'next/link'
import type { Alerta } from '@/src/services/dashboard'

interface Props {
  alertas: Alerta[]
}

const NIVEL_STYLES = {
  urgent:  { bg: 'bg-[#ffdad6]',  border: 'border-[#ba1a1a]/30', dot: 'bg-[#ba1a1a]', text: 'text-[#ba1a1a]', icon: '⚠' },
  warning: { bg: 'bg-[#fff9db]',  border: 'border-[#f59f00]/30', dot: 'bg-[#e67700]', text: 'text-[#e67700]', icon: '!' },
  info:    { bg: 'bg-[#f5f3f3]',  border: 'border-[#bec9c8]',    dot: 'bg-[#6f7978]', text: 'text-[#3f4948]', icon: 'i' },
}

export default function SeccionAlertas({ alertas }: Props) {
  if (alertas.length === 0) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/30 rounded-2xl px-5 py-4 flex items-center gap-3 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-[#2f9e44] flex-shrink-0" />
        <p className="text-sm font-semibold text-[#2f9e44]">Todo en orden — sin alertas pendientes</p>
      </div>
    )
  }

  const urgentes  = alertas.filter(a => a.nivel === 'urgent')
  const warnings  = alertas.filter(a => a.nivel === 'warning')
  const infos     = alertas.filter(a => a.nivel === 'info')
  const ordenadas = [...urgentes, ...warnings, ...infos]

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
          Requiere atención
        </h2>
        {urgentes.length > 0 && (
          <span className="text-[10px] font-bold bg-[#ba1a1a] text-white px-2 py-0.5 rounded-full">
            {urgentes.length} urgente{urgentes.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {ordenadas.map((a, i) => {
          const s = NIVEL_STYLES[a.nivel]
          return (
            <Link
              key={i}
              href={a.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${s.bg} ${s.border} hover:opacity-80 transition-opacity`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <span className={`text-sm font-medium flex-1 ${s.text}`}>{a.mensaje}</span>
              {a.detalle && (
                <span className={`text-xs font-semibold ${s.text} flex-shrink-0`}>{a.detalle}</span>
              )}
              <span className={`text-xs opacity-50 flex-shrink-0 ${s.text}`}>Ver →</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
