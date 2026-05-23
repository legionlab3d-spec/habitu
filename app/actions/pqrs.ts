'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearPqrs(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  const tipo = formData.get('tipo') as string
  const categoria = formData.get('categoria') as string
  const asunto = formData.get('asunto') as string
  const descripcion = formData.get('descripcion') as string
  const apartamento_id = formData.get('apartamento_id') as string | null

  if (!tipo || !categoria || !asunto?.trim() || !descripcion?.trim()) {
    return { error: 'Completa todos los campos requeridos.' }
  }

  let adjunto_url: string | null = null
  const adjunto = formData.get('adjunto') as File | null
  if (adjunto && adjunto.size > 0) {
    const buffer = await adjunto.arrayBuffer()
    const ext = adjunto.name.split('.').pop()
    const path = `${perfil.conjunto_id}/${user.id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(path, buffer, { contentType: adjunto.type, upsert: false })
    if (uploadError) return { error: 'Error subiendo adjunto.' }
    adjunto_url = path
  }

  const { error } = await supabase.from('pqrs').insert({
    conjunto_id: perfil.conjunto_id,
    usuario_id: user.id,
    apartamento_id: apartamento_id || null,
    tipo,
    categoria,
    asunto: asunto.trim(),
    descripcion: descripcion.trim(),
    adjunto_url,
    estado: 'recibido',
  })

  if (error) return { error: 'Error creando PQRS.' }

  revalidatePath('/dashboard/residente/pqrs')
  return { ok: true }
}

export async function responderPqrs(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const id = formData.get('pqrs_id') as string
  const respuesta = formData.get('respuesta') as string
  const estado = formData.get('estado') as string

  if (!id || !respuesta?.trim()) return { error: 'La respuesta es requerida.' }

  const { error } = await supabase
    .from('pqrs')
    .update({
      respuesta: respuesta.trim(),
      estado,
      fecha_respuesta: new Date().toISOString(),
      asignado_a: user.id,
    })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  if (error) return { error: 'Error guardando respuesta.' }

  revalidatePath('/dashboard/admin/pqrs')
  return { ok: true }
}

export async function actualizarEstadoPqrs(
  id: string,
  estado: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('pqrs')
    .update({ estado })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/pqrs')
}
