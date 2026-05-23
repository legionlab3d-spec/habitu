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

  redirect('/dashboard/admin/apartamentos')
}

export async function registrarResidente(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const nombre       = (formData.get('nombre')       as string).trim()
  const email        = (formData.get('email')         as string).trim()
  const password     = (formData.get('password')      as string)
  const conjuntoId   = (formData.get('conjunto_id')   as string).trim()
  const numero       = (formData.get('numero')         as string).trim()
  const torre        = (formData.get('torre')          as string).trim() || null
  const tipoCuenta   = (formData.get('tipo_cuenta')   as string) || 'propietario'

  const esPropietario = tipoCuenta === 'propietario'

  if (!nombre || !email || !password || !conjuntoId || !numero) {
    return { error: 'Todos los campos obligatorios deben completarse' }
  }
  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres' }
  }

  const supabase = await createClient()

  // 1. Verificar que el conjunto existe
  const { data: conjunto } = await supabase
    .from('conjuntos')
    .select('id')
    .eq('id', conjuntoId)
    .single()

  if (!conjunto) return { error: 'Conjunto no encontrado. Verifica el ID con tu administrador.' }

  // 2. Buscar el apartamento
  let aptQuery = supabase
    .from('apartamentos')
    .select('id, propietario_id, residente_id')
    .eq('conjunto_id', conjuntoId)
    .eq('numero', numero)

  if (torre) {
    aptQuery = aptQuery.eq('torre', torre)
  } else {
    aptQuery = aptQuery.is('torre', null)
  }

  const { data: apartamentos } = await aptQuery

  if (!apartamentos || apartamentos.length === 0) {
    return { error: torre
      ? `Apartamento ${numero} Torre ${torre} no encontrado en este conjunto.`
      : `Apartamento ${numero} no encontrado en este conjunto.`
    }
  }

  const apartamento = apartamentos[0]

  if (esPropietario && apartamento.propietario_id) {
    return { error: 'Este apartamento ya tiene un propietario registrado. Contacta al administrador.' }
  }
  if (!esPropietario && apartamento.residente_id) {
    return { error: 'Este apartamento ya tiene un arrendatario registrado. Contacta al administrador.' }
  }

  // 3. Crear usuario en Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre } },
  })

  if (authError) return { error: authError.message }
  if (!authData.user) return { error: 'No se pudo crear el usuario. El email puede estar en uso.' }

  const userId = authData.user.id

  // 4. Crear perfil
  const { error: usuarioError } = await supabase.from('usuarios').insert({
    id:          userId,
    nombre,
    email,
    rol:         esPropietario ? 'propietario' : 'residente',
    conjunto_id: conjuntoId,
  })

  if (usuarioError) return { error: `Error al crear el perfil: ${usuarioError.message}` }

  // 5. Vincular al apartamento en el campo correspondiente
  await supabase
    .from('apartamentos')
    .update(esPropietario ? { propietario_id: userId } : { residente_id: userId })
    .eq('id', apartamento.id)

  redirect('/dashboard/residente')
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
