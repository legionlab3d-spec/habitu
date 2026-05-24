import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getAdminDashboardData } from '@/src/services/dashboard'
import { formatValor } from '@/src/services/cartera'

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const d = await getAdminDashboardData(supabase, perfil.conjunto_id)
  const conjunto = (perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? 'Tu conjunto'
  const mes = new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })

  const alertas = [
    d.pagos_por_verificar > 0 && {
      href: '/dashboard/admin/cartera',
      label: `${d.pagos_por_verificar} pago${d.pagos_por_verificar > 1 ? 's' : ''} por verificar`,
      bg: 'bg-[#fff9db] border-[#f59f00]/30',
      text: 'text-[#e67700]',
      dot: 'bg-[#e67700]',
    },
    d.pqrs_sin_responder > 0 && {
      href: '/dashboard/admin/pqrs',
      label: `${d.pqrs_sin_responder} PQRS sin responder`,
      bg: 'bg-[#d0ebff] border-[#1971c2]/30',
      text: 'text-[#1971c2]',
      dot: 'bg-[#1971c2]',
    },
    d.paquetes_en_porteria > 0 && {
      href: '/dashboard/admin/paquetes',
      label: `${d.paquetes_en_porteria} paquete${d.paquetes_en_porteria > 1 ? 's' : ''} en portería`,
      bg: 'bg-[#d0ebff] border-[#1971c2]/30',
      text: 'text-[#1971c2]',
      dot: 'bg-[#1971c2]',
    },
    d.llamados_activos > 0 && {
      href: '/dashboard/admin/llamados',
      label: `${d.llamados_activos} llamado${d.llamados_activos > 1 ? 's' : ''} de atención activo${d.llamados_activos > 1 ? 's' : ''}`,
      bg: 'bg-[#ffdad6] border-[#ba1a1a]/30',
      text: 'text-[#ba1a1a]',
      dot: 'bg-[#ba1a1a]',
    },
    d.cartera_mora > 0 && {
      href: '/dashboard/admin/cartera',
      label: `${d.cartera_mora} apartamento${d.cartera_mora > 1 ? 's' : ''} en mora`,
      bg: 'bg-[#ffdad6] border-[#ba1a1a]/30',
      text: 'text-[#ba1a1a]',
      dot: 'bg-[#ba1a1a]',
    },
    d.visitantes_activos > 0 && {
      href: '/dashboard/admin/visitantes',
      label: `${d.visitantes_activos} visitante${d.visitantes_activos > 1 ? 's' : ''} en el edificio`,
      bg: 'bg-[#f5f3f3] border-[#bec9c8]',
      text: 'text-[#3f4948]',
      dot: 'bg-[#3f4948]',
    },
  ].filter(Boolean) as { href: string; label: string; bg: string; text: string; dot: string }[]

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-[#3f4948] font-semibold uppercase tracking-wide mb-1">Panel de Control</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Hola, {perfil.nombre.split(' ')[0]}
        </h1>
        <p className="text-[#3f4948] text-sm mt-1">{conjunto} · {mes}</p>
      </div>

      {/* Alertas operativas */}
      {alertas.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {alertas.map((a) => (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${a.bg} transition-opacity hover:opacity-80`}
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.dot}`} />
              <span className={`text-sm font-semibold ${a.text}`}>{a.label}</span>
              <span className={`ml-auto text-xs ${a.text} opacity-60`}>Ver →</span>
            </Link>
          ))}
        </div>
      )}

      {/* Cartera del período */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
            Cartera — {mes}
          </h2>
          <Link href="/dashboard/admin/cartera" className="text-xs text-[#004746] hover:underline">
            Ver detalle →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Pendientes',   val: d.cartera_pendiente,            color: 'text-[#e67700]', href: '/dashboard/admin/cartera?filtro=pendiente' },
            { label: 'En mora',      val: d.cartera_mora,                 color: 'text-[#ba1a1a]', href: '/dashboard/admin/cartera?filtro=mora' },
            { label: 'Por recaudar', val: formatValor(d.cartera_valor_pendiente), color: 'text-[#e67700]', big: false, href: '/dashboard/admin/cartera' },
            { label: 'Recaudado',   val: formatValor(d.cartera_valor_recaudado),  color: 'text-[#2f9e44]', big: false, href: '/dashboard/admin/cartera?filtro=pagado' },
          ].map((s) => (
            <Link
              key={s.label}
              href={s.href}
              className="bg-[#f5f3f3] rounded-xl p-3 hover:bg-[#edecea] transition-colors"
            >
              <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{s.label}</p>
              <p className={`font-[family-name:var(--font-outfit)] font-bold ${s.color} ${'big' in s && s.big === false ? 'text-base' : 'text-2xl'}`}>
                {s.val}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Stats de estructura */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Apartamentos', val: d.apartamentos_total, sub: `${d.apartamentos_ocupados} ocupados`, href: '/dashboard/admin/apartamentos' },
          { label: 'Reservas',     val: d.reservas_mes,       sub: 'Este mes',                             href: '/dashboard/admin/reservas' },
          { label: 'Comunicados',  val: d.anuncios_publicados, sub: 'Publicados',                          href: '/dashboard/admin/comunicados' },
          { label: 'Visitantes',   val: d.visitantes_activos,  sub: 'En edificio',                         href: '/dashboard/admin/visitantes' },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-white border border-[#bec9c8] rounded-2xl p-4 hover:border-[#004746]/40 transition-colors"
          >
            <p className="text-[10px] font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{s.label}</p>
            <p className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">{s.val}</p>
            <p className="text-[10px] text-[#6f7978] mt-1">{s.sub}</p>
          </Link>
        ))}
      </div>

      {/* Actividad reciente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* PQRS recientes */}
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
              PQRS recientes
            </h2>
            <Link href="/dashboard/admin/pqrs" className="text-xs text-[#004746] hover:underline">Ver todas</Link>
          </div>
          {d.pqrs_recientes.length === 0 ? (
            <p className="text-xs text-[#6f7978]">Sin PQRS registradas.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {d.pqrs_recientes.map((p) => (
                <Link
                  key={p.id}
                  href={`/dashboard/admin/pqrs?ver=${p.id}`}
                  className="flex items-start gap-2 hover:bg-[#f5f3f3] rounded-xl px-2 py-1.5 transition-colors"
                >
                  <span className="text-[10px] font-semibold text-[#6f7978] bg-[#f5f3f3] px-1.5 py-0.5 rounded capitalize flex-shrink-0 mt-0.5">
                    {p.tipo}
                  </span>
                  <span className="text-xs text-[#1b1c1c] truncate flex-1">{p.asunto}</span>
                  <span className="text-[10px] text-[#6f7978] flex-shrink-0">
                    {new Date(p.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Pagos por verificar */}
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c]">
              Pagos por verificar
            </h2>
            <Link href="/dashboard/admin/cartera" className="text-xs text-[#004746] hover:underline">Ver todos</Link>
          </div>
          {d.pagos_recientes.length === 0 ? (
            <p className="text-xs text-[#6f7978]">No hay pagos pendientes.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {d.pagos_recientes.map((p) => {
                const apto = p.apartamentos as { numero: string; torre: string | null } | null
                return (
                  <div key={p.id} className="flex items-center gap-2 px-2 py-1.5">
                    <span className="text-xs font-semibold text-[#1b1c1c]">
                      {apto ? `Apto ${apto.numero}` : '—'}
                    </span>
                    <span className="text-xs text-[#6f7978]">{p.metodo}</span>
                    <span className="ml-auto text-xs font-semibold text-[#e67700]">
                      {formatValor(p.monto)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
