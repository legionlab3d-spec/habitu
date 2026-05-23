import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getReserva } from '@/src/services/reservas'
import PagoClient from './_components/PagoClient'

interface Props {
  params: Promise<{ id: string }>
}

export default async function PagoPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const reserva = await getReserva(supabase, id, user.id)

  if (!reserva || reserva.estado !== 'pendiente_pago' || !reserva.pago_expira_en) {
    redirect('/dashboard/residente/reservas')
  }

  // Si ya expiró en el servidor, redirigir
  if (new Date(reserva.pago_expira_en) < new Date()) {
    redirect('/dashboard/residente/reservas')
  }

  const zona = (reserva.zonas_comunes as { nombre: string } | undefined)?.nombre ?? 'Zona'

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-md">
      <div className="mb-6">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Reservas</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Completar pago
        </h1>
      </div>

      <PagoClient
        reservaId={id}
        zona={zona}
        fecha={reserva.fecha}
        horaInicio={reserva.hora_inicio}
        horaFin={reserva.hora_fin}
        valorTotal={reserva.valor_total}
        expiresAt={reserva.pago_expira_en}
      />
    </div>
  )
}
