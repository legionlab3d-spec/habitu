import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMisPaquetes, ESTADO_PAQUETE } from '@/src/services/paquetes'

export default async function PaquetesResidentePage() {
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

  const lista = apto ? await getMisPaquetes(supabase, perfil.conjunto_id, apto.id) : []
  const enPorteria = lista.filter((p) => p.estado === 'en_porteria')

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Paquetes
        </h1>
        {apto && (
          <p className="text-sm text-[#3f4948] mt-1">
            Apto {apto.numero}{apto.torre ? ` · Torre ${apto.torre}` : ''}
          </p>
        )}
      </div>

      {!apto && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No tienes apartamento asignado.</p>
          <p className="text-[#6f7978] text-xs mt-1">Contacta al administrador.</p>
        </div>
      )}

      {apto && enPorteria.length > 0 && (
        <div className="bg-[#d0ebff]/40 border border-[#1971c2]/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-[#1971c2]">
            Tienes {enPorteria.length} paquete{enPorteria.length > 1 ? 's' : ''} en portería
          </p>
          <p className="text-xs text-[#3f4948] mt-0.5">Recógelo{enPorteria.length > 1 ? 's' : ''} en portería.</p>
        </div>
      )}

      {apto && lista.length === 0 && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay paquetes registrados.</p>
        </div>
      )}

      {apto && lista.length > 0 && (
        <div className="flex flex-col gap-2">
          {lista.map((p) => {
            const estilo = ESTADO_PAQUETE[p.estado]
            return (
              <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                    </div>
                    <p className="text-sm text-[#1b1c1c]">
                      {p.empresa_envio ?? 'Paquete sin empresa'}
                      {p.numero_guia ? ` · Guía: ${p.numero_guia}` : ''}
                    </p>
                    {p.descripcion && (
                      <p className="text-xs text-[#6f7978]">{p.descripcion}</p>
                    )}
                  </div>
                  <span className="text-xs text-[#6f7978] flex-shrink-0">
                    {new Date(p.fecha_recepcion).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
