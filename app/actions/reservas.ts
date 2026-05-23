'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearReserva(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const zona_id       = (formData.get('zona_id')       as string).trim()
  const fecha         = (formData.get('fecha')          as string).trim()
  const hora_inicio   = (formData.get('hora_inicio')    as string).trim()
  const duracion_str  = (formData.get('duracion_horas') as string).trim()
  const observaciones = (formData.get('observaciones')  as string | null)?.trim() || null
  const precio_hora   = parseFloat((formData.get('precio_por_hora') as string) || '0')

  if (!zona_id)     return { error: 'Selecciona una zona' }
  if (!fecha)       return { error: 'Selecciona una fecha' }
  if (!hora_inicio) return { error: 'Selecciona un horario' }

  const duracion_horas = parseInt(duracion_str, 10) || 1

  const [h, m] = hora_inicio.split(':').map(Number)
  const totalMinutes = h * 60 + m + duracion_horas * 60
  const hora_fin = `${String(Math.floor(totalMinutes / 60) % 24).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`

  const valor_total = precio_hora * duracion_horas

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  // ── Bloqueo por mora ──────────────────────────────────────────
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
      .eq('conjunto_id', perfil.conjunto_id)
      .order('periodo', { ascending: false })
      .limit(1)
      .single()

    if (ec?.estado === 'mora') {
      return { error: 'Póngase al día con el pago de la administración para completar esta reserva.' }
    }
  }

  // ── Verificar disponibilidad ───────────────────────────────────
  const { data: conflictos } = await supabase
    .from('reservas')
    .select('id, estado, pago_expira_en')
    .eq('zona_id', zona_id)
    .eq('fecha', fecha)
    .in('estado', ['pendiente_pago', 'confirmada'])
    .lt('hora_inicio', hora_fin)
    .gt('hora_fin', hora_inicio)

  const ahora = new Date().toISOString()
  const bloqueantes = (conflictos ?? []).filter((c) => {
    if (c.estado === 'confirmada') return true
    return !c.pago_expira_en || c.pago_expira_en > ahora
  })

  if (bloqueantes.length > 0) {
    return { error: 'El horario seleccionado ya está ocupado. Elige otro horario.' }
  }

  // ── Crear reserva ─────────────────────────────────────────────
  const esGratis = valor_total === 0
  const pagoExpiraEn = esGratis ? null : new Date(Date.now() + 10 * 60 * 1000).toISOString()

  const { data: nuevaReserva, error } = await supabase
    .from('reservas')
    .insert({
      conjunto_id: perfil.conjunto_id,
      usuario_id: user.id,
      zona_id,
      fecha,
      hora_inicio,
      hora_fin,
      duracion_horas,
      valor_total,
      observaciones,
      estado: esGratis ? 'confirmada' : 'pendiente_pago',
      pago_expira_en: pagoExpiraEn,
    })
    .select('id')
    .single()

  if (error) return { error: 'Error al crear la reserva.' }

  revalidatePath('/dashboard/residente/reservas')
  revalidatePath('/dashboard/admin/reservas')

  if (esGratis) {
    redirect('/dashboard/residente/reservas')
  } else {
    redirect(`/dashboard/residente/reservas/pago/${nuevaReserva.id}`)
  }
}

export async function confirmarPago(
  id: string
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase
    .from('reservas')
    .update({ estado: 'confirmada', pago_expira_en: null })
    .eq('id', id)
    .eq('usuario_id', user.id)
    .eq('estado', 'pendiente_pago')

  if (error) return { error: 'Error al confirmar el pago.' }

  revalidatePath('/dashboard/residente/reservas')
  revalidatePath('/dashboard/admin/reservas')
  return { ok: true }
}

export async function expirarReserva(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('reservas')
    .update({ estado: 'expirada' })
    .eq('id', id)
    .eq('usuario_id', user.id)
    .eq('estado', 'pendiente_pago')

  revalidatePath('/dashboard/residente/reservas')
}

export async function cancelarReserva(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return

  const filter = supabase
    .from('reservas')
    .update({ estado: 'cancelada' })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  if (perfil.rol !== 'admin') {
    await filter.eq('usuario_id', user.id)
  } else {
    await filter
  }

  revalidatePath('/dashboard/residente/reservas')
  revalidatePath('/dashboard/admin/reservas')
}

export async function confirmarReserva(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('reservas')
    .update({ estado: 'confirmada' })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/reservas')
  revalidatePath('/dashboard/residente/reservas')
}
