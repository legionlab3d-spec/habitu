'use client'

import { useActionState } from 'react'
import { registrarPaquete } from '@/app/actions/paquetes'

interface Props {
  apartamentos: { id: string; numero: string; torre: string | null }[]
}

export default function PaqueteForm({ apartamentos }: Props) {
  const [state, action, pending] = useActionState(registrarPaquete, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Paquete registrado correctamente</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Registrar otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="apartamento_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Apartamento <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="apartamento_id" name="apartamento_id" required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            <option value="">Selecciona apartamento</option>
            {apartamentos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.torre ? `Torre ${a.torre} · ` : ''}Apto {a.numero}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="empresa_envio" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Empresa de envío
          </label>
          <input
            id="empresa_envio" name="empresa_envio" type="text"
            placeholder="Ej: Coordinadora, Servientrega"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="numero_guia" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Número de guía
          </label>
          <input
            id="numero_guia" name="numero_guia" type="text"
            placeholder="Número de rastreo"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="descripcion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Descripción
          </label>
          <input
            id="descripcion" name="descripcion" type="text"
            placeholder="Caja, sobre, etc."
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Registrando...' : 'Registrar paquete'}
        </button>
      </div>
    </form>
  )
}
