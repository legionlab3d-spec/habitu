'use client'

import { useActionState } from 'react'
import { crearComunicado } from '@/app/actions/comunicados'

const TIPOS = [
  { value: 'informativo',   label: 'Informativo' },
  { value: 'urgente',       label: 'Urgente' },
  { value: 'evento',        label: 'Evento' },
  { value: 'mantenimiento', label: 'Mantenimiento' },
]

const DESTINATARIOS = [
  { value: 'todos',         label: 'Todos' },
  { value: 'residentes',    label: 'Solo residentes' },
  { value: 'propietarios',  label: 'Solo propietarios' },
]

export default function ComunicadoForm() {
  const [state, action, pending] = useActionState(crearComunicado, undefined)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div>
        <label htmlFor="titulo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Título <span className="text-[#ba1a1a]">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          type="text"
          required
          placeholder="Ej: Mantenimiento de ascensores"
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="contenido" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Contenido <span className="text-[#ba1a1a]">*</span>
        </label>
        <textarea
          id="contenido"
          name="contenido"
          required
          rows={4}
          placeholder="Escribe el mensaje para los residentes..."
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tipo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Tipo
          </label>
          <select
            id="tipo"
            name="tipo"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="destinatario" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Destinatario
          </label>
          <select
            id="destinatario"
            name="destinatario"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {DESTINATARIOS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
      </div>

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
          {pending ? 'Publicando...' : 'Publicar comunicado'}
        </button>
      </div>
    </form>
  )
}
