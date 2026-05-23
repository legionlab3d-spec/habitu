import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMisLlamados, TIPO_LLAMADO, ESTADO_LLAMADO } from '@/src/services/llamados'

export default async function LlamadosResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id, numero, torre')
    .eq('conjunto_id', perfil.conjunto_id)
    .or(`residente_id.eq.${user.id},propietario_id.eq.${user.id}`)
    .single()

  const lista = apto ? await getMisLlamados(supabase, perfil.conjunto_id, apto.id) : []
  const activos = lista.filter((l) => l.estado === 'activo' || l.estado === 'en_proceso')

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Llamados de Atención
        </h1>
        {apto && (
          <p className="text-sm text-[#3f4948] mt-1">
            Apto {apto.numero}{apto.torre ? ` · Torre ${apto.torre}` : ''}
          </p>
        )}
      </div>

      {!apto && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No tienes un apartamento asignado.</p>
          <p className="text-[#6f7978] text-xs mt-1">Contacta al administrador.</p>
        </div>
      )}

      {apto && activos.length > 0 && (
        <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/30 rounded-2xl p-4 mb-6">
          <p className="text-sm font-semibold text-[#ba1a1a]">
            Tienes {activos.length} llamado{activos.length > 1 ? 's' : ''} de atención activo{activos.length > 1 ? 's' : ''}
          </p>
          <p className="text-xs text-[#3f4948] mt-0.5">Comunícate con la administración si tienes dudas.</p>
        </div>
      )}

      {apto && lista.length === 0 && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No tienes llamados de atención registrados.</p>
        </div>
      )}

      {apto && lista.length > 0 && (
        <div className="flex flex-col gap-3">
          {lista.map((l) => {
            const estilo = ESTADO_LLAMADO[l.estado]
            return (
              <div key={l.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                      {estilo.label}
                    </span>
                    <span className="text-[10px] text-[#6f7978]">{TIPO_LLAMADO[l.tipo]}</span>
                  </div>
                  <span className="text-xs text-[#6f7978]">
                    {new Date(l.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <p className="text-sm text-[#1b1c1c] whitespace-pre-line">{l.descripcion}</p>
                {l.fecha_resolucion && (
                  <p className="text-xs text-[#2f9e44] mt-2">
                    Resuelto el {new Date(l.fecha_resolucion).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
