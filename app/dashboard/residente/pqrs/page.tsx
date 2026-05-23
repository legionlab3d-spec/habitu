import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMisPqrs, TIPO_PQRS, CATEGORIA_PQRS, ESTADO_PQRS } from '@/src/services/pqrs'
import PqrsForm from './_components/PqrsForm'

export default async function PqrsResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id, numero, torre')
    .eq('conjunto_id', perfil.conjunto_id)
    .eq('residente_id', user.id)
    .single()

  const lista = await getMisPqrs(supabase, perfil.conjunto_id, user.id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta · PQRS</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          PQRS
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">Peticiones, quejas, reclamos y sugerencias</p>
      </div>

      {/* Formulario nuevo */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Crear nueva PQRS
        </h2>
        <PqrsForm apartamentoId={apto?.id ?? null} />
      </div>

      {/* Mis PQRS */}
      {lista.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3">
            Mis solicitudes
          </h2>
          <div className="flex flex-col gap-3">
            {lista.map((p) => {
              const estilo = ESTADO_PQRS[p.estado]
              return (
                <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                      <span className="text-[10px] text-[#6f7978]">{TIPO_PQRS[p.tipo]}</span>
                      <span className="text-[10px] text-[#6f7978]">{CATEGORIA_PQRS[p.categoria]}</span>
                    </div>
                    <span className="text-xs text-[#6f7978]">
                      {new Date(p.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-[#1b1c1c]">{p.asunto}</p>
                  <p className="text-xs text-[#6f7978] mt-0.5 line-clamp-2">{p.descripcion}</p>

                  {p.respuesta && (
                    <div className="mt-3 border-t border-[#bec9c8] pt-3">
                      <p className="text-xs font-semibold text-[#2f9e44] uppercase tracking-wide mb-1">Respuesta de administración</p>
                      <p className="text-sm text-[#1b1c1c] whitespace-pre-line">{p.respuesta}</p>
                      {p.fecha_respuesta && (
                        <p className="text-xs text-[#6f7978] mt-1">
                          {new Date(p.fecha_respuesta).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
