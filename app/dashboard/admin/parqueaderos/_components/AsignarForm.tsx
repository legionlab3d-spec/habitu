'use client'

import { useTransition } from 'react'
import { asignarParqueadero } from '@/app/actions/parqueaderos'

interface Props {
  parqueaderoId: string
  apartamentoActualId: string | null
  apartamentos: { id: string; numero: string; torre: string | null }[]
}

export default function AsignarForm({ parqueaderoId, apartamentoActualId, apartamentos }: Props) {
  const [pending, startTransition] = useTransition()

  if (apartamentoActualId) {
    return (
      <button
        disabled={pending}
        onClick={() => startTransition(() => asignarParqueadero(parqueaderoId, null))}
        className="text-xs text-[#6f7978] hover:text-[#004746] transition-colors px-2 py-1.5 rounded-lg hover:bg-[#e8f3f3] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {pending ? 'Guardando...' : 'Desasignar'}
      </button>
    )
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        const fd = new FormData(e.currentTarget)
        const aptoId = fd.get('apartamento_id') as string
        if (!aptoId) return
        startTransition(() => asignarParqueadero(parqueaderoId, aptoId))
      }}
      className="flex items-center gap-2"
    >
      <select
        name="apartamento_id"
        defaultValue=""
        className="h-8 px-2 bg-[#f5f3f3] border border-[#bec9c8] rounded-lg text-xs text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
      >
        <option value="" disabled>Asignar a…</option>
        {apartamentos.map((a) => (
          <option key={a.id} value={a.id}>
            {a.torre ? `T${a.torre}-` : ''}Apto {a.numero}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="h-8 px-3 bg-[#08605f] hover:bg-[#004746] text-white text-xs font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {pending ? '...' : 'Asignar'}
      </button>
    </form>
  )
}
