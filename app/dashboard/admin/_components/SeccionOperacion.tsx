import Link from 'next/link'

interface Props {
  visitantes_activos: number
  paquetes_porteria: number
  vehiculos_pendientes: number
  llamados_activos: number
  paquetes_viejos: { numero: string; torre: string | null; dias: number }[]
  visitantes_expirados: { nombre: string; numero: string | null }[]
}

export default function SeccionOperacion({
  visitantes_activos, paquetes_porteria, vehiculos_pendientes,
  llamados_activos, paquetes_viejos, visitantes_expirados,
}: Props) {
  const items = [
    {
      label: 'Visitantes activos',
      val: visitantes_activos,
      sub: 'En el edificio ahora',
      href: '/dashboard/admin/visitantes',
      color: visitantes_activos > 0 ? 'text-[#1971c2]' : 'text-[#6f7978]',
      bg: visitantes_activos > 0 ? 'bg-[#d0ebff]/60' : 'bg-[#f5f3f3]',
    },
    {
      label: 'Paquetes en portería',
      val: paquetes_porteria,
      sub: paquetes_viejos.length > 0 ? `${paquetes_viejos.length} >7 días sin retirar` : 'En espera',
      href: '/dashboard/admin/paquetes',
      color: paquetes_viejos.length > 0 ? 'text-[#e67700]' : paquetes_porteria > 0 ? 'text-[#1971c2]' : 'text-[#6f7978]',
      bg: paquetes_viejos.length > 0 ? 'bg-[#fff9db]/60' : paquetes_porteria > 0 ? 'bg-[#d0ebff]/60' : 'bg-[#f5f3f3]',
    },
    {
      label: 'Vehículos pendientes',
      val: vehiculos_pendientes,
      sub: 'Por aprobar',
      href: '/dashboard/admin/vehiculos',
      color: vehiculos_pendientes > 0 ? 'text-[#e67700]' : 'text-[#6f7978]',
      bg: vehiculos_pendientes > 0 ? 'bg-[#fff9db]/60' : 'bg-[#f5f3f3]',
    },
    {
      label: 'Llamados activos',
      val: llamados_activos,
      sub: 'En curso',
      href: '/dashboard/admin/llamados',
      color: llamados_activos > 0 ? 'text-[#ba1a1a]' : 'text-[#6f7978]',
      bg: llamados_activos > 0 ? 'bg-[#ffdad6]/60' : 'bg-[#f5f3f3]',
    },
  ]

  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
          Operación
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {items.map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className={`${item.bg} rounded-xl p-3 hover:opacity-80 transition-opacity`}
          >
            <p className={`font-[family-name:var(--font-outfit)] text-2xl font-bold ${item.color}`}>{item.val}</p>
            <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mt-0.5">{item.label}</p>
            <p className="text-[10px] text-[#6f7978] mt-0.5">{item.sub}</p>
          </Link>
        ))}
      </div>

      {(paquetes_viejos.length > 0 || visitantes_expirados.length > 0) && (
        <div className="border-t border-[#f5f3f3] pt-3 flex flex-col gap-1.5">
          {paquetes_viejos.slice(0, 3).map((p) => (
            <Link key={`${p.numero}-${p.dias}`} href="/dashboard/admin/paquetes"
              className="flex items-center gap-2 text-xs text-[#e67700] hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-[#e67700] flex-shrink-0" />
              Apto {p.numero}{p.torre ? ` T.${p.torre}` : ''} — paquete hace {p.dias} días
            </Link>
          ))}
          {visitantes_expirados.slice(0, 2).map((v) => (
            <Link key={v.nombre} href="/dashboard/admin/visitantes"
              className="flex items-center gap-2 text-xs text-[#6f7978] hover:underline">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6f7978] flex-shrink-0" />
              {v.nombre}{v.numero ? ` — Apto ${v.numero}` : ''}: autorización expirada
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
