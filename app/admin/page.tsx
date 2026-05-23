import { createClient } from '@/src/lib/supabase-server'
import { logout } from '@/app/actions/auth'

export default async function AdminPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
        <p className="text-gray-600 text-sm">Sesión activa: {user?.email}</p>
      </div>
    </div>
  )
}
