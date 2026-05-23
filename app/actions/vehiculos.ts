'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

export async function registrarVehiculo(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; vehiculoId?: string; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  const placa = (formData.get('placa') as string)?.trim().toUpperCase()
  const tipo = formData.get('tipo') as string
  const marca = formData.get('marca') as string | null
  const modelo = formData.get('modelo') as string | null
  const color = formData.get('color') as string | null
  const apartamento_id = formData.get('apartamento_id') as string | null

  if (!placa) return { error: 'La placa es requerida.' }

  const { data: vehiculo, error } = await supabase.from('vehiculos').insert({
    conjunto_id: perfil.conjunto_id,
    usuario_id: user.id,
    apartamento_id: apartamento_id || null,
    placa,
    tipo,
    marca: marca?.trim() || null,
    modelo: modelo?.trim() || null,
    color: color?.trim() || null,
    activo: true,
    estado: 'pendiente_aprobacion',
  }).select('id').single()

  if (error?.code === '23505') return { error: `La placa ${placa} ya está registrada en este conjunto.` }
  if (error || !vehiculo) return { error: 'Error registrando vehículo.' }

  // Subir documentos opcionales
  const tiposDoc = ['soat', 'tarjeta_propiedad'] as const
  for (const tipoDoc of tiposDoc) {
    const archivo = formData.get(`doc_${tipoDoc}`) as File | null
    if (!archivo || archivo.size === 0) continue
    if (archivo.size > MAX_SIZE || !ALLOWED.includes(archivo.type)) continue

    const ext = archivo.name.split('.').pop()
    const path = `${perfil.conjunto_id}/${vehiculo.id}/${tipoDoc}_${Date.now()}.${ext}`
    const buffer = await archivo.arrayBuffer()
    const { error: upErr } = await supabase.storage
      .from('documentos')
      .upload(path, buffer, { contentType: archivo.type, upsert: false })

    if (!upErr) {
      await supabase.from('vehiculo_documentos').insert({
        vehiculo_id: vehiculo.id,
        conjunto_id: perfil.conjunto_id,
        tipo_documento: tipoDoc,
        archivo_url: path,
        nombre_archivo: archivo.name,
      })
    }
  }

  revalidatePath('/dashboard/residente/vehiculos')
  revalidatePath('/dashboard/admin/vehiculos')
  return { ok: true, vehiculoId: vehiculo.id }
}

export async function aprobarVehiculo(
  id: string
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const { error } = await supabase.from('vehiculos').update({
    estado: 'aprobado',
    aprobado_por: user.id,
    aprobado_at: new Date().toISOString(),
    comentarios_admin: null,
  }).eq('id', id)

  if (error) return { error: 'Error aprobando vehículo.' }

  revalidatePath('/dashboard/admin/vehiculos')
  revalidatePath('/dashboard/residente/vehiculos')
  return { ok: true }
}

export async function rechazarVehiculo(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const id = formData.get('vehiculo_id') as string
  const comentarios = (formData.get('comentarios') as string)?.trim()

  if (!id) return { error: 'ID de vehículo requerido.' }

  const { error } = await supabase.from('vehiculos').update({
    estado: 'rechazado',
    aprobado_por: user.id,
    aprobado_at: new Date().toISOString(),
    comentarios_admin: comentarios || null,
  }).eq('id', id)

  if (error) return { error: 'Error rechazando vehículo.' }

  revalidatePath('/dashboard/admin/vehiculos')
  revalidatePath('/dashboard/residente/vehiculos')
  return { ok: true }
}

export async function desactivarVehiculo(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('vehiculos').update({ activo: false }).eq('id', id)
  revalidatePath('/dashboard/residente/vehiculos')
  revalidatePath('/dashboard/admin/vehiculos')
}
