import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMisVisitantes, TIPO_VISITA } from '@/src/services/visitantes'
import AutorizarVisitanteForm from './_components/AutorizarVisitanteForm'

export default async function VisitantesResidentePage() {
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

  const lista = await getMisVisitantes(supabase, perfil.conjunto_id, user.id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Visitantes
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">Pre-autoriza visitas para agilizar el ingreso</p>
      </div>

      {/* Pre-autorizar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Pre-autorizar visitante
        </h2>
        {apto ? (
          <AutorizarVisitanteForm apartamentoId={apto.id} />
        ) : (
          <p className="text-sm text-[#6f7978]">No tienes apartamento asignado. Contacta al administrador.</p>
        )}
      </div>

      {/* Historial */}
      {lista.length > 0 && (
        <div>
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3">
            Mis visitantes
          </h2>
          <div className="flex flex-col gap-2">
            {lista.map((v) => {
              const dentroEdificio = v.fecha_ingreso && !v.fecha_salida
              return (
                <div key={v.id} className={`bg-white border rounded-2xl px-4 py-3 ${dentroEdificio ? 'border-[#1971c2]/40' : 'border-[#bec9c8]'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        {dentroEdificio && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d0ebff] text-[#1971c2]">En edificio</span>
                        )}
                        {v.fecha_salida && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f3f3] text-[#6f7978]">Salió</span>
                        )}
                        <span className="text-[10px] text-[#6f7978]">{TIPO_VISITA[v.tipo_visita]}</span>
                      </div>
                      <p className="text-sm font-semibold text-[#1b1c1c]">{v.nombre}</p>
                      {v.codigo_acceso && (
                        <p className="text-xs font-mono font-bold text-[#004746]">Código: {v.codigo_acceso}</p>
                      )}
                    </div>
                    <span className="text-xs text-[#6f7978] flex-shrink-0">
                      {new Date(v.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
