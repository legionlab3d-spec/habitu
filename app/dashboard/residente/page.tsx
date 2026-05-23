import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getResidenteDashboardData } from '@/src/services/dashboard'
import { formatValor, formatPeriodo } from '@/src/services/cartera'

const ESTADO_ESTILOS = {
  pendiente: { border: 'border-[#f59f00]/40 bg-[#fff9db]/30', badge: 'bg-[#fff9db] text-[#e67700]', label: 'Pendiente' },
  mora:      { border: 'border-[#ba1a1a]/40 bg-[#ffdad6]/30', badge: 'bg-[#ffdad6] text-[#ba1a1a]', label: 'En mora' },
  pagado:    { border: 'border-[#2f9e44]/40 bg-[#d3f9d8]/30', badge: 'bg-[#d3f9d8] text-[#2f9e44]', label: 'Al día' },
  exonerado: { border: 'border-[#bec9c8]   bg-[#f5f3f3]',     badge: 'bg-[#f5f3f3]  text-[#6f7978]', label: 'Exonerado' },
  parcial:   { border: 'border-[#1971c2]/40 bg-[#d0ebff]/30', badge: 'bg-[#d0ebff]  text-[#1971c2]', label: 'Pago parcial' },
} as const

export default async function ResidenteDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'residente' && perfil.rol !== 'propietario') redirect('/dashboard')

  const d = await getResidenteDashboardData(supabase, perfil.conjunto_id, user.id)
  const conjunto = (perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? 'Tu conjunto'

  const ec = d.estado_cuenta
  const estiloEc = ec ? (ESTADO_ESTILOS[ec.estado as keyof typeof ESTADO_ESTILOS] ?? ESTADO_ESTILOS.pendiente) : null

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-[#3f4948] font-semibold uppercase tracking-wide mb-1">Bienvenido</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Hola, {perfil.nombre.split(' ')[0]}
        </h1>
        <p className="text-[#3f4948] text-sm mt-1">
          {conjunto}
          {d.apartamento && ` · Apto ${d.apartamento.numero}${d.apartamento.torre ? ` Torre ${d.apartamento.torre}` : ''}`}
        </p>
      </div>

      {/* Alertas */}
      {(d.paquetes_en_porteria > 0 || d.llamados_activos > 0) && (
        <div className="flex flex-col gap-2 mb-5">
          {d.paquetes_en_porteria > 0 && (
            <Link
              href="/dashboard/residente/paquetes"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-[#d0ebff] border-[#1971c2]/30 hover:opacity-80 transition-opacity"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#1971c2]" />
              <span className="text-sm font-semibold text-[#1971c2]">
                {d.paquetes_en_porteria === 1
                  ? 'Tienes un paquete en portería'
                  : `Tienes ${d.paquetes_en_porteria} paquetes en portería`}
              </span>
              <span className="ml-auto text-xs text-[#1971c2] opacity-60">Ver →</span>
            </Link>
          )}
          {d.llamados_activos > 0 && (
            <Link
              href="/dashboard/residente/llamados"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl border bg-[#ffdad6] border-[#ba1a1a]/30 hover:opacity-80 transition-opacity"
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0 bg-[#ba1a1a]" />
              <span className="text-sm font-semibold text-[#ba1a1a]">
                {d.llamados_activos === 1
                  ? 'Tienes un llamado de atención activo'
                  : `Tienes ${d.llamados_activos} llamados de atención activos`}
              </span>
              <span className="ml-auto text-xs text-[#ba1a1a] opacity-60">Ver →</span>
            </Link>
          )}
        </div>
      )}

      {/* Estado de cuenta */}
      {!d.apartamento ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-6 mb-5 text-center">
          <p className="text-sm font-medium text-[#3f4948]">No tienes apartamento asignado.</p>
          <p className="text-xs text-[#6f7978] mt-1">Contacta al administrador.</p>
        </div>
      ) : !ec ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-6 mb-5">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
          <p className="text-sm text-[#6f7978]">No hay estados de cuenta generados aún.</p>
        </div>
      ) : (
        <Link
          href="/dashboard/residente/cartera"
          className={`block border-2 rounded-2xl p-5 mb-5 hover:opacity-90 transition-opacity ${estiloEc!.border}`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estiloEc!.badge}`}>
                {estiloEc!.label}
              </span>
              <p className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c] mt-2">
                {formatValor(ec.valor_total)}
              </p>
              <p className="text-xs text-[#3f4948] capitalize mt-0.5">{formatPeriodo(ec.periodo)}</p>
            </div>
            <div className="text-right text-xs text-[#6f7978]">
              <p>Cuota: {formatValor(ec.valor_cuota)}</p>
              {ec.valor_mora > 0 && (
                <p className="text-[#ba1a1a]">Mora: +{formatValor(ec.valor_mora)}</p>
              )}
              <p className="mt-1">
                Vence: {new Date(ec.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}
              </p>
            </div>
          </div>
          <p className="text-xs text-[#6f7978]">Toca para ver detalle y reportar pago →</p>
        </Link>
      )}

      {/* Accesos rápidos */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        {[
          { href: '/dashboard/residente/reservas',    label: 'Reservas',    icon: <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>, color: '' },
          { href: '/dashboard/residente/pqrs',        label: `PQRS${d.pqrs_pendientes > 0 ? ` (${d.pqrs_pendientes})` : ''}`,       icon: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>, color: d.pqrs_pendientes > 0 ? 'border-[#1971c2]/30' : '' },
          { href: '/dashboard/residente/visitantes',  label: 'Visitantes',  icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, color: '' },
          { href: '/dashboard/residente/vehiculos',   label: 'Vehículos',   icon: <><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>, color: '' },
          { href: '/dashboard/residente/mascotas',    label: 'Mascotas',    icon: <path d="M10 5.172C10 3.782 8.423 2.679 6.5 3c-2.823.47-4.113 6.006-4 7 .08.703 1.725 1.722 3.656 1 1.261-.472 1.96-1.45 2.344-2.5M14.267 5.172c0-1.39 1.577-2.493 3.5-2.172 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5M8 14v.5M16 14v.5M11.25 16.25h1.5L12 17M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444c0-1.061-.162-2.2-.493-3.309"/>, color: '' },
          { href: '/dashboard/residente/documentos',  label: 'Documentos',  icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/></>, color: '' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`bg-white border rounded-2xl p-4 flex items-center gap-3 hover:border-[#004746]/40 transition-colors ${item.color || 'border-[#bec9c8]'}`}
          >
            <div className="w-9 h-9 rounded-xl bg-[#f5f3f3] flex items-center justify-center flex-shrink-0">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                {item.icon}
              </svg>
            </div>
            <span className="text-sm font-semibold text-[#1b1c1c]">{item.label}</span>
          </Link>
        ))}
      </div>

      {/* Comunicados recientes */}
      {d.anuncios_recientes.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c]">
              Comunicados recientes
            </h2>
            <Link href="/dashboard/residente/comunicados" className="text-xs text-[#004746] hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="flex flex-col gap-2">
            {d.anuncios_recientes.map((a) => (
              <div key={a.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#f5f3f3] flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#1b1c1c] flex-1 truncate">{a.titulo}</p>
                <span className="text-xs text-[#6f7978] flex-shrink-0">
                  {new Date(a.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
