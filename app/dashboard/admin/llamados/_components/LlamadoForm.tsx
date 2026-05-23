'use client'

import { useActionState, useRef, useState } from 'react'
import { crearLlamado } from '@/app/actions/llamados'

const TIPOS = [
  { value: 'convivencia',    label: 'Convivencia' },
  { value: 'ruido',          label: 'Ruido' },
  { value: 'daños',          label: 'Daños' },
  { value: 'incumplimiento', label: 'Incumplimiento' },
  { value: 'otro',           label: 'Otro' },
]

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

interface Props {
  apartamentos: { id: string; numero: string; torre: string | null }[]
}

export default function LlamadoForm({ apartamentos }: Props) {
  const [state, action, pending] = useActionState(crearLlamado, undefined)
  const [preview, setPreview] = useState<string | 'pdf' | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setPreview(null)
    setFileError(null)
    if (!file) return

    if (file.size > MAX_SIZE) {
      setFileError('El archivo no puede superar 5 MB.')
      e.target.value = ''
      return
    }
    if (!ALLOWED.includes(file.type)) {
      setFileError('Solo se permiten imágenes (JPG, PNG, WebP) o PDF.')
      e.target.value = ''
      return
    }

    if (file.type === 'application/pdf') {
      setPreview('pdf')
    } else {
      const reader = new FileReader()
      reader.onload = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  function limpiarArchivo() {
    setPreview(null)
    setFileError(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Llamado de atención creado correctamente</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 text-xs text-[#2f9e44] underline"
        >
          Crear otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="apartamento_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Apartamento <span className="text-[#ba1a1a]">*</span>
          </label>
          <select
            id="apartamento_id"
            name="apartamento_id"
            required
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
      </div>

      <div>
        <label htmlFor="descripcion" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Descripción <span className="text-[#ba1a1a]">*</span>
        </label>
        <textarea
          id="descripcion"
          name="descripcion"
          rows={3}
          required
          placeholder="Describe el motivo del llamado de atención..."
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      {/* Evidencia con preview */}
      <div>
        <label className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Evidencia (imagen o PDF, máx. 5 MB)
        </label>

        {!preview ? (
          <label className="flex items-center gap-3 w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl cursor-pointer hover:bg-[#efeded] transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6f7978" strokeWidth="1.75">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <span className="text-sm text-[#6f7978]">Seleccionar archivo…</span>
            <input
              ref={fileRef}
              id="evidencia"
              name="evidencia"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        ) : (
          <div className="relative">
            {preview === 'pdf' ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14,2 14,8 20,8"/>
                </svg>
                <span className="text-sm text-[#3f4948] font-medium">PDF seleccionado</span>
              </div>
            ) : (
              <img
                src={preview}
                alt="Preview"
                className="w-full max-h-48 object-cover rounded-xl border border-[#bec9c8]"
              />
            )}
            <button
              type="button"
              onClick={limpiarArchivo}
              className="absolute top-2 right-2 w-7 h-7 bg-white border border-[#bec9c8] rounded-full flex items-center justify-center text-[#6f7978] hover:text-[#ba1a1a] hover:border-[#ba1a1a] transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
            {/* Mantener el input con el archivo seleccionado */}
            <input
              ref={fileRef}
              id="evidencia"
              name="evidencia"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={handleFile}
              className="hidden"
            />
          </div>
        )}

        {fileError && (
          <p className="text-xs text-[#ba1a1a] mt-1">{fileError}</p>
        )}
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || !!fileError}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Creando...' : 'Crear llamado'}
        </button>
      </div>
    </form>
  )
}
