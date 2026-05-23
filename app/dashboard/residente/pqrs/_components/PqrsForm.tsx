'use client'

import { useActionState } from 'react'
import { crearPqrs } from '@/app/actions/pqrs'

const TIPOS = [
  { value: 'peticion',   label: 'Petición' },
  { value: 'queja',      label: 'Queja' },
  { value: 'reclamo',    label: 'Reclamo' },
  { value: 'sugerencia', label: 'Sugerencia' },
]

const CATEGORIAS = [
  { value: 'infraestructura', label: 'Infraestructura' },
  { value: 'convivencia',     label: 'Convivencia' },
  { value: 'administracion',  label: 'Administración' },
  { value: 'servicios',       label: 'Servicios' },
  { value: 'financiero',      label: 'Financiero' },
  { value: 'otro',            label: 'Otro' },
]

export default function PqrsForm({ apartamentoId }: { apartamentoId: string | null }) {
  const [state, action, pending] = useActionState(crearPqrs, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">PQRS enviada correctamente</p>
        <p className="text-xs text-[#3f4948] mt-1">La administración responderá pronto.</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-[#2f9e44] underline"
        >
          Crear otra
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      {apartamentoId && (
        <input type="hidden" name="apartamento_id" value={apartamentoId} />
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="tipo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Tipo <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="tipo"
            name="tipo"
            required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="categoria" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Categoría <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="categoria"
            name="categoria"
            required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="asunto" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Asunto <span className="text-[#ba1a1a]">*</span>
        </label>
        <input
          id="asunto"
          name="asunto"
          type="text"
          required
          placeholder="Resumen breve del tema"
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Descripción <span className="text-[#ba1a1a]">*</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={4}
          required
          placeholder="Explica con detalle tu solicitud..."
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      <div>
        <label htmlFor="adjunto" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Adjunto (imagen o PDF)
        </label>
        <input
          id="adjunto"
          name="adjunto"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="w-full text-sm text-[#3f4948] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f5f3f3] file:text-[#004746] hover:file:bg-[#bec9c8] cursor-pointer"
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
          {pending ? 'Enviando...' : 'Enviar PQRS'}
        </button>
      </div>
    </form>
  )
}
