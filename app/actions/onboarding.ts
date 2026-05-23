'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

export async function registrar(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const nombre         = (formData.get('nombre')          as string).trim()
  const email          = (formData.get('email')           as string).trim()
  const password       = (formData.get('password')        as string)
  const nombreConjunto = (formData.get('nombre_conjunto') as string).trim()

  if (!nombre || !email || !password || !nombreConjunto) {
    return { error: 'Todos los campos son obligatorios' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabase = await createClient()

  // 1. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'No se pudo crear el usuario. Verifica que el email no esté ya registrado.' }

  const userId = authData.user.id

  // 2. Generar UUID e insertar conjunto
  const conjuntoId  = crypto.randomUUID()
  const baseSlug    = toSlug(nombreConjunto)
  const slug        = `${baseSlug}-${conjuntoId.slice(0, 8)}`

  const { error: conjuntoError } = await supabase
    .from('conjuntos')
    .insert({
      id:     conjuntoId,
      nombre: nombreConjunto,
      slug,
    })

  if (conjuntoError) {
    return { error: `Error al crear el conjunto: ${conjuntoError.message}` }
  }

  // 3. Crear perfil admin
  const { error: usuarioError } = await supabase
    .from('usuarios')
    .insert({
      id:          userId,
      nombre,
      email,
      rol:         'admin',
      conjunto_id: conjuntoId,
    })

  if (usuarioError) {
    await supabase.from('conjuntos').delete().eq('id', conjuntoId)
    return { error: `Error al crear el perfil: ${usuarioError.message}` }
  }

  redirect('/dashboard/admin')
}

export async function completarPerfil(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const nombre     = (formData.get('nombre')      as string).trim()
  const conjuntoId = (formData.get('conjunto_id') as string).trim()

  if (!nombre || !conjuntoId) {
    return { error: 'Nombre y conjunto son obligatorios' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Sesión no encontrada' }

  const { error } = await supabase.from('usuarios').insert({
    id:          user.id,
    nombre,
    email:       user.email ?? '',
    rol:         'residente',
    conjunto_id: conjuntoId,
  })

  if (error) return { error: error.message }

  redirect('/dashboard/residente')
}
