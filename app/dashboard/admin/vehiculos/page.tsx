import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getVehiculos, getVehiculosPendientes, TIPO_VEHICULO, ESTADO_VEHICULO } from '@/src/services/vehiculos'
import { aprobarVehiculo } from '@/app/actions/vehiculos'
import RechazarVehiculoForm from './_components/RechazarVehiculoForm'

export default async function VehiculosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [pendientes, lista] = await Promise.all([
    getVehiculosPendientes(supabase, perfil.conjunto_id),
    getVehiculos(supabase, perfil.conjunto_id),
  ])

  const aprobados = lista.filter(v => v.estado === 'aprobado')
  const porTipo = aprobados.reduce((acc, v) => {
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
        <p className="text-sm text-[#3f4948] mt-1">
          {aprobados.length} aprobado{aprobados.length !== 1 ? 's' : ''}
          {pendientes.length > 0 && ` · ${pendientes.length} pendiente${pendientes.length !== 1 ? 's' : ''} de revisión`}
        </p>
      </div>

      {/* Pendientes de aprobación */}
      {pendientes.length > 0 && (
        <div className="mb-8">
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3 flex items-center gap-2">
            Pendientes de aprobación
            <span className="text-xs font-semibold bg-[#fff9db] text-[#e67700] px-2 py-0.5 rounded-full">
              {pendientes.length}
            </span>
          </h2>
          <div className="flex flex-col gap-3">
            {pendientes.map((v) => {
              const apto = v.apartamentos as { numero: string; torre: string | null } | undefined
              const residente = (v.usuarios as { nombre: string } | undefined)?.nombre
              return (
                <div key={v.id} className="bg-white border border-[#f59f00]/40 rounded-2xl px-4 py-3">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="text-sm font-bold text-[#1b1c1c] font-mono">{v.placa}</span>
                        <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                          {TIPO_VEHICULO[v.tipo]}
                        </span>
                      </div>
                      <p className="text-xs text-[#6f7978]">
                        {[v.marca, v.modelo, v.color].filter(Boolean).join(' · ') || '—'}
                      </p>
                      <p className="text-xs text-[#6f7978] mt-0.5">
                        {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                        {residente ? ` · ${residente}` : ''}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0 min-w-[120px]">
                      <form action={async () => { 'use server'; await aprobarVehiculo(v.id) }}>
                        <button
                          type="submit"
                          className="text-xs text-[#2f9e44] hover:text-white hover:bg-[#2f9e44] transition-colors px-3 py-1 rounded-lg border border-[#2f9e44] w-full"
                        >
                          Aprobar
                        </button>
                      </form>
                      <RechazarVehiculoForm vehiculoId={v.id} />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Resumen aprobados por tipo */}
      {aprobados.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Object.entries(porTipo).map(([tipo, count]) => (
            <div key={tipo} className="bg-white border border-[#bec9c8] rounded-2xl p-4">
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
                {TIPO_VEHICULO[tipo as keyof typeof TIPO_VEHICULO] ?? tipo}
              </p>
              <p className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">{count}</p>
            </div>
          ))}
        </div>
      )}

      {/* Lista completa */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay vehículos registrados.</p>
          <p className="text-[#6f7978] text-xs mt-1">Los residentes pueden registrar sus vehículos desde su portal.</p>
        </div>
      ) : (
        <>
          <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-3">
            Directorio
          </h2>
          <div className="flex flex-col gap-2">
            {lista.map((v) => {
              const apto = v.apartamentos as { numero: string; torre: string | null } | undefined
              const residente = (v.usuarios as { nombre: string } | undefined)?.nombre
              const estadoStyle = ESTADO_VEHICULO[v.estado]
              return (
                <div
                  key={v.id}
                  className={`bg-white border border-[#bec9c8] rounded-2xl px-4 py-3 flex items-center justify-between gap-4 ${v.estado === 'rechazado' ? 'opacity-60' : ''}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-bold text-[#1b1c1c] font-mono">{v.placa}</span>
                      <span className="text-[10px] text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full">
                        {TIPO_VEHICULO[v.tipo]}
                      </span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estadoStyle.bg} ${estadoStyle.text}`}>
                        {estadoStyle.label}
                      </span>
                    </div>
                    <p className="text-xs text-[#6f7978]">
                      {[v.marca, v.modelo, v.color].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="text-xs text-[#6f7978]">
                      {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                      {residente ? ` · ${residente}` : ''}
                    </p>
                    {v.estado === 'rechazado' && v.comentarios_admin && (
                      <p className="text-xs text-[#ba1a1a] mt-0.5 italic">{v.comentarios_admin}</p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
