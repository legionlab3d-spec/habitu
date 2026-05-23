import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getMisMascotas, TIPO_MASCOTA } from '@/src/services/mascotas'
import { desactivarMascota } from '@/app/actions/mascotas'
import MascotaForm from './_components/MascotaForm'

export default async function MascotasResidentePage() {
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

  const lista = await getMisMascotas(supabase, perfil.conjunto_id, user.id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Mi cuenta</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Mis Mascotas
        </h1>
      </div>

      {/* Registrar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Registrar mascota
        </h2>
        {apto ? (
          <MascotaForm apartamentoId={apto.id} />
        ) : (
          <p className="text-sm text-[#6f7978]">No tienes apartamento asignado. Contacta al administrador.</p>
        )}
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No tienes mascotas registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((m) => (
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
                </div>
                <p className="text-xs text-[#6f7978]">
                  {[m.raza, m.color].filter(Boolean).join(' · ')}
                </p>
              </div>
              <form action={async () => { 'use server'; await desactivarMascota(m.id) }}>
                <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#ffdad6]">
                  Eliminar
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
