'use client'

import { useActionState, useState } from 'react'
import { generarEstructura } from '@/app/actions/apartamentos'

interface Props {
  dark?: boolean
}

export default function GenerarEstructuraForm({ dark = false }: Props) {
  const [state, action, pending] = useActionState(generarEstructura, undefined)
  const [conTorres, setConTorres] = useState(false)

  const labelCls = dark
    ? 'block text-xs font-semibold text-white/70 uppercase tracking-wide mb-1.5'
    : 'block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5'
  const inputCls = dark
    ? 'w-full h-10 px-3 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent'
    : 'w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent'

  return (
    <form action={action} className="flex flex-col gap-4">
      {/* Torres toggle */}
      <div className="flex items-center gap-2">
        <input
          id="con_torres"
          type="checkbox"
          checked={conTorres}
          onChange={(e) => setConTorres(e.target.checked)}
          className="w-4 h-4 rounded accent-white"
        />
        <label htmlFor="con_torres" className={`text-sm ${dark ? 'text-white' : 'text-[#3f4948]'}`}>
          El conjunto tiene torres
        </label>
      </div>

      {/* Torres names */}
      {conTorres && (
        <div>
          <label htmlFor="torres" className={labelCls}>
            Nombres de las torres (una por línea)
          </label>
          <textarea
            id="torres"
            name="torres"
            rows={3}
            placeholder={'A\nB\nC'}
            className={dark
              ? 'w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40 focus:border-transparent resize-none font-mono'
              : 'w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none font-mono'
            }
          />
          <p className={`text-xs mt-1 ${dark ? 'text-white/50' : 'text-[#6f7978]'}`}>Ej: A, B, C  o  1, 2, 3  o  Norte, Sur</p>
        </div>
      )}

      {/* Hidden empty torres field when no torres */}
      {!conTorres && <input type="hidden" name="torres" value="" />}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label htmlFor="tipo_unidad" className={labelCls}>
            Tipo de unidad <span className={dark ? 'text-[#ff8fa3]' : 'text-[#ba1a1a]'}>*</span>
          </label>
          <select
            id="tipo_unidad"
            name="tipo_unidad"
            className={inputCls}
          >
            <option value="apartamento">Apartamento</option>
            <option value="casa">Casa</option>
            <option value="local">Local</option>
            <option value="bodega">Bodega</option>
          </select>
        </div>
        <div>
          <label htmlFor="pisos" className={labelCls}>
            Pisos <span className={dark ? 'text-[#ff8fa3]' : 'text-[#ba1a1a]'}>*</span>
          </label>
          <input
            id="pisos"
            name="pisos"
            type="number"
            min="1"
            max="100"
            required
            placeholder="10"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="por_piso" className={labelCls}>
            Unidades por piso <span className={dark ? 'text-[#ff8fa3]' : 'text-[#ba1a1a]'}>*</span>
          </label>
          <input
            id="por_piso"
            name="por_piso"
            type="number"
            min="1"
            max="50"
            required
            placeholder="4"
            className={inputCls}
          />
        </div>
        <div>
          <label htmlFor="formato" className={labelCls}>
            Numeración
          </label>
          <select
            id="formato"
            name="formato"
            className={inputCls}
          >
            <option value="piso100">Piso × 100 (101, 102…)</option>
            <option value="continuo">Continuo (1, 2, 3…)</option>
          </select>
        </div>
      </div>

      <div className={`rounded-xl px-4 py-3 text-xs ${dark ? 'bg-white/10 text-white/60' : 'bg-[#f5f3f3] text-[#6f7978]'}`}>
        <span className={`font-semibold ${dark ? 'text-white/80' : 'text-[#3f4948]'}`}>Ejemplo Piso × 100:</span> Piso 1 → 101, 102, 103 · Piso 2 → 201, 202, 203<br/>
        <span className={`font-semibold ${dark ? 'text-white/80' : 'text-[#3f4948]'}`}>Ejemplo Continuo:</span> 1, 2, 3, 4, 5… en orden ascendente por piso
      </div>

      {state?.ok && (
        <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-[#2f9e44]">
            {state.creados} unidad{state.creados !== 1 ? 'es' : ''} creada{state.creados !== 1 ? 's' : ''}
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
          className={`h-10 px-6 text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
            dark
              ? 'bg-white text-[#004746] hover:bg-white/90'
              : 'bg-[#08605f] hover:bg-[#004746] text-white'
          }`}
        >
          {pending ? 'Generando...' : 'Generar apartamentos'}
        </button>
      </div>
    </form>
  )
}
