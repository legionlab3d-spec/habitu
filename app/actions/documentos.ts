'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function subirDocumento(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const nombre = formData.get('nombre') as string
  const descripcion = formData.get('descripcion') as string | null
  const categoria = formData.get('categoria') as string
  const publico = formData.get('publico') === 'on'
  const archivo = formData.get('archivo') as File | null

  if (!nombre?.trim() || !archivo || archivo.size === 0) {
    return { error: 'Nombre y archivo son requeridos.' }
  }

  if (archivo.size > 10 * 1024 * 1024) {
    return { error: 'El archivo no puede superar 10 MB.' }
  }

  const buffer = await archivo.arrayBuffer()
  const ext = archivo.name.split('.').pop()
  const path = `${perfil.conjunto_id}/${Date.now()}-${nombre.trim().replace(/\s+/g, '_')}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('documentos')
    .upload(path, buffer, { contentType: archivo.type, upsert: false })

  if (uploadError) return { error: 'Error subiendo archivo.' }

  const { error } = await supabase.from('documentos_conjunto').insert({
    conjunto_id: perfil.conjunto_id,
    subido_por: user.id,
    nombre: nombre.trim(),
    descripcion: descripcion?.trim() || null,
    categoria,
    url: path,
    publico,
  })

  if (error) return { error: 'Error guardando documento.' }

  revalidatePath('/dashboard/admin/documentos')
  revalidatePath('/dashboard/residente/documentos')
  return { ok: true }
}

export async function eliminarDocumento(id: string, url: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase.storage.from('documentos').remove([url])
  await supabase.from('documentos_conjunto').delete().eq('id', id).eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/documentos')
  revalidatePath('/dashboard/residente/documentos')
}
