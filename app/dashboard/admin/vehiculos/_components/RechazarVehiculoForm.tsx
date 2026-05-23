'use client'

import { useActionState, useState } from 'react'
import { rechazarVehiculo } from '@/app/actions/vehiculos'

export default function RechazarVehiculoForm({ vehiculoId }: { vehiculoId: string }) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(rechazarVehiculo, undefined)

  if (state?.ok) {
    return <span className="text-[11px] text-[#6f7978]">Rechazado</span>
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-[#6f7978] hover:text-[#ba1a1a] transition-colors px-2 py-1 rounded-lg hover:bg-[#ffdad6]"
      >
        Rechazar
      </button>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-2 mt-1">
      <input type="hidden" name="vehiculo_id" value={vehiculoId} />
      <textarea
        name="comentarios"
        rows={2}
        placeholder="Motivo del rechazo (opcional)"
        className="w-full px-2 py-1.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-lg text-xs text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-1 focus:ring-[#ba1a1a] resize-none"
      />
      {state?.error && <p className="text-[11px] text-[#ba1a1a]">{state.error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="text-xs text-white bg-[#ba1a1a] hover:bg-[#93000a] px-3 py-1 rounded-lg disabled:opacity-50 transition-colors"
        >
          {pending ? '...' : 'Confirmar rechazo'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs text-[#6f7978] hover:text-[#1b1c1c] px-2 py-1 rounded-lg"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
