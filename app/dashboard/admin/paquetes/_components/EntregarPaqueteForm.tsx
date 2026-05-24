'use client'

import { useActionState, useState } from 'react'
import { procesarEntregaPaquete } from '@/app/actions/paquetes'

interface Props {
  paqueteId: string
}

export default function EntregarPaqueteForm({ paqueteId }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(procesarEntregaPaquete, undefined)

  if (state?.ok) {
    return (
      <span className="text-xs text-[#2f9e44] font-semibold">Entregado ✓</span>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#2f9e44] border border-[#2f9e44] hover:bg-[#d3f9d8] transition-colors px-3 py-1.5 rounded-lg whitespace-nowrap"
      >
        Marcar entregado
      </button>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-2 min-w-[200px]">
      <input type="hidden" name="paquete_id" value={paqueteId} />

      <input
        name="entregado_a"
        type="text"
        placeholder="Recibido por (residente o nombre)"
        className="h-8 px-2.5 text-xs bg-[#f5f3f3] border border-[#bec9c8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004746]"
        autoFocus
      />
      <input
        name="entregado_por"
        type="text"
        placeholder="Entregado por (portero/admin)"
        className="h-8 px-2.5 text-xs bg-[#f5f3f3] border border-[#bec9c8] rounded-lg focus:outline-none focus:ring-1 focus:ring-[#004746]"
      />

      {state?.error && (
        <p className="text-[10px] text-[#ba1a1a]">{state.error}</p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="flex-1 h-8 text-xs bg-[#08605f] hover:bg-[#004746] text-white font-semibold rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? '...' : 'Confirmar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-8 px-3 text-xs text-[#6f7978] hover:text-[#1b1c1c] hover:bg-[#f5f3f3] rounded-lg transition-colors"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
