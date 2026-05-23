'use client'

import { useActionState, useState } from 'react'
import { generarEstructura } from '@/app/actions/apartamentos'

export default function GenerarEstructuraForm() {
  const [state, action, pending] = useActionState(generarEstructura, undefined)
  const [conTorres, setConTorres] = useState(false)

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Torres toggle */}
      <div className="flex items-center gap-2">
        <input
          id="con_torres"
          type="checkbox"
          checked={conTorres}
          onChange={(e) => setConTorres(e.target.checked)}
          className="w-4 h-4 rounded accent-[#004746]"
        />
        <label htmlFor="con_torres" className="text-sm text-[#3f4948]">
          El conjunto tiene torres
        </label>
      </div>

      {/* Torres names */}
      {conTorres && (
        <div>
          <label htmlFor="torres" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Nombres de las torres (una por línea)
          </label>
          <textarea
            id="torres"
            name="torres"
            rows={3}
            placeholder={'A\nB\nC'}
            className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none font-mono"
          />
          <p className="text-xs text-[#6f7978] mt-1">Ej: A, B, C  o  1, 2, 3  o  Norte, Sur</p>
        </div>
      )}

      {/* Hidden empty torres field when no torres */}
      {!conTorres && <input type="hidden" name="torres" value="" />}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="pisos" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Pisos <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="pisos"
            name="pisos"
            type="number"
            min="1"
            max="100"
            required
            placeholder="10"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="por_piso" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Apts por piso <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="por_piso"
            name="por_piso"
            type="number"
            min="1"
            max="50"
            required
            placeholder="4"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="formato" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Numeración
          </label>
          <select
            id="formato"
            name="formato"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            <option value="piso100">Piso × 100 (101, 102…)</option>
            <option value="continuo">Continuo (1, 2, 3…)</option>
          </select>
        </div>
      </div>

      <div className="bg-[#f5f3f3] rounded-xl px-4 py-3 text-xs text-[#6f7978]">
        <span className="font-semibold text-[#3f4948]">Ejemplo Piso × 100:</span> Piso 1 → 101, 102, 103 · Piso 2 → 201, 202, 203<br/>
        <span className="font-semibold text-[#3f4948]">Ejemplo Continuo:</span> 1, 2, 3, 4, 5… en orden ascendente por piso
      </div>

      {state?.ok && (
        <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-[#2f9e44]">
            {state.creados} apartamento{state.creados !== 1 ? 's' : ''} creado{state.creados !== 1 ? 's' : ''}
            {state.omitidos ? ` · ${state.omitidos} ya existían` : ''}
          </p>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Generando...' : 'Generar apartamentos'}
        </button>
      </div>
    </form>
  )
}
