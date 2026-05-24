'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearLlamado(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const apartamento_id = formData.get('apartamento_id') as string
  const tipo = formData.get('tipo') as string
  const descripcion = formData.get('descripcion') as string

  if (!apartamento_id || !tipo || !descripcion?.trim()) {
    return { error: 'Completa todos los campos requeridos.' }
  }

  let evidencia_url: string | null = null
  const evidencia = formData.get('evidencia') as File | null
  if (evidencia && evidencia.size > 0) {
    const buffer = await evidencia.arrayBuffer()
    const ext = evidencia.name.split('.').pop()
    const path = `${perfil.conjunto_id}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('evidencias')
      .upload(path, buffer, { contentType: evidencia.type, upsert: false })
    if (!uploadError) evidencia_url = path
  }

  const { error } = await supabase.from('llamados_atencion').insert({
    conjunto_id: perfil.conjunto_id,
    apartamento_id,
    creado_por: user.id,
    tipo,
    descripcion: descripcion.trim(),
    evidencia_url,
    estado: 'activo',
  })

  if (error) return { error: 'Error creando llamado de atención.' }

  revalidatePath('/dashboard/admin/llamados')
  return { ok: true }
}

export async function actualizarEstadoLlamado(
  id: string,
  estado: string
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  const now = new Date().toISOString()
  const update: Record<string, unknown> = { estado }
  if (estado === 'en_proceso') update.fecha_en_proceso = now
  if (estado === 'resuelto') update.fecha_resolucion = now

  await supabase
    .from('llamados_atencion')
    .update(update)
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/llamados')
  revalidatePath('/dashboard/residente/llamados')
}
