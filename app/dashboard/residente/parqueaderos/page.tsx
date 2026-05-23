import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getParqueaderos, TIPO_PARQUEADERO } from '@/src/services/parqueaderos'

export default async function ResidenteParqueaderosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'residente') redirect('/dashboard')

  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id')
    .eq('conjunto_id', perfil.conjunto_id)
    .eq('residente_id', user.id)
    .single()

  const todos = await getParqueaderos(supabase, perfil.conjunto_id)
  const misParqueaderos = apto ? todos.filter((p) => p.apartamento_id === apto.id) : []

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mis datos</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Parqueaderos
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {misParqueaderos.length === 0
            ? 'Sin parqueaderos asignados'
            : `${misParqueaderos.length} parqueadero${misParqueaderos.length > 1 ? 's' : ''} asignado${misParqueaderos.length > 1 ? 's' : ''}`}
        </p>
      </div>

      {misParqueaderos.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#e8f3f3] flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
            </svg>
          </div>
          <p className="text-[#3f4948] text-sm font-medium">No tienes parqueaderos asignados</p>
          <p className="text-[#6f7978] text-xs mt-1">Contacta a la administración si necesitas uno.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {misParqueaderos.map((p) => (
            <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#e8f3f3] flex items-center justify-center flex-shrink-0">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <path d="M9 17V7h4a3 3 0 0 1 0 6H9"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-base font-bold text-[#1b1c1c]">P-{p.numero}</span>
                    <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                      {TIPO_PARQUEADERO[p.tipo]}
                    </span>
                    {p.cubierto && (
                      <span className="text-[10px] text-[#1971c2] bg-[#d0ebff] px-2 py-0.5 rounded-full">
                        Cubierto
                      </span>
                    )}
                  </div>
                  {p.observaciones && (
                    <p className="text-sm text-[#6f7978]">{p.observaciones}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-[#6f7978] mt-6">
        Para solicitar cambios en la asignación, comunícate con la administración.
      </p>
    </div>
  )
}
