import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getReservas, type Reserva } from '@/src/services/reservas'
import { confirmarReserva, cancelarReserva } from '@/app/actions/reservas'

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

function formatHora(time: string) {
  return time.slice(0, 5)
}

function formatValor(valor: number) {
  return valor === 0 ? 'Gratis' : `$${valor.toLocaleString('es-CO')}`
}

export default async function ReservasAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const reservas = await getReservas(supabase, perfil.conjunto_id)

  const pendientes  = reservas.filter(r => r.estado === 'pendiente_pago')
  const confirmadas = reservas.filter(r => r.estado === 'confirmada')
  const canceladas  = reservas.filter(r => r.estado === 'cancelada')

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
          Admin · Reservas
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Reservas
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {reservas.length} reserva{reservas.length !== 1 ? 's' : ''} en total · {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
        </p>
      </div>

      {reservas.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-10 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay reservas registradas.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {[...pendientes, ...confirmadas, ...canceladas].map((r) => {
            const estilo = ESTADO_STYLES[r.estado]
            return (
              <div
                key={r.id}
                className={`bg-white border border-[#bec9c8] rounded-2xl p-5 ${r.estado === 'cancelada' ? 'opacity-55' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
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
                    <p className="text-xs text-[#6f7978] mb-1">
                      {(r.usuarios as { nombre: string } | undefined)?.nombre ?? 'Residente'}
                      {' · '}{formatValor(r.valor_total)}
                    </p>
                    {r.observaciones && (
                      <p className="text-xs text-[#3f4948] italic">{r.observaciones}</p>
                    )}
                  </div>

                  {r.estado !== 'cancelada' && (
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      {r.estado === 'pendiente_pago' && (
                        <form action={async () => { 'use server'; await confirmarReserva(r.id) }}>
                          <button type="submit" className="text-xs text-[#2f9e44] hover:text-white hover:bg-[#2f9e44] transition-colors px-2 py-1 rounded-lg w-full text-left border border-[#2f9e44]">
                            Confirmar
                          </button>
                        </form>
                      )}
                      <form action={async () => { 'use server'; await cancelarReserva(r.id) }}>
                        <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6] w-full text-left">
                          Cancelar
                        </button>
                      </form>
                    </div>
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
