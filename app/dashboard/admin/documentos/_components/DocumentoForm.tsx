'use client'

import { useActionState } from 'react'
import { subirDocumento } from '@/app/actions/documentos'

const CATEGORIAS = [
  { value: 'reglamento',         label: 'Reglamento' },
  { value: 'manual_convivencia', label: 'Manual de convivencia' },
  { value: 'acta',               label: 'Acta' },
  { value: 'certificado',        label: 'Certificado' },
  { value: 'circular',           label: 'Circular' },
  { value: 'presupuesto',        label: 'Presupuesto' },
  { value: 'otro',               label: 'Otro' },
]

export default function DocumentoForm() {
  const [state, action, pending] = useActionState(subirDocumento, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Documento subido correctamente</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Subir otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Nombre <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="nombre" name="nombre" type="text" required
            placeholder="Nombre del documento"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="categoria" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Categoría
          </label>
          <select
            id="categoria" name="categoria"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          >
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Descripción
        </label>
        <input
          id="descripcion" name="descripcion" type="text"
          placeholder="Breve descripción (opcional)"
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="archivo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Archivo <span className="text-[#ba1a1a]">*</span>
        </label>
        <input
          id="archivo" name="archivo" type="file" required
          accept="application/pdf,image/jpeg,image/png,.doc,.docx,.xls,.xlsx"
          className="w-full text-sm text-[#3f4948] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f5f3f3] file:text-[#004746] hover:file:bg-[#bec9c8] cursor-pointer"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="publico" name="publico" type="checkbox" defaultChecked
          className="w-4 h-4 rounded accent-[#004746]"
        />
        <label htmlFor="publico" className="text-sm text-[#3f4948]">
          Visible para todos los residentes
        </label>
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Subiendo...' : 'Subir documento'}
        </button>
      </div>
    </form>
  )
}
