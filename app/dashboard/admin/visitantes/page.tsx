import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getApartamentos } from '@/src/services/apartamentos'
import { getVisitantes, TIPO_VISITA } from '@/src/services/visitantes'
import { marcarIngreso, marcarSalida } from '@/app/actions/visitantes'
import VisitanteForm from './_components/VisitanteForm'

export default async function VisitantesAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ ver?: string }>
}) {
  const params = await searchParams
  const soloActivos = params.ver !== 'todos'

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const [lista, apartamentos] = await Promise.all([
    getVisitantes(supabase, perfil.conjunto_id, soloActivos),
    getApartamentos(supabase, perfil.conjunto_id),
  ])

  const enEdificio = lista.filter((v) => v.fecha_ingreso && !v.fecha_salida).length

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Admin · Portería</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Visitantes
        </h1>
        {enEdificio > 0 && (
          <p className="text-sm text-[#1971c2] mt-1 font-medium">
            {enEdificio} visitante{enEdificio > 1 ? 's' : ''} actualmente en el edificio
          </p>
        )}
      </div>

      {/* Registrar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Registrar visitante
        </h2>
        <VisitanteForm apartamentos={apartamentos.map((a) => ({ id: a.id, numero: a.numero, torre: a.torre }))} />
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4">
        <a
          href="?"
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            soloActivos ? 'bg-[#004746] text-white' : 'bg-white border border-[#bec9c8] text-[#3f4948] hover:bg-[#f5f3f3]'
          }`}
        >
          Activos
        </a>
        <a
          href="?ver=todos"
          className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
            !soloActivos ? 'bg-[#004746] text-white' : 'bg-white border border-[#bec9c8] text-[#3f4948] hover:bg-[#f5f3f3]'
          }`}
        >
          Todos
        </a>
      </div>

      {/* Lista */}
      {lista.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay visitantes registrados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {lista.map((v) => {
            const apto = v.apartamentos as { numero: string; torre: string | null } | undefined
            const dentroEdificio = v.fecha_ingreso && !v.fecha_salida
            return (
              <div key={v.id} className={`bg-white border rounded-2xl p-4 ${dentroEdificio ? 'border-[#1971c2]/40' : 'border-[#bec9c8]'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      {dentroEdificio && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#d0ebff] text-[#1971c2]">
                          En edificio
                        </span>
                      )}
                      {v.fecha_salida && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#f5f3f3] text-[#6f7978]">
                          Salió
                        </span>
                      )}
                      {!v.fecha_ingreso && v.activo && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#fff9db] text-[#e67700]">
                          Esperando
                        </span>
                      )}
                      <span className="text-[10px] text-[#6f7978]">{TIPO_VISITA[v.tipo_visita]}</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c]">{v.nombre}</p>
                    <p className="text-xs text-[#6f7978]">
                      {apto ? `Apto ${apto.numero}${apto.torre ? ` · Torre ${apto.torre}` : ''}` : '—'}
                      {v.documento ? ` · Doc: ${v.documento}` : ''}
                      {v.placa_vehiculo ? ` · Placa: ${v.placa_vehiculo}` : ''}
                    </p>
                    {v.codigo_acceso && (
                      <p className="text-xs font-mono font-bold text-[#004746] mt-0.5">
                        Código: {v.codigo_acceso}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {v.activo && !v.fecha_ingreso && (
                      <form action={async () => { 'use server'; await marcarIngreso(v.id) }}>
                        <button type="submit" className="text-xs text-[#1971c2] border border-[#1971c2] hover:bg-[#d0ebff] transition-colors px-3 py-1.5 rounded-lg">
                          Ingreso
                        </button>
                      </form>
                    )}
                    {v.fecha_ingreso && !v.fecha_salida && (
                      <form action={async () => { 'use server'; await marcarSalida(v.id) }}>
                        <button type="submit" className="text-xs text-[#6f7978] border border-[#6f7978] hover:bg-[#f5f3f3] transition-colors px-3 py-1.5 rounded-lg">
                          Salida
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
