'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export async function login(
  _state: { error: string } | undefined,
  formData: FormData
) {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email:    formData.get('email')    as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No se pudo obtener la sesión' }

  const perfil = await getUsuarioPerfil(supabase, user.id)

  if (!perfil) redirect('/registro-completar')

  if (perfil.rol === 'admin')     redirect('/dashboard/admin')
  if (perfil.rol === 'residente') redirect('/dashboard/residente')

  redirect('/dashboard')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
