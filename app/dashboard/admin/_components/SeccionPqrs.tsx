import Link from 'next/link'
import type { PqrsCategoriaStats } from '@/src/services/dashboard'

interface Props {
  total: number
  abiertas: number
  en_proceso: number
  resueltas: number
  por_categoria: PqrsCategoriaStats[]
  sin_respuesta_5d: number
  dias_promedio: number
}

export default function SeccionPqrs({
  total, abiertas, en_proceso, resueltas, por_categoria,
  sin_respuesta_5d, dias_promedio,
}: Props) {
  const maxCateg = Math.max(...por_categoria.map(c => c.count), 1)

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
          PQRS y Convivencia
        </h2>
        <Link href="/dashboard/admin/pqrs" className="text-xs text-[#004746] hover:underline">
          Ver todas →
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

        {/* Estado PQRS */}
        <div>
          <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-3">
            Estado actual
          </p>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Recibidas', val: abiertas, color: 'bg-[#d0ebff]', text: 'text-[#1971c2]', href: '/dashboard/admin/pqrs?estado=recibido' },
              { label: 'En proceso', val: en_proceso, color: 'bg-[#fff9db]', text: 'text-[#e67700]', href: '/dashboard/admin/pqrs?estado=en_proceso' },
              { label: 'Resueltas', val: resueltas, color: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', href: '/dashboard/admin/pqrs?estado=resuelto' },
            ].map((s) => (
              <Link key={s.label} href={s.href}
                className={`flex items-center justify-between px-3 py-2 rounded-xl ${s.color} hover:opacity-80 transition-opacity`}>
                <p className={`text-sm font-medium ${s.text}`}>{s.label}</p>
                <p className={`font-[family-name:var(--font-outfit)] text-xl font-bold ${s.text}`}>{s.val}</p>
              </Link>
            ))}
          </div>

          {/* Indicadores */}
          <div className="mt-3 flex flex-col gap-1.5">
            {sin_respuesta_5d > 0 && (
              <Link href="/dashboard/admin/pqrs?estado=recibido" className="flex items-center gap-2 text-xs text-[#ba1a1a] hover:underline">
                <span className="w-1.5 h-1.5 rounded-full bg-[#ba1a1a] flex-shrink-0" />
                {sin_respuesta_5d} sin respuesta &gt;5 días
              </Link>
            )}
            {dias_promedio > 0 && (
              <p className="text-xs text-[#6f7978]">
                Tiempo promedio de respuesta: <span className={`font-semibold ${dias_promedio <= 2 ? 'text-[#2f9e44]' : dias_promedio <= 5 ? 'text-[#e67700]' : 'text-[#ba1a1a]'}`}>{dias_promedio} día{dias_promedio !== 1 ? 's' : ''}</span>
              </p>
            )}
            <p className="text-xs text-[#6f7978]">{total} PQRS en total</p>
          </div>
        </div>

        {/* Por categoría */}
        <div>
          <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-3">
            Por categoría
          </p>
          {por_categoria.length === 0 ? (
            <p className="text-xs text-[#6f7978]">Sin PQRS registradas.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {por_categoria.slice(0, 5).map((c) => (
                <div key={c.categoria}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-[#1b1c1c] truncate">{c.label}</span>
                    <span className="text-xs font-semibold text-[#1b1c1c] ml-2 flex-shrink-0">{c.count}</span>
                  </div>
                  <div className="h-1.5 bg-[#f5f3f3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#004746] rounded-full"
                      style={{ width: `${Math.max(4, (c.count / maxCateg) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
