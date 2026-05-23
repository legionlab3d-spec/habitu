import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import { getPaquetes, ESTADO_PAQUETE } from '@/src/services/paquetes'
import { entregarPaquete } from '@/app/actions/paquetes'
import PaqueteForm from './_components/PaqueteForm'

export default async function PaquetesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const params = await searchParams
  const filtro = params.estado ?? 'en_porteria'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, apartamentos] = await Promise.all([
    getPaquetes(supabase, perfil.conjunto_id, filtro),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  const enPorteria = lista.filter((p) => p.estado === 'en_porteria').length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Portería</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Paquetes
        </h1>
        {enPorteria > 0 && filtro === 'en_porteria' && (
          <p className="text-sm text-[#1971c2] mt-1 font-medium">
            {enPorteria} paquete{enPorteria > 1 ? 's' : ''} en portería
          </p>
        )}
      </div>

      {/* Registrar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Registrar paquete recibido
        </h2>
        <PaqueteForm apartamentos={apartamentos.map((a) => ({ id: a.id, numero: a.numero, torre: a.torre }))} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[
          { value: 'en_porteria', label: 'En portería' },
          { value: 'entregado',   label: 'Entregados' },
          { value: 'todos',       label: 'Todos' },
        ].map((f) => (
          <a
            key={f.value}
            href={`?estado=${f.value}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filtro === f.value
                ? 'bg-[#004746] text-white'
                : 'bg-white border border-[#bec9c8] text-[#3f4948] hover:bg-[#f5f3f3]'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay paquetes para este filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((p) => {
            const apto = p.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (p.usuarios as { nombre: string } | undefined)?.nombre
            const estilo = ESTADO_PAQUETE[p.estado]
            return (
              <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c]">
                      {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                      {residente && <span className="font-normal text-[#3f4948]"> · {residente}</span>}
                    </p>
                    <p className="text-xs text-[#6f7978]">
                      {p.empresa_envio ? `${p.empresa_envio} · ` : ''}
                      {p.numero_guia ? `Guía: ${p.numero_guia} · ` : ''}
                      {p.descripcion ?? 'Sin descripción'}
                    </p>
                    <p className="text-xs text-[#6f7978] mt-0.5">
                      Recibido: {new Date(p.fecha_recepcion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {p.fecha_entrega && ` · Entregado: ${new Date(p.fecha_entrega).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}`}
                    </p>
                  </div>
                  {p.estado === 'en_porteria' && (
                    <form action={async () => { 'use server'; await entregarPaquete(p.id, '') }}>
                      <button type="submit" className="text-xs text-[#2f9e44] border border-[#2f9e44] hover:bg-[#d3f9d8] transition-colors px-3 py-1.5 rounded-lg whitespace-nowrap">
                        Marcar entregado
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
