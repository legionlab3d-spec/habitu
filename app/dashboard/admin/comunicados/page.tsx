import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getComunicados, type Comunicado } from '@/src/services/comunicados'
import { toggleComunicado, eliminarComunicado } from '@/app/actions/comunicados'
import ComunicadoForm from './_components/ComunicadoForm'

const TIPO_STYLES: Record<Comunicado['tipo'], { bg: string; text: string; label: string }> = {
  informativo:   { bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]', label: 'Informativo' },
  urgente:       { bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'Urgente' },
  evento:        { bg: 'bg-[#f3d9fa]', text: 'text-[#862e9c]', label: 'Evento' },
  mantenimiento: { bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Mantenimiento' },
}

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

export default async function ComunicadosAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil || perfil.rol !== 'admin') redirect('/dashboard')

  const comunicados = await getComunicados(supabase, perfil.conjunto_id)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-3xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">
          Admin · Comunicados
        </p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Comunicados
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {comunicados.length} publicado{comunicados.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 mb-6">
        <h2 className="font-[family-name:var(--font-outfit)] text-sm font-semibold text-[#1b1c1c] mb-4">
          Nuevo comunicado
        </h2>
        <ComunicadoForm />
      </div>

      {comunicados.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-10 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay comunicados publicados.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comunicados.map((c) => {
            const estilo = TIPO_STYLES[c.tipo] ?? TIPO_STYLES.informativo
            return (
              <div
                key={c.id}
                className={`bg-white border rounded-2xl p-5 ${c.activo ? 'border-[#bec9c8]' : 'border-[#efeded] opacity-55'}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
                        {estilo.label}
                      </span>
                      <span className="text-[10px] font-semibold text-[#6f7978] bg-[#f5f3f3] px-2 py-0.5 rounded-full capitalize">
                        {c.destinatario}
                      </span>
                      {!c.activo && (
                        <span className="text-[10px] font-semibold text-[#6f7978] bg-[#efeded] px-2 py-0.5 rounded-full">
                          Inactivo
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-[#1b1c1c] mb-1">{c.titulo}</p>
                    <p className="text-xs text-[#3f4948] line-clamp-2 mb-2">{c.contenido}</p>
                    <p className="text-[10px] text-[#6f7978] uppercase tracking-wide">{formatFecha(c.created_at)}</p>
                  </div>

                  <div className="flex flex-col gap-1 flex-shrink-0">
                    <form action={async () => { 'use server'; await toggleComunicado(c.id, !c.activo) }}>
                      <button type="submit" className="text-xs text-[#3f4948] hover:text-[#004746] transition-colors px-2 py-1 rounded-lg hover:bg-[#f5f3f3] w-full text-left">
                        {c.activo ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </form>
                    <form action={async () => { 'use server'; await eliminarComunicado(c.id) }}>
                      <button type="submit" className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6] w-full text-left">
                        Eliminar
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
