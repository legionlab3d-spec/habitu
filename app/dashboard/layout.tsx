import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import DashboardShell from './_components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)

  if (!perfil) redirect('/registro-completar')

  return <DashboardShell perfil={perfil}>{children}</DashboardShell>
}
