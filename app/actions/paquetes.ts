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

  if (!apartamento_id) return { error: 'Selecciona un apartamento.' }

  // Find the resident of the apartment
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
    descripcion: descripcion?.trim() || null,
    empresa_envio: empresa_envio?.trim() || null,
    numero_guia: numero_guia?.trim() || null,
    estado: 'en_porteria',
  })

  if (error) return { error: 'Error registrando paquete.' }

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
