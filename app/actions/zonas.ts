'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearZona(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const nombre             = (formData.get('nombre')       as string).trim()
  const descripcion        = (formData.get('descripcion')  as string).trim()
  const capacidad          = formData.get('capacidad')      as string
  const precio             = formData.get('precio')         as string
  const requiereAprobacion = formData.get('requiere_aprobacion') === 'on'

  if (!nombre) return { error: 'El nombre es obligatorio' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const { error } = await supabase.from('zonas_comunes').insert({
    conjunto_id:         perfil.conjunto_id,
    nombre,
    descripcion:         descripcion || null,
    capacidad:           capacidad ? parseInt(capacidad) : null,
    precio_por_hora:     precio ? parseFloat(precio) : 0,
    requiere_aprobacion: requiereAprobacion,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/zonas')
}

export async function toggleZonaActiva(id: string, activa: boolean) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('zonas_comunes')
    .update({ activa })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/zonas')
}

export async function eliminarZona(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('zonas_comunes')
    .delete()
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/zonas')
}
