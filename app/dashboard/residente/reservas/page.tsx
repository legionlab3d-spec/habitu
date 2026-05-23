import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getZonas } from '@/src/services/zonas'
import { getReservasResidente, type Reserva } from '@/src/services/reservas'
import { cancelarReserva } from '@/app/actions/reservas'
import ReservaForm from './_components/ReservaForm'

const ESTADO_STYLES: Record<Reserva['estado'], { bg: string; text: string; label: string }> = {
  pendiente_pago: { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Pendiente pago' },
  confirmada:     { bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]', label: 'Confirmada' },
  cancelada:      { bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]', label: 'Cancelada' },
}

function formatFecha(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  })
}

function formatHora(time: string) {
  return time.slice(0, 5)
}

function formatValor(valor: number) {
  return valor === 0 ? 'Gratis' : `$${valor.toLocaleString('es-CO')}`
}

export default async function ReservasResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const [zonas, reservas] = await Promise.all([
    getZonas(supabase, perfil.conjunto_id),
    getReservasResidente(supabase, perfil.conjunto_id, user.id),
  ])

  const zonasActivas = zonas.filter(z => z.activa)

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
          Reservas
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-3xl font-bold text-[#1b1c1c]">
          Zonas comunes
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          Solicita el uso de las zonas comunes del conjunto
        </p>
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
          <ReservaForm zonas={zonasActivas} />
        </div>
      )}

      <div className="mb-4">
        <h2 className="font-[family-name:var(--font-outfit)] text-base font-semibold text-[#1b1c1c]">
          Mis reservas
        </h2>
      </div>

      {reservas.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-8 text-center">
          <p className="text-[#3f4948] text-sm font-medium">Aún no tienes reservas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reservas.map((r) => {
            const estilo = ESTADO_STYLES[r.estado]
            return (
              <div
                key={r.id}
                className={`bg-white border border-[#bec9c8] rounded-2xl p-5 ${r.estado === 'cancelada' ? 'opacity-55' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c] mb-0.5">
                      {(r.zonas_comunes as { nombre: string } | undefined)?.nombre ?? 'Zona'}
                    </p>
                    <p className="text-xs text-[#3f4948] mb-0.5">
                      {formatFecha(r.fecha)} · {formatHora(r.hora_inicio)}–{formatHora(r.hora_fin)}
                      {' · '}{r.duracion_horas}h
                    </p>
                    <p className="text-xs text-[#6f7978]">{formatValor(r.valor_total)}</p>
                    {r.observaciones && (
                      <p className="text-xs text-[#3f4948] italic mt-1">{r.observaciones}</p>
                    )}
                  </div>

                  {r.estado === 'pendiente_pago' && (
                    <form action={async () => { 'use server'; await cancelarReserva(r.id) }}>
                      <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6]">
                        Cancelar
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
