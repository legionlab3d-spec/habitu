'use client'

import { useActionState } from 'react'
import { asignarUsuarioApartamento } from '@/app/actions/apartamentos'

interface Usuario {
  id: string
  nombre: string
  email: string
  rol: string
}

interface Apartamento {
  id: string
  numero: string
  torre: string | null
}

interface Props {
  usuarios: Usuario[]
  apartamentos: Apartamento[]
}

export default function AsignarUsuarioForm({ usuarios, apartamentos }: Props) {
  const [state, action, pending] = useActionState(asignarUsuarioApartamento, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-xl px-4 py-3">
        <p className="text-sm font-semibold text-[#2f9e44]">Usuario asignado correctamente.</p>
        <button onClick={() => window.location.reload()} className="text-xs text-[#2f9e44] underline mt-1">
          Asignar otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="au-usuario" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Usuario <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="au-usuario" name="usuario_id" required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            <option value="">Seleccionar usuario…</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre} ({u.rol === 'propietario' ? 'Propietario' : 'Arrendatario'})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="au-apto" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Apartamento <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="au-apto" name="apartamento_id" required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            <option value="">Seleccionar apartamento…</option>
            {apartamentos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.torre ? `Torre ${a.torre} · ` : ''}Apto {a.numero}
              </option>
            ))}
          </select>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Asignando...' : 'Asignar'}
        </button>
      </div>
    </form>
  )
}
