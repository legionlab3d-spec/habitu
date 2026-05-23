import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getVehiculos, TIPO_VEHICULO } from '@/src/services/vehiculos'

export default async function VehiculosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const lista = await getVehiculos(supabase, perfil.conjunto_id)

  const porTipo = lista.reduce((acc, v) => {
    acc[v.tipo] = (acc[v.tipo] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Directorio</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Vehículos
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">{lista.length} vehículo{lista.length !== 1 ? 's' : ''} registrado{lista.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Resumen por tipo */}
      {lista.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(porTipo).map(([tipo, count]) => (
            <div key={tipo} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">{TIPO_VEHICULO[tipo as keyof typeof TIPO_VEHICULO] ?? tipo}</p>
              <p className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">{count}</p>
            </div>
          ))}
        </div>
      )}

      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay vehículos registrados.</p>
          <p className="text-[#6f7978] text-xs mt-1">Los residentes pueden registrar sus vehículos desde su portal.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((v) => {
            const apto = v.apartamentos as { numero: string; torre: string | null } | undefined
            const residente = (v.usuarios as { nombre: string } | undefined)?.nombre
            return (
              <div key={v.id} className="bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-bold text-[#1b1c1c] font-mono">{v.placa}</span>
                    <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                      {TIPO_VEHICULO[v.tipo]}
                    </span>
                  </div>
                  <p className="text-xs text-[#6f7978]">
                    {[v.marca, v.modelo, v.color].filter(Boolean).join(' · ')}
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
