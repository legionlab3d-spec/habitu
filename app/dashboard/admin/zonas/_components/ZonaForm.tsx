'use client'

import { useActionState, useRef } from 'react'
import { crearZona } from '@/app/actions/zonas'

export default function ZonaForm() {
  const [state, action, pending] = useActionState(crearZona, undefined)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Nombre <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="nombre"
            name="nombre"
            type="text"
            required
            placeholder="Ej: Piscina, Salón Comunal, Gimnasio"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div className="col-span-2">
          <label htmlFor="descripcion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Descripción
          </label>
          <input
            id="descripcion"
            name="descripcion"
            type="text"
            placeholder="Descripción breve (opcional)"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="capacidad" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Capacidad (personas)
          </label>
          <input
            id="capacidad"
            name="capacidad"
            type="number"
            min="1"
            placeholder="Ej: 20"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="precio" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Precio por hora ($)
          </label>
          <input
            id="precio"
            name="precio"
            type="number"
            min="0"
            step="1000"
            placeholder="0"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <input
          name="requiere_aprobacion"
          type="checkbox"
          className="w-4 h-4 rounded border-[#bec9c8] accent-[#004746]"
        />
        <span className="text-sm text-[#1b1c1c]">Requiere aprobación del admin</span>
      </label>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Guardando...' : '+ Agregar zona'}
        </button>
      </div>
    </form>
  )
}
