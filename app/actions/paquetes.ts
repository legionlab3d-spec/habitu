'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function registrarPaquete(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const apartamento_id = formData.get('apartamento_id') as string
  const descripcion = formData.get('descripcion') as string | null
  const empresa_envio = formData.get('empresa_envio') as string | null
  const numero_guia = formData.get('numero_guia') as string | null
  const recibido_por_nombre = formData.get('recibido_por_nombre') as string | null

  if (!apartamento_id) return { error: 'Selecciona un apartamento.' }

  const { data: apto } = await supabase
    .from('apartamentos')
    .select('residente_id')
    .eq('id', apartamento_id)
    .single()

  const { error } = await supabase.from('paquetes').insert({
    conjunto_id: perfil.conjunto_id,
    apartamento_id,
    usuario_id: apto?.residente_id ?? null,
    registrado_por: user.id,
    recibido_por_nombre: recibido_por_nombre?.trim() || null,
    descripcion: descripcion?.trim() || null,
    empresa_envio: empresa_envio?.trim() || null,
    numero_guia: numero_guia?.trim() || null,
    estado: 'en_porteria',
    fecha_recepcion: new Date().toISOString(),
  })

  if (error) return { error: 'Error registrando paquete.' }

  revalidatePath('/dashboard/admin/paquetes')
  revalidatePath('/dashboard/residente/paquetes')
  return { ok: true }
}

export async function procesarEntregaPaquete(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permiso' }

  const id = formData.get('paquete_id') as string
  const entregado_a = formData.get('entregado_a') as string | null
  const entregado_por = formData.get('entregado_por') as string | null

  if (!id) return { error: 'ID de paquete requerido.' }

  const { error } = await supabase
    .from('paquetes')
    .update({
      estado: 'entregado',
      fecha_entrega: new Date().toISOString(),
      entregado_a: entregado_a?.trim() || null,
      entregado_por: entregado_por?.trim() || null,
      recibido_por: user.id,
    })
    .eq('id', id)
    .eq('conjunto_id', perfil.conjunto_id)

  if (error) return { error: 'Error procesando entrega.' }

  revalidatePath('/dashboard/admin/paquetes')
  revalidatePath('/dashboard/residente/paquetes')
  return { ok: true }
}

export async function entregarPaquete(id: string, recibidoPor: string): Promise<void> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('paquetes')
    .update({
      estado: 'entregado',
      fecha_entrega: new Date().toISOString(),
      recibido_por: recibidoPor || user.id,
    })
    .eq('id', id)

  revalidatePath('/dashboard/admin/paquetes')
  revalidatePath('/dashboard/residente/paquetes')
}
