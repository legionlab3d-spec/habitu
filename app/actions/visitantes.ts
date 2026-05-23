'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function registrarVisitante(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  const apartamento_id = formData.get('apartamento_id') as string
  const nombre = formData.get('nombre') as string
  const documento = formData.get('documento') as string | null
  const tipo_visita = formData.get('tipo_visita') as string
  const placa_vehiculo = formData.get('placa_vehiculo') as string | null
  const observaciones = formData.get('observaciones') as string | null
  const fecha_expiracion_raw = formData.get('fecha_expiracion') as string | null

  if (!apartamento_id || !nombre?.trim()) {
    return { error: 'Nombre y apartamento son requeridos.' }
  }

  const fecha_expiracion = fecha_expiracion_raw
    ? new Date(fecha_expiracion_raw + 'T23:59:59').toISOString()
    : null

  const { error } = await supabase.from('visitantes').insert({
    conjunto_id: perfil.conjunto_id,
    apartamento_id,
    autorizado_por: user.id,
    nombre: nombre.trim(),
    documento: documento?.trim() || null,
    tipo_visita,
    placa_vehiculo: placa_vehiculo?.trim() || null,
    observaciones: observaciones?.trim() || null,
    fecha_expiracion,
    activo: true,
  })

  if (error) return { error: 'Error registrando visitante.' }

  revalidatePath('/dashboard/admin/visitantes')
  revalidatePath('/dashboard/residente/visitantes')
  return { ok: true }
}

export async function marcarIngreso(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('visitantes')
    .update({ fecha_ingreso: new Date().toISOString() })
    .eq('id', id)
  revalidatePath('/dashboard/admin/visitantes')
}

export async function marcarSalida(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase
    .from('visitantes')
    .update({ fecha_salida: new Date().toISOString(), activo: false })
    .eq('id', id)
  revalidatePath('/dashboard/admin/visitantes')
}
