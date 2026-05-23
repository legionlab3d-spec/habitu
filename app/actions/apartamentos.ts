'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearApartamento(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const numero = (formData.get('numero') as string).trim()
  const torre  = (formData.get('torre')  as string).trim()

  if (!numero) return { error: 'El número de apartamento es obligatorio' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  // Verificar que no exista ya ese número en la misma torre
  const { data: existing } = await supabase
    .from('apartamentos')
    .select('id')
    .eq('conjunto_id', perfil.conjunto_id)
    .eq('numero', numero)
    .eq('torre', torre || '')
    .maybeSingle()

  if (existing) return { error: `El apartamento ${torre ? `${torre}-` : ''}${numero} ya existe` }

  const { error } = await supabase.from('apartamentos').insert({
    conjunto_id: perfil.conjunto_id,
    numero,
    torre: torre || null,
  })

  if (error) return { error: error.message }

  revalidatePath('/dashboard/admin/apartamentos')
}

export async function eliminarApartamento(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('apartamentos')
    .delete()
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/apartamentos')
}
