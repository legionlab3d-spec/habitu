import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import Sidebar from './_components/Sidebar'

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

  return (
    <div className="flex min-h-screen bg-[#fbf9f8]">
      <Sidebar perfil={perfil} />
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  )
}
