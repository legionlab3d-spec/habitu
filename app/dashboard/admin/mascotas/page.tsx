import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMascotas, TIPO_MASCOTA } from '@/src/services/mascotas'

export default async function MascotasAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const lista = await getMascotas(supabase, perfil.conjunto_id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Directorio</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Mascotas
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">{lista.length} mascota{lista.length !== 1 ? 's' : ''} registrada{lista.length !== 1 ? 's' : ''}</p>
      </div>

      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay mascotas registradas.</p>
          <p className="text-[#6f7978] text-xs mt-1">Los residentes pueden registrar sus mascotas desde su portal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((m) => {
            const apto = m.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (m.usuarios as { nombre: string } | undefined)?.nombre
            return (
              <div key={m.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-sm font-semibold text-[#1b1c1c]">{m.nombre}</span>
                    <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                      {TIPO_MASCOTA[m.tipo]}
                    </span>
                    {m.vacunas_al_dia && (
                      <span className="text-[10px] text-[#2f9e44] bg-[#d3f9d8] px-2 py-0.5 rounded-full">
                        Vacunas al día
                      </span>
                    )}
                    {m.soporte_emocional && (
                      <span className="text-[10px] text-[#1971c2] bg-[#d0ebff] px-2 py-0.5 rounded-full">
                        Soporte emocional
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6f7978]">
                    {[m.raza, m.color].filter(Boolean).join(' · ')}
                  </p>
                  <p className="text-xs text-[#6f7978]">
                    {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                    {residente ? ` · ${residente}` : ''}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
