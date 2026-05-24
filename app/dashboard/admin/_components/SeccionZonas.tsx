import Link from 'next/link'
import type { ZonaMini } from '@/src/services/dashboard'

interface Props {
  zonas_top3: ZonaMini[]
  hora_pico: number
  zonas_canceladas: number
  zonas_activas: number
  reservas_mes: number
  reservas_activas: number
}

const HORA_LABEL: Record<number, string> = {
  7: '7am', 8: '8am', 9: '9am', 10: '10am', 11: '11am', 12: '12pm',
  13: '1pm', 14: '2pm', 15: '3pm', 16: '4pm', 17: '5pm', 18: '6pm',
  19: '7pm', 20: '8pm', 21: '9pm',
}

function formatK(v: number): string {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${Math.round(v / 1_000)}K`
  return `$${v}`
}

export default function SeccionZonas({ zonas_top3, hora_pico, zonas_canceladas, zonas_activas, reservas_mes, reservas_activas }: Props) {
  const maxReservas = Math.max(...zonas_top3.map(z => z.reservas), 1)

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
          Zonas Comunes
        </h2>
        <Link href="/dashboard/admin/zonas" className="text-xs text-[#004746] hover:underline">
          Ver análisis →
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-[#f5f3f3] rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-outfit)] text-xl font-bold text-[#1b1c1c]">{zonas_activas}</p>
          <p className="text-[10px] text-[#6f7978] mt-0.5">Activas</p>
        </div>
        <div className="bg-[#f5f3f3] rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-outfit)] text-xl font-bold text-[#1971c2]">{reservas_mes}</p>
          <p className="text-[10px] text-[#6f7978] mt-0.5">Este mes</p>
        </div>
        <div className="bg-[#f5f3f3] rounded-xl p-3 text-center">
          <p className="font-[family-name:var(--font-outfit)] text-xl font-bold text-[#2f9e44]">{reservas_activas}</p>
          <p className="text-[10px] text-[#6f7978] mt-0.5">Activas</p>
        </div>
      </div>

      {zonas_top3.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-2">
            Top zonas por reservas
          </p>
          <div className="flex flex-col gap-2">
            {zonas_top3.map((z, i) => (
              <div key={z.id} className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#6f7978] w-4 flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs text-[#1b1c1c] truncate">{z.nombre}</span>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                      {z.ingresos > 0 && (
                        <span className="text-[10px] text-[#2f9e44]">{formatK(z.ingresos)}</span>
                      )}
                      <span className="text-xs font-semibold text-[#1b1c1c]">{z.reservas}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-[#f5f3f3] rounded-full overflow-hidden">
                    <div className="h-full bg-[#004746] rounded-full"
                      style={{ width: `${Math.max(4, (z.reservas / maxReservas) * 100)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        {hora_pico >= 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1971c2] flex-shrink-0" />
            <span className="text-xs text-[#6f7978]">Hora pico: <span className="font-semibold text-[#1b1c1c]">{HORA_LABEL[hora_pico] ?? `${hora_pico}h`}</span></span>
          </div>
        )}
        {zonas_canceladas > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e67700] flex-shrink-0" />
            <span className="text-xs text-[#6f7978]">{zonas_canceladas} canceladas/expiradas</span>
          </div>
        )}
      </div>
    </div>
  )
}
