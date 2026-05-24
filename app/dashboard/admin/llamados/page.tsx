import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import {
  getLlamados,
  TIPO_LLAMADO,
  ESTADO_LLAMADO,
  formatFechaHora,
} from '@/src/services/llamados'
import { actualizarEstadoLlamado } from '@/app/actions/llamados'
import LlamadoForm from './_components/LlamadoForm'

const FILTROS: { value: string; label: string }[] = [
  { value: 'todos',      label: 'Todos' },
  { value: 'activo',     label: 'Activo' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto',   label: 'Resuelto' },
  { value: 'archivado',  label: 'Archivado' },
]

export default async function LlamadosAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string }>
}) {
  const params = await searchParams
  const filtroEstado = params.estado ?? 'todos'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, apartamentos] = await Promise.all([
    getLlamados(supabase, perfil.conjunto_id, filtroEstado),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  const activos  = lista.filter((l) => l.estado === 'activo').length
  const proceso  = lista.filter((l) => l.estado === 'en_proceso').length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Convivencia</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Llamados de Atención
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {activos + proceso > 0
            ? `${activos + proceso} llamado${activos + proceso > 1 ? 's' : ''} pendiente${activos + proceso > 1 ? 's' : ''}`
            : 'Sin llamados pendientes'}
        </p>
      </div>

      {/* Nuevo llamado */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Crear llamado de atención
        </h2>
        <LlamadoForm apartamentos={apartamentos.map((a) => ({ id: a.id, numero: a.numero, torre: a.torre }))} />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap mb-4">
        {FILTROS.map((f) => (
          <a
            key={f.value}
            href={f.value === 'todos' ? '?' : `?estado=${f.value}`}
            className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
              filtroEstado === f.value
                ? 'bg-[#004746] text-white'
                : 'bg-white border border-[#bec9c8] text-[#3f4948] hover:bg-[#f5f3f3]'
            }`}
          >
            {f.label}
            {f.value === 'todos' && (activos + proceso) > 0 && (
              <span className="ml-1.5 bg-[#ba1a1a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {activos + proceso}
              </span>
            )}
          </a>
        ))}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay llamados de atención para este filtro.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {lista.map((l) => {
            const apto = l.apartamentos as { numero: string; torre: string | null } | undefined
            const creador = (l.creadores as { nombre: string } | undefined)?.nombre
            const estilo = ESTADO_LLAMADO[l.estado]

            const timeline: { label: string; fecha: string; color: string }[] = [
              { label: 'Creado', fecha: formatFechaHora(l.created_at), color: 'bg-[#004746]' },
            ]
            if (l.fecha_en_proceso) {
              timeline.push({ label: 'En proceso', fecha: formatFechaHora(l.fecha_en_proceso), color: 'bg-[#e67700]' })
            }
            if (l.fecha_resolucion) {
              timeline.push({ label: 'Resuelto', fecha: formatFechaHora(l.fecha_resolucion), color: 'bg-[#2f9e44]' })
            }

            return (
              <div key={l.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                      <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                        {TIPO_LLAMADO[l.tipo]}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c]">
                      {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                    </p>
                    <p className="text-xs text-[#6f7978] mt-0.5 line-clamp-2">{l.descripcion}</p>
                    {creador && (
                      <p className="text-[10px] text-[#6f7978] mt-1">Por: {creador}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2 flex-shrink-0 flex-wrap">
                    {l.estado === 'activo' && (
                      <form action={async () => { 'use server'; await actualizarEstadoLlamado(l.id, 'en_proceso') }}>
                        <button type="submit" className="text-xs text-[#e67700] border border-[#e67700] hover:bg-[#fff9db] transition-colors px-3 py-1.5 rounded-lg">
                          En proceso
                        </button>
                      </form>
                    )}
                    {(l.estado === 'activo' || l.estado === 'en_proceso') && (
                      <form action={async () => { 'use server'; await actualizarEstadoLlamado(l.id, 'resuelto') }}>
                        <button type="submit" className="text-xs text-[#2f9e44] border border-[#2f9e44] hover:bg-[#d3f9d8] transition-colors px-3 py-1.5 rounded-lg">
                          Resuelto
                        </button>
                      </form>
                    )}
                    {l.estado !== 'archivado' && (
                      <form action={async () => { 'use server'; await actualizarEstadoLlamado(l.id, 'archivado') }}>
                        <button type="submit" className="text-xs text-[#6f7978] hover:text-[#1b1c1c] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#f5f3f3]">
                          Archivar
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                <div className="border-t border-[#f5f3f3] pt-2.5">
                  <div className="flex flex-col gap-1.5">
                    {timeline.map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${t.color}`} />
                        <span className="text-[10px] font-semibold text-[#3f4948] w-16 flex-shrink-0">{t.label}</span>
                        <span className="text-[10px] text-[#6f7978]">{t.fecha}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
