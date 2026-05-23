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

export async function generarEstructura(
  _state: unknown,
  formData: FormData
): Promise<{ ok?: boolean; error?: string; creados?: number; omitidos?: number }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') return { error: 'Sin permisos' }

  const torresRaw  = (formData.get('torres') as string).trim()
  const pisos      = parseInt(formData.get('pisos') as string, 10)
  const porPiso    = parseInt(formData.get('por_piso') as string, 10)
  const formato    = formData.get('formato') as string // 'piso100' | 'continuo'
  const tipoUnidad = (formData.get('tipo_unidad') as string) || 'apartamento'

  if (!pisos || pisos < 1 || pisos > 100) return { error: 'Pisos debe estar entre 1 y 100.' }
  if (!porPiso || porPiso < 1 || porPiso > 50) return { error: 'Apartamentos por piso debe estar entre 1 y 50.' }
  if (pisos * porPiso * Math.max(1, torresRaw ? torresRaw.split('\n').filter(Boolean).length : 1) > 1000) {
    return { error: 'Máximo 1000 apartamentos por generación.' }
  }

  const torres: (string | null)[] = torresRaw
    ? torresRaw.split('\n').map((t) => t.trim()).filter(Boolean)
    : [null]

  // Fetch existing apartments to check duplicates
  const { data: existentes } = await supabase
    .from('apartamentos')
    .select('numero, torre')
    .eq('conjunto_id', perfil.conjunto_id)

  const existeSet = new Set(
    (existentes ?? []).map((a) => `${a.torre ?? ''}|${a.numero}`)
  )

  const nuevos: { conjunto_id: string; torre: string | null; numero: string; tipo_unidad: string }[] = []

  for (const torre of torres) {
    for (let piso = 1; piso <= pisos; piso++) {
      for (let num = 1; num <= porPiso; num++) {
        const numero = formato === 'continuo'
          ? String((piso - 1) * porPiso + num)
          : String(piso * 100 + num)

        const key = `${torre ?? ''}|${numero}`
        if (!existeSet.has(key)) {
          nuevos.push({ conjunto_id: perfil.conjunto_id, torre, numero, tipo_unidad: tipoUnidad })
        }
      }
    }
  }

  const omitidos = pisos * porPiso * torres.length - nuevos.length

  if (nuevos.length > 0) {
    const { error } = await supabase.from('apartamentos').insert(nuevos)
    if (error) return { error: 'Error generando apartamentos.' }
  }

  revalidatePath('/dashboard/admin/apartamentos')
  return { ok: true, creados: nuevos.length, omitidos }
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
