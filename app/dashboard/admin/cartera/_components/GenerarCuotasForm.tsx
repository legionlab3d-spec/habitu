'use client'

import { useActionState } from 'react'
import { generarCuotas } from '@/app/actions/cartera'

export default function GenerarCuotasForm() {
  const [state, action, pending] = useActionState(generarCuotas, undefined)

  const hoy = new Date()
  const periodoActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  const fechaDefault  = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-10`

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="periodo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Período <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="periodo"
            name="periodo"
            type="month"
            required
            defaultValue={periodoActual}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="fecha_vencimiento" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Fecha límite pago <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="fecha_vencimiento"
            name="fecha_vencimiento"
            type="date"
            required
            defaultValue={fechaDefault}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      {state?.resultado && (
        <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-xl px-4 py-3">
          <p className="text-sm text-[#2f9e44] font-semibold">
            {state.resultado.insertados} estado{state.resultado.insertados !== 1 ? 's' : ''} generado{state.resultado.insertados !== 1 ? 's' : ''}
            {state.resultado.omitidos > 0 && ` · ${state.resultado.omitidos} ya existían`}
          </p>
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Generando...' : 'Generar cuotas'}
        </button>
      </div>
    </form>
  )
}
