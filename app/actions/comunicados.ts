'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearComunicado(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const titulo      = (formData.get('titulo')      as string).trim()
  const contenido   = (formData.get('contenido')   as string).trim()
  const tipo        = (formData.get('tipo')         as string) || 'informativo'
  const destinatario = (formData.get('destinatario') as string) || 'todos'

  if (!titulo)    return { error: 'El título es obligatorio' }
  if (!contenido) return { error: 'El contenido es obligatorio' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const { error } = await supabase.from('anuncios').insert({
    conjunto_id:  perfil.conjunto_id,
    creado_por:   user.id,
    titulo,
    contenido,
    tipo,
    destinatario,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/comunicados')
  revalidatePath('/dashboard/residente/comunicados')
}

export async function toggleComunicado(id: string, activo: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('anuncios')
    .update({ activo })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/comunicados')
  revalidatePath('/dashboard/residente/comunicados')
}

export async function eliminarComunicado(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('anuncios')
    .delete()
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/comunicados')
  revalidatePath('/dashboard/residente/comunicados')
}
