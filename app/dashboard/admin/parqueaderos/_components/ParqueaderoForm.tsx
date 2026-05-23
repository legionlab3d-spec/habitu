'use client'

import { useActionState } from 'react'
import { crearParqueadero } from '@/app/actions/parqueaderos'

const TIPOS = [
  { value: 'carro',     label: 'Carro' },
  { value: 'moto',      label: 'Moto' },
  { value: 'visitante', label: 'Visitante' },
  { value: 'bicicleta', label: 'Bicicleta' },
]

export default function ParqueaderoForm() {
  const [state, action, pending] = useActionState(crearParqueadero, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-4 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Parqueadero creado correctamente</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Agregar otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="numero" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Número <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="numero" name="numero" type="text" required
            placeholder="101"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="tipo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Tipo
          </label>
          <select
            id="tipo" name="tipo"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="observaciones" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Observaciones
          </label>
          <input
            id="observaciones" name="observaciones" type="text"
            placeholder="Sótano 1, piso 2..."
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input id="cubierto" name="cubierto" type="checkbox" className="w-4 h-4 rounded accent-[#004746]" />
        <label htmlFor="cubierto" className="text-sm text-[#3f4948]">Cubierto</label>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Creando...' : 'Agregar parqueadero'}
        </button>
      </div>
    </form>
  )
}
