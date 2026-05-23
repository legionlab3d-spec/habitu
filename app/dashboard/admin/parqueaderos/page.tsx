import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import { getParqueaderos, TIPO_PARQUEADERO } from '@/src/services/parqueaderos'
import { asignarParqueadero, eliminarParqueadero } from '@/app/actions/parqueaderos'
import ParqueaderoForm from './_components/ParqueaderoForm'
import AsignarForm from './_components/AsignarForm'

export default async function ParqueaderosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, apartamentos] = await Promise.all([
    getParqueaderos(supabase, perfil.conjunto_id),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  const libres     = lista.filter((p) => !p.apartamento_id).length
  const ocupados   = lista.filter((p) => !!p.apartamento_id).length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Directorio</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Parqueaderos
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {lista.length} total · {ocupados} asignados · {libres} libres
        </p>
      </div>

      {/* Crear */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Agregar parqueadero
        </h2>
        <ParqueaderoForm />
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay parqueaderos registrados.</p>
          <p className="text-[#6f7978] text-xs mt-1">Usa el formulario de arriba para agregar el primero.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((p) => {
            const apto = p.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (p.usuarios as { nombre: string } | undefined)?.nombre
            const asignado = !!p.apartamento_id
            return (
              <div key={p.id} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-[#1b1c1c]">P-{p.numero}</span>
                      <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                        {TIPO_PARQUEADERO[p.tipo]}
                      </span>
                      {p.cubierto && (
                        <span className="text-[10px] text-[#1971c2] bg-[#d0ebff] px-2 py-0.5 rounded-full">
                          Cubierto
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        asignado
                          ? 'bg-[#d3f9d8] text-[#2f9e44]'
                          : 'bg-[#f5f3f3] text-[#6f7978]'
                      }`}>
                        {asignado ? 'Asignado' : 'Libre'}
                      </span>
                    </div>
                    {asignado && (
                      <p className="text-xs text-[#6f7978]">
                        {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                        {residente ? ` · ${residente}` : ''}
                      </p>
                    )}
                    {p.observaciones && (
                      <p className="text-xs text-[#6f7978] mt-0.5">{p.observaciones}</p>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AsignarForm
                      parqueaderoId={p.id}
                      apartamentoActualId={p.apartamento_id}
                      apartamentos={apartamentos.map((a) => ({
                        id: a.id,
                        numero: a.numero,
                        torre: a.torre,
                      }))}
                    />
                    {!asignado && (
                      <form action={async () => { 'use server'; await eliminarParqueadero(p.id) }}>
                        <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#ffdad6]">
                          Eliminar
                        </button>
                      </form>
                    )}
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
