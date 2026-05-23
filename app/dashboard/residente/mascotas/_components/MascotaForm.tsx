'use client'

import { useActionState } from 'react'
import { registrarMascota } from '@/app/actions/mascotas'

const TIPOS = [
  { value: 'perro',  label: 'Perro' },
  { value: 'gato',   label: 'Gato' },
  { value: 'ave',    label: 'Ave' },
  { value: 'reptil', label: 'Reptil' },
  { value: 'otro',   label: 'Otro' },
]

export default function MascotaForm({ apartamentoId }: { apartamentoId: string }) {
  const [state, action, pending] = useActionState(registrarMascota, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Mascota registrada correctamente</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Registrar otra
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="apartamento_id" value={apartamentoId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Nombre <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="nombre" name="nombre" type="text" required
            placeholder="Nombre de la mascota"
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="raza" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Raza
          </label>
          <input
            id="raza" name="raza" type="text"
            placeholder="Labrador"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="color" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Color
          </label>
          <input
            id="color" name="color" type="text"
            placeholder="Café"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            id="vacunas_al_dia" name="vacunas_al_dia" type="checkbox"
            className="w-4 h-4 rounded accent-[#004746]"
          />
          <label htmlFor="vacunas_al_dia" className="text-sm text-[#3f4948]">
            Vacunas al día
          </label>
        </div>
        <div className="flex items-center gap-2">
          <input
            id="soporte_emocional" name="soporte_emocional" type="checkbox"
            className="w-4 h-4 rounded accent-[#004746]"
          />
          <label htmlFor="soporte_emocional" className="text-sm text-[#3f4948]">
            Animal de soporte emocional
          </label>
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
          {pending ? 'Registrando...' : 'Registrar mascota'}
        </button>
      </div>
    </form>
  )
}
