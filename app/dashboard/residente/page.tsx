import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'

export default async function ResidenteDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'residente') redirect('/dashboard')

  const conjunto = (perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? 'Tu conjunto'

  // Conteo de reservas del residente
  const { count: misReservas } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('conjunto_id', perfil.conjunto_id)

  // Últimos anuncios
  const { data: anuncios } = await supabase
    .from('anuncios')
    .select('id, titulo, created_at')
    .eq('conjunto_id', perfil.conjunto_id)
    .order('created_at', { ascending: false })
    .limit(3)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-xs text-[#3f4948] font-medium uppercase tracking-wide mb-1">
          Residente
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Hola, {perfil.nombre.split(' ')[0]}!
        </h1>
        <p className="text-[#3f4948] text-sm mt-1">
          Bienvenido a casa · {conjunto}
        </p>
      </div>

      {/* Stats residente */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wider mb-1">
            Mis Reservas
          </p>
          <p className="font-[family-name:var(--font-outfit)] text-4xl font-bold text-[#1b1c1c]">
            {misReservas ?? 0}
          </p>
        </div>
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wider mb-1">
            Cuota
          </p>
          <p className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#08605f]">
            Al día
          </p>
        </div>
      </div>

      {/* Anuncios recientes */}
      <div>
        <h2 className="font-[family-name:var(--font-outfit)] text-lg font-semibold text-[#1b1c1c] mb-3">
          Últimos comunicados
        </h2>

        {!anuncios || anuncios.length === 0 ? (
          <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-6 text-center">
            <p className="text-sm text-[#3f4948]">No hay comunicados aún.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {anuncios.map((a) => (
              <div
                key={a.id}
                className="bg-white border border-[#bec9c8] rounded-2xl px-5 py-4 flex items-center gap-4"
              >
                <div className="w-10 h-10 rounded-xl bg-[#f5f3f3] flex items-center justify-center flex-shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                    <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1b1c1c] truncate">{a.titulo}</p>
                  <p className="text-xs text-[#6f7978] mt-0.5">
                    {new Date(a.created_at).toLocaleDateString('es-CO', {
                      day: 'numeric',
                      month: 'short',
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-5 mt-6">
        <dl className="space-y-2">
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Nombre</dt>
            <dd className="font-medium text-[#1b1c1c]">{perfil.nombre}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Email</dt>
            <dd className="font-medium text-[#1b1c1c] truncate max-w-[180px]">{perfil.email}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-[#3f4948]">Conjunto</dt>
            <dd className="font-medium text-[#1b1c1c]">{conjunto}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}
