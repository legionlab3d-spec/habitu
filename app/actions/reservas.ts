'use server'

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
  if (!fecha)       return { error: 'La fecha es obligatoria' }
  if (!hora_inicio) return { error: 'La hora de inicio es obligatoria' }

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

  const { error } = await supabase.from('reservas').insert({
    conjunto_id: perfil.conjunto_id,
    usuario_id: user.id,
    zona_id,
    fecha,
    hora_inicio,
    hora_fin,
    duracion_horas,
    valor_total,
    observaciones,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/residente/reservas')
  revalidatePath('/dashboard/admin/reservas')
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
