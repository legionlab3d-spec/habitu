import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import {
  getPqrs,
  getStatsPqrs,
  TIPO_PQRS,
  CATEGORIA_PQRS,
  ESTADO_PQRS,
  type Pqrs,
} from '@/src/services/pqrs'
import { responderPqrs, actualizarEstadoPqrs } from '@/app/actions/pqrs'
import ResponderPqrsForm from './_components/ResponderPqrsForm'

const FILTROS: { value: string; label: string }[] = [
  { value: 'todos',      label: 'Todos' },
  { value: 'recibido',   label: 'Recibido' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto',   label: 'Resuelto' },
  { value: 'cerrado',    label: 'Cerrado' },
]

export default async function PqrsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ estado?: string; ver?: string }>
}) {
  const params = await searchParams
  const filtroEstado = params.estado ?? 'todos'
  const verDetalle = params.ver ?? null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, stats] = await Promise.all([
    getPqrs(supabase, perfil.conjunto_id, filtroEstado),
    getStatsPqrs(supabase, perfil.conjunto_id),
  ])

  const detalle = verDetalle ? lista.find((p) => p.id === verDetalle) ?? null : null

  let adjuntoUrl: string | null = null
  if (detalle?.adjunto_url) {
    const { data } = await supabase.storage.from('evidencias').createSignedUrl(detalle.adjunto_url, 3600)
    adjuntoUrl = data?.signedUrl ?? null
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · PQRS</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          PQRS
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">Peticiones, quejas, reclamos y sugerencias</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Recibidos',   val: stats.recibido   ?? 0, color: 'text-[#1971c2]' },
          { label: 'En proceso',  val: stats.en_proceso ?? 0, color: 'text-[#e67700]' },
          { label: 'Resueltos',   val: stats.resuelto   ?? 0, color: 'text-[#2f9e44]' },
          { label: 'Cerrados',    val: stats.cerrado    ?? 0, color: 'text-[#6f7978]' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
            <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{s.label}</p>
            <p className={`font-[family-name:var(--font-outfit)] text-3xl font-bold ${s.color}`}>{s.val}</p>
          </div>
        ))}
      </div>

      {/* Detalle / responder */}
      {detalle && (
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${ESTADO_PQRS[detalle.estado].bg} ${ESTADO_PQRS[detalle.estado].text}`}>
                  {ESTADO_PQRS[detalle.estado].label}
                </span>
                <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                  {TIPO_PQRS[detalle.tipo]}
                </span>
                <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                  {CATEGORIA_PQRS[detalle.categoria]}
                </span>
              </div>
              <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c]">
                {detalle.asunto}
              </h2>
              <p className="text-xs text-[#6f7978] mt-0.5">
                {(detalle.apartamentos as { numero: string; torre: string | null } | undefined)
                  ? `Apto ${detalle.apartamentos!.numero}${detalle.apartamentos!.torre ? ` · Torre ${detalle.apartamentos!.torre}` : ''} · `
                  : ''}
                {(detalle.usuarios as { nombre: string } | undefined)?.nombre ?? 'Residente'}
                {' · '}{new Date(detalle.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
            <a
              href="?"
              className="text-xs text-[#6f7978] hover:text-[#1b1c1c] transition-colors"
            >
              ← Volver
            </a>
          </div>

          <div className="bg-[#f5f3f3] rounded-xl p-4 mb-4">
            <p className="text-sm text-[#1b1c1c] whitespace-pre-line">{detalle.descripcion}</p>
          </div>

          {adjuntoUrl && (
            <a
              href={adjuntoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#004746] hover:underline mb-4 inline-block"
            >
              Ver adjunto →
            </a>
          )}

          {detalle.respuesta && (
            <div className="border border-[#2f9e44]/30 bg-[#d3f9d8]/30 rounded-xl p-4 mb-4">
              <p className="text-xs font-semibold text-[#2f9e44] uppercase tracking-wide mb-1">Respuesta</p>
              <p className="text-sm text-[#1b1c1c] whitespace-pre-line">{detalle.respuesta}</p>
              {detalle.fecha_respuesta && (
                <p className="text-xs text-[#6f7978] mt-1">
                  {new Date(detalle.fecha_respuesta).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              )}
            </div>
          )}

          <ResponderPqrsForm pqrs={detalle} />
        </div>
      )}

      {/* Filtros */}
      {!detalle && (
        <>
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
              </a>
            ))}
          </div>

          {lista.length === 0 ? (
            <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
              <p className="text-[#3f4948] text-sm font-medium">No hay PQRS para este filtro.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {lista.map((p) => {
                const apto = p.apartamentos as { numero: string; torre: string | null } | undefined
                const usuario = (p.usuarios as { nombre: string } | undefined)?.nombre
                const estilo = ESTADO_PQRS[p.estado]
                return (
                  <a
                    key={p.id}
                    href={`?${filtroEstado !== 'todos' ? `estado=${filtroEstado}&` : ''}ver=${p.id}`}
                    className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-start justify-between gap-4 hover:border-[#004746]/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                          {estilo.label}
                        </span>
                        <span className="text-[10px] text-[#6f7978]">{TIPO_PQRS[p.tipo]}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#1b1c1c] truncate">{p.asunto}</p>
                      <p className="text-xs text-[#6f7978]">
                        {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''} · ` : ''}
                        {usuario ?? 'Residente'}
                      </p>
                    </div>
                    <span className="text-xs text-[#6f7978] whitespace-nowrap flex-shrink-0">
                      {new Date(p.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  </a>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}
