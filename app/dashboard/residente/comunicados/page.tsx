import { redirect } from 'next/navigation'
import { createClient } from '@/src/lib/supabase-server'
import { getUsuarioPerfil } from '@/src/services/usuarios'
import { getComunicados, type Comunicado } from '@/src/services/comunicados'
import ComunicadoCard from './_components/ComunicadoCard'

const TIPO_STYLES: Record<Comunicado['tipo'], { border: string; bg: string; text: string; label: string }> = {
  informativo:   { border: 'border-l-[#339af0]', bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]', label: 'Informativo' },
  urgente:       { border: 'border-l-[#ba1a1a]', bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]', label: 'Urgente' },
  evento:        { border: 'border-l-[#cc5de8]', bg: 'bg-[#f3d9fa]', text: 'text-[#862e9c]', label: 'Evento' },
  mantenimiento: { border: 'border-l-[#f59f00]', bg: 'bg-[#fff9db]', text: 'text-[#e67700]', label: 'Mantenimiento' },
}

export default async function ComunicadosResidentePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const perfil = await getUsuarioPerfil(supabase, user.id)
  if (!perfil) redirect('/registro-completar')

  const comunicados = await getComunicados(supabase, perfil.conjunto_id, true)

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-2xl">
      <div className="mb-6 md:mb-8">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1">Conjunto</p>
        <h1 className="font-[family-name:var(--font-outfit)] text-2xl md:text-3xl font-bold text-[#1b1c1c]">
          Comunicados
        </h1>
        <p className="text-sm text-[#3f4948] mt-1">
          {(perfil.conjuntos as { nombre: string } | undefined)?.nombre ?? ''}
        </p>
      </div>

      {comunicados.length === 0 ? (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl p-10 text-center">
          <p className="text-[#3f4948] text-sm font-medium">No hay comunicados activos.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {comunicados.map((c) => (
            <ComunicadoCard
              key={c.id}
              comunicado={c}
              estilo={TIPO_STYLES[c.tipo] ?? TIPO_STYLES.informativo}
            />
          ))}
        </div>
      )}
    </div>
  )
}
