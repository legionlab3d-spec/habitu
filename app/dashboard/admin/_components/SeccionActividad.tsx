import Link from 'next/link'
import type { ActividadItem } from '@/src/services/dashboard'

interface Props {
  actividad: ActividadItem[]
}

const TIPO_CONFIG: Record<ActividadItem['tipo'], { bg: string; text: string; icon: string }> = {
  pqrs:     { bg: 'bg-[#d0ebff]',    text: 'text-[#1971c2]', icon: '?' },
  reserva:  { bg: 'bg-[#d3f9d8]',    text: 'text-[#2f9e44]', icon: '◷' },
  pago:     { bg: 'bg-[#d3f9d8]',    text: 'text-[#2f9e44]', icon: '$' },
  vehiculo: { bg: 'bg-[#fff9db]',    text: 'text-[#e67700]', icon: '⊡' },
  anuncio:  { bg: 'bg-[#f5f3f3]',    text: 'text-[#3f4948]', icon: '◈' },
  llamado:  { bg: 'bg-[#ffdad6]',    text: 'text-[#ba1a1a]', icon: '!' },
}

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000)
  if (diff < 60) return `${diff}m`
  if (diff < 1440) return `${Math.floor(diff / 60)}h`
  return `${Math.floor(diff / 1440)}d`
}

export default function SeccionActividad({ actividad }: Props) {
  if (actividad.length === 0) return null

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
      <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
        Actividad reciente
      </h2>
      <div className="flex flex-col gap-1">
        {actividad.map((item, i) => {
          const cfg = TIPO_CONFIG[item.tipo]
          return (
            <Link
              key={i}
              href={item.href}
              className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-[#f5f3f3] transition-colors"
            >
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${cfg.bg} ${cfg.text}`}>
                {cfg.icon}
              </span>
              <span className="text-xs text-[#1b1c1c] flex-1 truncate">{item.descripcion}</span>
              <span className="text-[10px] text-[#6f7978] flex-shrink-0">{timeAgo(item.created_at)}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
