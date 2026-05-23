'use client'

import { useActionState } from 'react'
import { setCuotaApartamento } from '@/app/actions/cartera'

interface Apartamento {
  id: string
  numero: string
  torre: string | null
  cuota_mensual: number | null
}

export default function CuotaApartamentoForm({
  apartamentos,
  cuotaDefault,
}: {
  apartamentos: Apartamento[]
  cuotaDefault: number
}) {
  const [state, action, pending] = useActionState(setCuotaApartamento, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="apartamento_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Apartamento
          </label>
          <select
            id="apartamento_id"
            name="apartamento_id"
            required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {apartamentos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.torre ? `Torre ${a.torre} · ` : ''}{a.numero}
                {a.cuota_mensual !== null ? ` — $${a.cuota_mensual.toLocaleString('es-CO')}` : ' — (default)'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="cuota_mensual" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Cuota individual ($)
          </label>
          <input
            id="cuota_mensual"
            name="cuota_mensual"
            type="number"
            min="0"
            step="1000"
            placeholder={`Dejar vacío = default ($${cuotaDefault.toLocaleString('es-CO')})`}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full h-10 px-4 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {pending ? 'Guardando...' : 'Aplicar'}
          </button>
        </div>
      </div>

      <p className="text-[11px] text-[#6f7978]">
        Dejar vacío restaura la cuota por defecto del conjunto. Esta cuota se usará en la próxima generación de estados de cuenta.
      </p>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-[#2f9e44] bg-[#d3f9d8] px-3 py-2 rounded-xl">Cuota actualizada</p>
      )}
    </form>
  )
}
