import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)

  if (!perfil)                    redirect('/registro-completar')
  if (perfil.rol === 'admin')     redirect('/dashboard/admin')
  if (perfil.rol === 'residente') redirect('/dashboard/residente')

  redirect('/login')
}
