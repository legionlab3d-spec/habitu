'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function crearParqueadero(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const numero = (formData.get('numero') as string)?.trim()
  const tipo   = formData.get('tipo') as string
  const cubierto = formData.get('cubierto') === 'on'
  const observaciones = (formData.get('observaciones') as string)?.trim() || null

  if (!numero) return { error: 'El número es requerido.' }

  const { error } = await supabase.from('parqueaderos').insert({
    conjunto_id: perfil.conjunto_id,
    numero,
    tipo,
    cubierto,
    observaciones,
    activo: true,
  })

  if (error?.code === '23505') return { error: `El parqueadero ${numero} ya existe.` }
  if (error) return { error: 'Error creando parqueadero.' }

  revalidatePath('/dashboard/admin/parqueaderos')
  return { ok: true }
}

export async function asignarParqueadero(
  parqueaderoId: string,
  apartamentoId: string | null
): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  // If assigning to an apartment, get the resident
  let usuarioId: string | null = null
  if (apartamentoId) {
    const { data: apto } = await supabase
      .from('apartamentos')
      .select('residente_id')
      .eq('id', apartamentoId)
      .single()
    usuarioId = apto?.residente_id ?? null
  }

  await supabase
    .from('parqueaderos')
    .update({ apartamento_id: apartamentoId, usuario_id: usuarioId })
    .eq('id', parqueaderoId)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/parqueaderos')
}

export async function eliminarParqueadero(id: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return

  await supabase
    .from('parqueaderos')
    .update({ activo: false })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  revalidatePath('/dashboard/admin/parqueaderos')
}
