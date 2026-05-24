import Link from 'next/link'
import type { AdminDashboardFull } from '@/src/services/dashboard'
import { formatValor } from '@/src/services/cartera'

interface Props {
  d: AdminDashboardFull
}

export default function SeccionResumen({ d }: Props) {
  const ocupacionPct = d.apartamentos_total > 0
    ? Math.round((d.apartamentos_ocupados / d.apartamentos_total) * 100)
    : 0

  const kpis = [
    {
      label: 'Apts. ocupados',
      val: `${d.apartamentos_ocupados}/${d.apartamentos_total}`,
      sub: `${ocupacionPct}% ocupación`,
      href: '/dashboard/admin/apartamentos',
      color: 'text-[#1b1c1c]',
      dot: 'bg-[#004746]',
    },
    {
      label: 'Residentes',
      val: d.residentes_activos,
      sub: 'Propietarios + arrendatarios',
      href: '/dashboard/admin/apartamentos',
      color: 'text-[#1b1c1c]',
      dot: 'bg-[#004746]',
    },
    {
      label: 'Reservas hoy',
      val: d.reservas_hoy,
      sub: `${d.reservas_mes} este mes`,
      href: '/dashboard/admin/reservas',
      color: d.reservas_hoy > 0 ? 'text-[#1971c2]' : 'text-[#1b1c1c]',
      dot: d.reservas_hoy > 0 ? 'bg-[#1971c2]' : 'bg-[#bec9c8]',
    },
    {
      label: 'PQRS pendientes',
      val: d.pqrs_abiertas + d.pqrs_en_proceso,
      sub: d.pqrs_sin_respuesta_5d > 0 ? `${d.pqrs_sin_respuesta_5d} sin respuesta > 5d` : 'Al día',
      href: '/dashboard/admin/pqrs?estado=recibido',
      color: d.pqrs_sin_respuesta_5d > 0 ? 'text-[#ba1a1a]' : d.pqrs_abiertas > 0 ? 'text-[#e67700]' : 'text-[#2f9e44]',
      dot: d.pqrs_sin_respuesta_5d > 0 ? 'bg-[#ba1a1a]' : d.pqrs_abiertas > 0 ? 'bg-[#e67700]' : 'bg-[#2f9e44]',
    },
    {
      label: 'En mora',
      val: d.stats_cartera.mora,
      sub: formatValor(d.stats_cartera.valor_pendiente),
      href: '/dashboard/admin/cartera?filtro=mora',
      color: d.stats_cartera.mora > 0 ? 'text-[#ba1a1a]' : 'text-[#2f9e44]',
      dot: d.stats_cartera.mora > 0 ? 'bg-[#ba1a1a]' : 'bg-[#2f9e44]',
    },
    {
      label: 'Recaudado',
      val: formatValor(d.stats_cartera.valor_pagado),
      sub: `${d.stats_cartera.pagado} aptos al día`,
      href: '/dashboard/admin/cartera',
      color: 'text-[#2f9e44]',
      dot: 'bg-[#2f9e44]',
    },
    {
      label: 'Visitantes activos',
      val: d.visitantes_activos,
      sub: 'En el edificio ahora',
      href: '/dashboard/admin/visitantes',
      color: d.visitantes_activos > 0 ? 'text-[#1971c2]' : 'text-[#1b1c1c]',
      dot: d.visitantes_activos > 0 ? 'bg-[#1971c2]' : 'bg-[#bec9c8]',
    },
    {
      label: 'Vehículos',
      val: d.vehiculos_pendientes,
      sub: 'Pendientes aprobación',
      href: '/dashboard/admin/vehiculos',
      color: d.vehiculos_pendientes > 0 ? 'text-[#e67700]' : 'text-[#2f9e44]',
      dot: d.vehiculos_pendientes > 0 ? 'bg-[#e67700]' : 'bg-[#2f9e44]',
    },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
      {kpis.map((k) => (
        <Link
          key={k.label}
          href={k.href}
          className="bg-white border border-[#bec9c8] rounded-2xl p-4 hover:border-[#004746]/40 hover:shadow-sm transition-all group"
        >
          <div className="flex items-center gap-1.5 mb-2">
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${k.dot}`} />
            <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide leading-none">
              {k.label}
            </p>
          </div>
          <p className={`font-[family-name:var(--font-outfit)] text-2xl font-bold ${k.color} leading-none mb-1`}>
            {k.val}
          </p>
          <p className="text-[10px] text-[#6f7978]">{k.sub}</p>
        </Link>
      ))}
    </div>
  )
}
