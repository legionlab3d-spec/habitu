import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import { getPaquetes, ESTADO_PAQUETE } from '@/src/services/paquetes'
import PaqueteForm from './_components/PaqueteForm'
import EntregarPaqueteForm from './_components/EntregarPaqueteForm'

const FILTROS = [
  { value: 'en_porteria',       label: 'En portería' },
  { value: 'pendiente_entrega', label: 'Pendiente' },
  { value: 'entregado',         label: 'Entregados' },
  { value: 'devuelto',          label: 'Devueltos' },
  { value: 'todos',             label: 'Todos' },
]

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default async function PaquetesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; apt?: string; quien?: string }>
}) {
  const params = await searchParams
  const filtro    = params.estado ?? 'en_porteria'
  const aptSearch = params.apt ?? ''
  const quienSearch = params.quien ?? ''

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, apartamentos] = await Promise.all([
    getPaquetes(supabase, perfil.conjunto_id, {
      estado: filtro,
      apartamento: aptSearch,
      recibido_por: quienSearch,
    }),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  const enPorteria = lista.filter((p) => p.estado === 'en_porteria').length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Portería</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Paquetes y Correspondencia
        </h1>
        {enPorteria > 0 && filtro === 'en_porteria' && (
          <p className="text-sm text-[#1971c2] mt-1 font-medium">
            {enPorteria} paquete{enPorteria > 1 ? 's' : ''} esperando ser retirado{enPorteria > 1 ? 's' : ''}
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

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap mb-3">
        {FILTROS.map((f) => (
          <Link
            key={f.value}
            href={`?estado=${f.value}${aptSearch ? `&apt=${aptSearch}` : ''}${quienSearch ? `&quien=${quienSearch}` : ''}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filtro === f.value
                ? 'bg-[#004746] text-white'
                : 'bg-white border border-[#bec9c8] text-[#3f4948] hover:bg-[#f5f3f3]'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Búsquedas */}
      <form method="get" className="flex gap-2 flex-wrap mb-4">
        <input type="hidden" name="estado" value={filtro} />
        <input
          name="apt"
          type="text"
          defaultValue={aptSearch}
          placeholder="Buscar por apartamento..."
          className="h-9 px-3 text-xs bg-white border border-[#bec9c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent min-w-[160px]"
        />
        <input
          name="quien"
          type="text"
          defaultValue={quienSearch}
          placeholder="Buscar por recibido por..."
          className="h-9 px-3 text-xs bg-white border border-[#bec9c8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent min-w-[180px]"
        />
        <button
          type="submit"
          className="h-9 px-4 text-xs bg-[#004746] text-white font-semibold rounded-xl hover:bg-[#08605f] transition-colors"
        >
          Filtrar
        </button>
        {(aptSearch || quienSearch) && (
          <Link
            href={`?estado=${filtro}`}
            className="h-9 px-3 text-xs text-[#6f7978] hover:text-[#1b1c1c] flex items-center rounded-xl hover:bg-[#f5f3f3] transition-colors"
          >
            Limpiar
          </Link>
        )}
      </form>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay paquetes para este filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((p) => {
            const apto = p.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (p.usuarios as { nombre: string } | undefined)?.nombre
            const estilo = ESTADO_PAQUETE[p.estado]

            return (
              <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c]">
                      {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                      {residente && <span className="font-normal text-[#3f4948]"> · {residente}</span>}
                    </p>
                    <p className="text-xs text-[#6f7978]">
                      {[p.empresa_envio, p.numero_guia ? `Guía: ${p.numero_guia}` : null, p.descripcion]
                        .filter(Boolean).join(' · ') || 'Sin detalle'}
                    </p>
                  </div>
                  {(p.estado === 'en_porteria' || p.estado === 'pendiente_entrega') && (
                    <EntregarPaqueteForm paqueteId={p.id} />
                  )}
                </div>

                {/* Timeline */}
                <div className="border-t border-[#f5f3f3] pt-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1971c2] flex-shrink-0" />
                    <span className="text-[10px] font-semibold text-[#3f4948] w-20 flex-shrink-0">Recibido</span>
                    <span className="text-[10px] text-[#6f7978]">
                      {formatTs(p.fecha_recepcion)}
                      {p.recibido_por_nombre && (
                        <span className="font-medium text-[#3f4948]"> · por {p.recibido_por_nombre}</span>
                      )}
                    </span>
                  </div>
                  {p.fecha_entrega && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2f9e44] flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-[#3f4948] w-20 flex-shrink-0">Entregado</span>
                      <span className="text-[10px] text-[#6f7978]">
                        {formatTs(p.fecha_entrega)}
                        {p.entregado_a && <span className="font-medium text-[#3f4948]"> · a {p.entregado_a}</span>}
                        {p.entregado_por && <span className="text-[#6f7978]"> (por {p.entregado_por})</span>}
                      </span>
                    </div>
                  )}
                  {p.estado === 'devuelto' && !p.fecha_entrega && (
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#6f7978] flex-shrink-0" />
                      <span className="text-[10px] font-semibold text-[#6f7978] w-20 flex-shrink-0">Devuelto</span>
                    </div>
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
