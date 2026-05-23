import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import { eliminarApartamento } from '@/app/actions/apartamentos'
import ApartamentoForm from './_components/ApartamentoForm'

export default async function ApartamentosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const apartamentos = await getApartamentos(supabase, perfil.conjunto_id)

  // Agrupar por torre
  const porTorre = apartamentos.reduce<Record<string, typeof apartamentos>>(
    (acc, a) => {
      const key = a.torre ?? 'Sin torre'
      if (!acc[key]) acc[key] = []
      acc[key].push(a)
      return acc
    },
    {}
  )

  return (
    <div className="p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
          Admin · Apartamentos
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">
          Apartamentos
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {apartamentos.length} apartamento{apartamentos.length !== 1 ? 's' : ''} registrado{apartamentos.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Formulario agregar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Agregar apartamento
        </h2>
        <ApartamentoForm />
      </div>

      {/* Lista */}
      {apartamentos.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-10 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay apartamentos aún.</p>
          <p className="text-[#6f7978] text-xs mt-1">Usa el formulario de arriba para agregar el primero.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {Object.entries(porTorre).sort().map(([torre, items]) => (
            <div key={torre}>
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-widest mb-2 px-1">
                {torre}
              </p>
              <div className="bg-white border border-[#bec9c8] rounded-2xl overflow-hidden">
                {items.map((apt, i) => (
                  <div
                    key={apt.id}
                    className={`flex items-center justify-between px-5 py-3.5 ${
                      i < items.length - 1 ? 'border-b border-[#efeded]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#f5f3f3] flex items-center justify-center flex-shrink-0">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9,22 9,12 15,12 15,22"/>
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1b1c1c]">
                          Apto {apt.numero}
                          {apt.torre ? ` · Torre ${apt.torre}` : ''}
                        </p>
                        <p className="text-xs text-[#6f7978]">
                          {apt.residente_id ? 'Con residente' : 'Sin residente'}
                          {apt.propietario_id ? ' · Con propietario' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Eliminar solo si no tiene residente ni propietario */}
                    {!apt.residente_id && !apt.propietario_id && (
                      <form
                        action={async () => {
                          'use server'
                          await eliminarApartamento(apt.id)
                        }}
                      >
                        <button
                          type="submit"
                          className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6]"
                        >
                          Eliminar
                        </button>
                      </form>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
