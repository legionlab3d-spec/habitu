'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function registrarVehiculo(
  _prev: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) return { error: 'Perfil no encontrado' }

  const placa = (formData.get('placa') as string)?.trim().toUpperCase()
  const tipo = formData.get('tipo') as string
  const marca = formData.get('marca') as string | null
  const modelo = formData.get('modelo') as string | null
  const color = formData.get('color') as string | null
  const apartamento_id = formData.get('apartamento_id') as string | null

  if (!placa) return { error: 'La placa es requerida.' }

  const { error } = await supabase.from('vehiculos').insert({
    conjunto_id: perfil.conjunto_id,
    usuario_id: user.id,
    apartamento_id: apartamento_id || null,
    placa,
    tipo,
    marca: marca?.trim() || null,
    modelo: modelo?.trim() || null,
    color: color?.trim() || null,
    activo: true,
  })

  if (error?.code === '23505') return { error: `La placa ${placa} ya está registrada en este conjunto.` }
  if (error) return { error: 'Error registrando vehículo.' }

  revalidatePath('/dashboard/residente/vehiculos')
  revalidatePath('/dashboard/admin/vehiculos')
  return { ok: true }
}

export async function desactivarVehiculo(id: string): Promise<void> {
  const supabase = await createClient()
  await supabase.from('vehiculos').update({ activo: false }).eq('id', id)
  revalidatePath('/dashboard/residente/vehiculos')
  revalidatePath('/dashboard/admin/vehiculos')
}
