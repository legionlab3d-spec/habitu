'use client'

import { useActionState } from 'react'
import { responderPqrs } from '@/app/actions/pqrs'
import type { Pqrs } from '@/src/services/pqrs'

const ESTADOS: { value: Pqrs['estado']; label: string }[] = [
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'resuelto',   label: 'Resuelto' },
  { value: 'cerrado',    label: 'Cerrado' },
  { value: 'recibido',   label: 'Recibido' },
]

export default function ResponderPqrsForm({ pqrs }: { pqrs: Pqrs }) {
  const [state, action, pending] = useActionState(responderPqrs, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-4 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Respuesta guardada correctamente</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="pqrs_id" value={pqrs.id} />

      <div>
        <label htmlFor="estado" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Estado
        </label>
        <select
          id="estado"
          name="estado"
          defaultValue={pqrs.estado}
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="respuesta" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Respuesta <span className="text-[#ba1a1a]">*</span>
        </label>
        <textarea
          id="respuesta"
          name="respuesta"
          rows={4}
          required
          defaultValue={pqrs.respuesta ?? ''}
          placeholder="Escribe la respuesta para el residente..."
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Guardando...' : 'Guardar respuesta'}
        </button>
      </div>
    </form>
  )
}
