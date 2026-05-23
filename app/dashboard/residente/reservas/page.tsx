import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getZonas } from '@/src/services/zonas'
import { getReservasResidente, getReservasActivas, type Reserva } from '@/src/services/reservas'
import { cancelarReserva } from '@/app/actions/reservas'
import CalendarioReserva from './_components/CalendarioReserva'

const ESTADO_STYLES: Record<Reserva['estado'], { bg: string; text: string; label: string }> = {
  pendiente_pago: { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Pendiente pago' },
  confirmada:     { bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', label: 'Confirmada' },
  cancelada:      { bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]', label: 'Cancelada' },
  expirada:       { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'Expirada' },
}

function formatFecha(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function ReservasResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const [zonas, reservasResidente, reservasActivas] = await Promise.all([
    getZonas(supabase, perfil.conjunto_id),
    getReservasResidente(supabase, perfil.conjunto_id, user.id),
    getReservasActivas(supabase, perfil.conjunto_id),
  ])

  const zonasActivas = zonas.filter((z) => z.activa)

  // Verificar mora
  let tieneMora = false
  const { data: apto } = await supabase
    .from('apartamentos')
    .select('id')
    .eq('conjunto_id', perfil.conjunto_id)
    .or(`residente_id.eq.${user.id},propietario_id.eq.${user.id}`)
    .single()

  if (apto) {
    const { data: ec } = await supabase
      .from('estados_cuenta')
      .select('estado')
      .eq('apartamento_id', apto.id)
      .order('periodo', { ascending: false })
      .limit(1)
      .single()
    tieneMora = ec?.estado === 'mora'
  }

  const ahora = new Date().toISOString()

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Conjunto</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Zonas comunes
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">Reserva el espacio que necesitas</p>
      </div>

      {zonasActivas.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center mb-6">
          <p className="text-[#3f4948] text-sm font-medium">No hay zonas disponibles para reservar.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
          <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
            Nueva reserva
          </h2>
          <CalendarioReserva
            zonas={zonasActivas}
            reservasActivas={reservasActivas}
            tieneMora={tieneMora}
          />
        </div>
      )}

      <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c] mb-4">
        Mis reservas
      </h2>

      {reservasResidente.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">Aún no tienes reservas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservasResidente.map((r) => {
            const estilo = ESTADO_STYLES[r.estado] ?? ESTADO_STYLES.cancelada
            const expirado = r.estado === 'pendiente_pago' && r.pago_expira_en && r.pago_expira_en < ahora
            const estadoEfectivo = expirado ? 'expirada' : r.estado
            const estiloEfectivo = ESTADO_STYLES[estadoEfectivo] ?? estilo
            const puedeCompletar = r.estado === 'pendiente_pago' && !expirado && r.pago_expira_en

            return (
              <div
                key={r.id}
                className={`bg-white border border-[#bec9c8] rounded-2xl p-4 ${estadoEfectivo === 'cancelada' || estadoEfectivo === 'expirada' ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estiloEfectivo.bg} ${estiloEfectivo.text}`}>
                        {estiloEfectivo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c] mb-0.5">
                      {(r.zonas_comunes as { nombre: string } | undefined)?.nombre ?? 'Zona'}
                    </p>
                    <p className="text-xs text-[#3f4948]">
                      {formatFecha(r.fecha)} · {r.hora_inicio.slice(0,5)}–{r.hora_fin.slice(0,5)} · {r.duracion_horas}h
                    </p>
                    <p className="text-xs text-[#6f7978] mt-0.5">
                      {r.valor_total === 0 ? 'Gratis' : `$${r.valor_total.toLocaleString('es-CO')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {puedeCompletar && (
                      <Link
                        href={`/dashboard/residente/reservas/pago/${r.id}`}
                        className="text-xs font-semibold text-[#e67700] bg-[#fff9db] px-3 py-1.5 rounded-lg hover:bg-[#f59f00]/20 transition-colors"
                      >
                        Completar pago
                      </Link>
                    )}
                    {r.estado === 'pendiente_pago' && !expirado && (
                      <form action={async () => { 'use server'; await cancelarReserva(r.id) }}>
                        <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6]">
                          Cancelar
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
