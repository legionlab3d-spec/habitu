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
  const tipo_vehiculo_visitante = formData.get('tipo_vehiculo_visitante') as string | null
  const color_vehiculo_visitante = formData.get('color_vehiculo_visitante') as string | null
  const parqueadero_tipo = (formData.get('parqueadero_tipo') as string) || 'ninguno'
  const observaciones = formData.get('observaciones') as string | null
  const fecha_expiracion_raw = formData.get('fecha_expiracion') as string | null

  if (!apartamento_id || !nombre?.trim()) {
    return { error: 'Nombre y apartamento son requeridos.' }
  }

  // Si el visitante usa vehículo, la placa es obligatoria
  if (tipo_visita === 'vehiculo' && !placa_vehiculo?.trim()) {
    return { error: 'La placa del vehículo es requerida.' }
  }

  // Si elige parqueadero propio, verificar que el residente tenga uno asignado
  if (parqueadero_tipo === 'propio') {
    const { data: apto } = await supabase
      .from('apartamentos')
      .select('id')
      .eq('conjunto_id', perfil.conjunto_id)
      .or(`residente_id.eq.${user.id},propietario_id.eq.${user.id}`)
      .single()

    if (apto) {
      const { data: parq } = await supabase
        .from('parqueaderos')
        .select('id')
        .eq('conjunto_id', perfil.conjunto_id)
        .eq('apartamento_id', apto.id)
        .eq('activo', true)
        .limit(1)
        .single()

      if (!parq) return { error: 'No tienes parqueadero asignado para ceder al visitante.' }
    } else {
      return { error: 'No tienes apartamento registrado.' }
    }
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
    placa_vehiculo: tipo_visita === 'vehiculo' ? (placa_vehiculo?.trim().toUpperCase() || null) : null,
    tipo_vehiculo_visitante: tipo_visita === 'vehiculo' ? (tipo_vehiculo_visitante || null) : null,
    color_vehiculo_visitante: tipo_visita === 'vehiculo' ? (color_vehiculo_visitante?.trim() || null) : null,
    parqueadero_tipo: tipo_visita === 'vehiculo' ? parqueadero_tipo : 'ninguno',
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
