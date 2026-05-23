'use client'

import { useActionState } from 'react'
import { crearApartamento } from '@/app/actions/apartamentos'

export default function ApartamentoForm() {
  const [state, action, pending] = useActionState(crearApartamento, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="flex gap-3">
        <div className="w-32">
          <label htmlFor="torre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Torre
          </label>
          <input
            id="torre"
            name="torre"
            type="text"
            placeholder="A"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div className="flex-1">
          <label htmlFor="numero" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Número <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="numero"
            name="numero"
            type="text"
            required
            placeholder="101"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="h-10 px-5 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
          >
            {pending ? 'Agregando...' : '+ Agregar'}
          </button>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">
          {state.error}
        </p>
      )}
    </form>
  )
}
