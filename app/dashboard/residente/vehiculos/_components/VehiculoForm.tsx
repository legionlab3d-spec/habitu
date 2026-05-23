'use client'

import { useActionState, useRef, useState } from 'react'
import { registrarVehiculo } from '@/app/actions/vehiculos'

const TIPOS = [
  { value: 'carro',     label: 'Carro' },
  { value: 'moto',      label: 'Moto' },
  { value: 'bicicleta', label: 'Bicicleta' },
  { value: 'otro',      label: 'Otro' },
]

const MAX_SIZE = 5 * 1024 * 1024
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']

const INPUT = 'w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent'
const LABEL = 'block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5'

type DocPreview = { name: string; isImage: boolean; url: string | null }

function FileField({
  name,
  label,
}: {
  name: string
  label: string
}) {
  const [preview, setPreview] = useState<DocPreview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const ref = useRef<HTMLInputElement>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    setPreview(null); setErr(null)
    if (!file) return
    if (file.size > MAX_SIZE) { setErr('Máx. 5 MB'); e.target.value = ''; return }
    if (!ALLOWED.includes(file.type)) { setErr('Solo JPG, PNG, WebP o PDF'); e.target.value = ''; return }

    const isImage = file.type.startsWith('image/')
    if (isImage) {
      const reader = new FileReader()
      reader.onload = () => setPreview({ name: file.name, isImage: true, url: reader.result as string })
      reader.readAsDataURL(file)
    } else {
      setPreview({ name: file.name, isImage: false, url: null })
    }
  }

  function limpiar() {
    setPreview(null); setErr(null)
    if (ref.current) ref.current.value = ''
  }

  return (
    <div>
      <p className={LABEL}>{label} <span className="text-[#6f7978] normal-case font-normal">(JPG, PDF · máx. 5 MB)</span></p>
      {!preview ? (
        <label className="flex items-center gap-3 w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl cursor-pointer hover:bg-[#efeded] transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6f7978" strokeWidth="1.75">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17,8 12,3 7,8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
          <span className="text-sm text-[#6f7978]">Seleccionar…</span>
          <input ref={ref} name={name} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleChange} className="hidden" />
        </label>
      ) : (
        <div className="relative">
          {preview.isImage && preview.url ? (
            <img src={preview.url} alt="preview" className="w-full max-h-32 object-cover rounded-xl border border-[#bec9c8]" />
          ) : (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
              </svg>
              <span className="text-sm text-[#3f4948] truncate">{preview.name}</span>
            </div>
          )}
          <button type="button" onClick={limpiar}
            className="absolute top-1.5 right-1.5 w-6 h-6 bg-white border border-[#bec9c8] rounded-full flex items-center justify-center text-[#6f7978] hover:text-[#ba1a1a] hover:border-[#ba1a1a] transition-colors">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <input ref={ref} name={name} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleChange} className="hidden" />
        </div>
      )}
      {err && <p className="text-[11px] text-[#ba1a1a] mt-1">{err}</p>}
    </div>
  )
}

export default function VehiculoForm({ apartamentoId }: { apartamentoId: string | null }) {
  const [state, action, pending] = useActionState(registrarVehiculo, undefined)

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Vehículo registrado — pendiente aprobación</p>
        <p className="text-xs text-[#3f4948] mt-1">El administrador revisará los documentos y aprobará el registro.</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Registrar otro
        </button>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      {apartamentoId && <input type="hidden" name="apartamento_id" value={apartamentoId} />}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="placa" className={LABEL}>
            Placa <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="placa" name="placa" type="text" required
            placeholder="ABC123"
            className={`${INPUT} uppercase`}
          />
        </div>
        <div>
          <label htmlFor="tipo" className={LABEL}>Tipo</label>
          <select id="tipo" name="tipo"
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent">
            {TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label htmlFor="marca" className={LABEL}>Marca</label>
          <input id="marca" name="marca" type="text" placeholder="Toyota" className={INPUT} />
        </div>
        <div>
          <label htmlFor="modelo" className={LABEL}>Modelo</label>
          <input id="modelo" name="modelo" type="text" placeholder="Corolla" className={INPUT} />
        </div>
        <div>
          <label htmlFor="color" className={LABEL}>Color</label>
          <input id="color" name="color" type="text" placeholder="Blanco" className={INPUT} />
        </div>
      </div>

      {/* Documentos opcionales */}
      <div className="border border-[#bec9c8] rounded-2xl p-4 flex flex-col gap-3 bg-[#f5f3f3]/40">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
          Documentos <span className="text-[#6f7978] normal-case font-normal">(opcional, agiliza la aprobación)</span>
        </p>
        <FileField name="doc_soat" label="SOAT" />
        <FileField name="doc_tarjeta_propiedad" label="Tarjeta de propiedad" />
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit" disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Registrando...' : 'Registrar vehículo'}
        </button>
      </div>
    </form>
  )
}
