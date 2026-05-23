import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getDashboardStats } from '@/src/services/dashboard'

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string
  value: number
  icon: React.ReactNode
  sub?: string
}) {
  return (
    <div className="bg-white border border-[#bec9c8] rounded-2xl p-4 md:p-5 flex flex-col justify-between aspect-square">
      <div className="flex justify-between items-start">
        <span className="text-[#004746]">{icon}</span>
        {sub && (
          <span className="text-xs font-semibold text-[#3f4948]">{sub}</span>
        )}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wider mb-1">
          {label}
        </p>
        <p className="font-[family-name:var(--font-outfit)] text-3xl md:text-4xl font-bold text-[#1b1c1c]">
          {value}
        </p>
      </div>
    </div>
  )
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const stats = await getDashboardStats(supabase, perfil.conjunto_id)

  const conjunto = (perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? 'Tu conjunto'

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-[#3f4948] font-medium uppercase tracking-wide mb-1">
          Panel de Control
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Hola, {perfil.nombre.split(' ')[0]}!
        </h1>
        <p className="text-[#3f4948] text-sm mt-1">
          Resumen operativo · {conjunto}
        </p>
      </div>

      {/* Stats 2x2 */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          label="Apartamentos"
          value={stats.apartamentos}
          sub="Total"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          }
        />
        <StatCard
          label="Reservas"
          value={stats.reservas}
          sub="Este mes"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          }
        />
        <StatCard
          label="Zonas Comunes"
          value={stats.zonas_comunes}
          sub="Activas"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <circle cx="12" cy="12" r="10"/>
              <line x1="2" y1="12" x2="22" y2="12"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
            </svg>
          }
        />
        <StatCard
          label="Anuncios"
          value={stats.anuncios}
          sub="Publicados"
          icon={
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          }
        />
      </div>

      {/* Info card */}
      <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-5 max-w-lg">
        <h3 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-3">
          Información del conjunto
        </h3>
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Conjunto</dt>
            <dd className="font-medium text-[#1b1c1c]">{conjunto}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Administrador</dt>
            <dd className="font-medium text-[#1b1c1c]">{perfil.nombre}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Email</dt>
            <dd className="font-medium text-[#1b1c1c] truncate max-w-[180px]">{perfil.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">ID conjunto</dt>
            <dd className="font-mono text-xs text-[#6f7978] truncate max-w-[180px]">
              {perfil.conjunto_id}
            </dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
