'use client'

import { useActionState } from 'react'
import { vincularApartamento } from '@/app/actions/onboarding'

export default function VincularApartamentoForm({ rol }: { rol: string }) {
  const [state, action, pending] = useActionState(vincularApartamento, undefined)

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="v-numero" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            N° Apartamento <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="v-numero" name="numero" type="text" required
            placeholder="101"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="v-torre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Torre
          </label>
          <input
            id="v-torre" name="torre" type="text"
            placeholder="A (si aplica)"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <p className="text-xs text-[#6f7978]">
        {rol === 'propietario'
          ? 'Se te asignará como propietario del apartamento.'
          : 'Se te asignará como arrendatario del apartamento.'}
      </p>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Vinculando...' : 'Vincular apartamento'}
        </button>
      </div>
    </form>
  )
}
