import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getZonas } from '@/src/services/zonas'
import { eliminarZona, toggleZonaActiva } from '@/app/actions/zonas'
import ZonaForm from '../_components/ZonaForm'

function formatPrecio(valor: number) {
  if (valor === 0) return 'Gratis'
  return `$${valor.toLocaleString('es-CO')}/h`
}

export default async function ZonasGestionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const zonas = await getZonas(supabase, perfil.conjunto_id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 md:mb-8 flex-wrap">
        <div>
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
            Admin · Zonas Comunes
          </p>
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
            Gestión de zonas
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">
            {zonas.length} zona{zonas.length !== 1 ? 's' : ''} registrada{zonas.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/dashboard/admin/zonas"
          className="flex items-center gap-1.5 h-9 px-4 bg-white border border-[#bec9c8] text-[#3f4948] text-sm font-medium rounded-xl hover:bg-[#f5f3f3] transition-colors flex-shrink-0"
        >
          ← Volver al dashboard
        </Link>
      </div>

      {/* Formulario agregar */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Agregar zona común
        </h2>
        <ZonaForm />
      </div>

      {/* Lista */}
      {zonas.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-10 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay zonas comunes aún.</p>
          <p className="text-[#6f7978] text-xs mt-1">Agrega piscina, salón, gimnasio, etc.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {zonas.map((zona) => (
            <div
              key={zona.id}
              className={`bg-white border rounded-2xl p-5 ${
                zona.activa ? 'border-[#bec9c8]' : 'border-[#efeded] opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold text-[#1b1c1c]">{zona.nombre}</p>
                    {zona.requiere_aprobacion && (
                      <span className="text-[10px] font-semibold bg-[#97edf9] text-[#006d77] px-2 py-0.5 rounded-full">
                        Aprobación
                      </span>
                    )}
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      zona.activa
                        ? 'bg-[#d3f9d8] text-[#2f9e44]'
                        : 'bg-[#f5f3f3] text-[#6f7978]'
                    }`}>
                      {zona.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>

                  {zona.descripcion && (
                    <p className="text-xs text-[#3f4948] mb-2">{zona.descripcion}</p>
                  )}

                  <div className="flex gap-4 text-xs text-[#6f7978]">
                    {zona.capacidad && (
                      <span>{zona.capacidad} personas</span>
                    )}
                    <span className="font-semibold text-[#004746]">
                      {formatPrecio(zona.precio_por_hora)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <form action={async () => { 'use server'; await toggleZonaActiva(zona.id, !zona.activa) }}>
                    <button
                      type="submit"
                      className="text-xs text-[#3f4948] hover:text-[#004746] transition-colors px-2 py-1 rounded-lg hover:bg-[#f5f3f3]"
                    >
                      {zona.activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </form>
                  <form action={async () => { 'use server'; await eliminarZona(zona.id) }}>
                    <button
                      type="submit"
                      className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6]"
                    >
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
