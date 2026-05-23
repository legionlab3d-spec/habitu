'use client'

import { useActionState } from 'react'
import { registrarVisitante } from '@/app/actions/visitantes'

const TIPOS = [
  { value: 'persona',  label: 'Persona' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'servicio', label: 'Servicio técnico' },
]

interface Props {
  apartamentos: { id: string; numero: string; torre: string | null }[]
}

export default function VisitanteForm({ apartamentos }: Props) {
  const [state, action, pending] = useActionState(registrarVisitante, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Visitante registrado correctamente</p>
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
          <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Nombre <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="nombre" name="nombre" type="text" required
            placeholder="Nombre completo"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="documento" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Documento
          </label>
          <input
            id="documento" name="documento" type="text"
            placeholder="Cédula / pasaporte"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

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
          <label htmlFor="tipo_visita" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Tipo
          </label>
          <select
            id="tipo_visita" name="tipo_visita"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="placa_vehiculo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Placa vehículo
          </label>
          <input
            id="placa_vehiculo" name="placa_vehiculo" type="text"
            placeholder="ABC123"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="fecha_expiracion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Válido hasta
          </label>
          <input
            id="fecha_expiracion" name="fecha_expiracion" type="date"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="observaciones" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Observaciones
        </label>
        <input
          id="observaciones" name="observaciones" type="text"
          placeholder="Motivo de visita, etc."
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Registrando...' : 'Registrar visitante'}
        </button>
      </div>
    </form>
  )
}
