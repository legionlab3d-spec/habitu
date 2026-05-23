'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function registrarMascota(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  const nombre = formData.get('nombre') as string
  const tipo = formData.get('tipo') as string
  const raza = formData.get('raza') as string | null
  const color = formData.get('color') as string | null
  const vacunas_al_dia = formData.get('vacunas_al_dia') === 'on'
  const soporte_emocional = formData.get('soporte_emocional') === 'on'
  const apartamento_id = formData.get('apartamento_id') as string

  if (!nombre?.trim() || !apartamento_id) {
    return { error: 'Nombre y apartamento son requeridos.' }
  }

  const { error } = await supabase.from('mascotas').insert({
    conjunto_id: perfil.conjunto_id,
    apartamento_id,
    usuario_id: user.id,
    nombre: nombre.trim(),
    tipo,
    raza: raza?.trim() || null,
    color: color?.trim() || null,
    vacunas_al_dia,
    soporte_emocional,
    activo: true,
  })

  if (error) return { error: 'Error registrando mascota.' }

  revalidatePath('/dashboard/residente/mascotas')
  revalidatePath('/dashboard/admin/mascotas')
  return { ok: true }
}

export async function desactivarMascota(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('mascotas').update({ activo: false }).eq('id', id)
  revalidatePath('/dashboard/residente/mascotas')
  revalidatePath('/dashboard/admin/mascotas')
}
