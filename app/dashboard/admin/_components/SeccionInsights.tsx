import Link from 'next/link'
import type { Insight } from '@/src/services/dashboard'

interface Props {
  insights: Insight[]
}

const TIPO_STYLES = {
  positivo: { bg: 'bg-[#d3f9d8]/60', border: 'border-[#2f9e44]/20', dot: 'bg-[#2f9e44]', text: 'text-[#2f9e44]' },
  warning:  { bg: 'bg-[#fff9db]/60', border: 'border-[#f59f00]/20', dot: 'bg-[#e67700]', text: 'text-[#e67700]' },
  info:     { bg: 'bg-[#d0ebff]/60', border: 'border-[#1971c2]/20', dot: 'bg-[#1971c2]', text: 'text-[#1971c2]' },
}

export default function SeccionInsights({ insights }: Props) {
  if (insights.length === 0) return null

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
          Insights del conjunto
        </h2>
        <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
          {insights.length} automático{insights.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {insights.map((ins, i) => {
          const s = TIPO_STYLES[ins.tipo]
          const inner = (
            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${s.bg} ${s.border}`}>
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${s.dot}`} />
              <p className="text-sm text-[#1b1c1c] flex-1">{ins.mensaje}</p>
              {ins.href && <span className={`text-xs ${s.text} flex-shrink-0`}>→</span>}
            </div>
          )
          return ins.href ? (
            <Link key={i} href={ins.href} className="hover:opacity-80 transition-opacity block">
              {inner}
            </Link>
          ) : (
            <div key={i}>{inner}</div>
          )
        })}
      </div>
    </div>
  )
}
