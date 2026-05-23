'use client'

import { useActionState } from 'react'
import { reportarPago } from '@/app/actions/cartera'

const METODOS = [
  { value: 'transferencia', label: 'Transferencia bancaria' },
  { value: 'pse',           label: 'PSE' },
  { value: 'nequi',         label: 'Nequi' },
  { value: 'daviplata',     label: 'Daviplata' },
  { value: 'efectivo',      label: 'Efectivo en portería' },
  { value: 'otro',          label: 'Otro' },
]

export default function ReportarPagoForm({
  estadoCuentaId,
  valorTotal,
}: {
  estadoCuentaId: string
  valorTotal: number
}) {
  const [state, action, pending] = useActionState(reportarPago, undefined)
  const hoy = new Date().toISOString().split('T')[0]

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Pago reportado correctamente</p>
        <p className="text-xs text-[#3f4948] mt-1">El administrador verificará tu pago pronto.</p>
      </div>
    )
  }

  return (
    <form action={action} className="flex flex-col gap-4" encType="multipart/form-data">
      <input type="hidden" name="estado_cuenta_id" value={estadoCuentaId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="monto" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Monto pagado <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="monto"
            name="monto"
            type="number"
            min="1"
            step="1000"
            required
            defaultValue={valorTotal}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="fecha_pago" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Fecha de pago <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="fecha_pago"
            name="fecha_pago"
            type="date"
            required
            defaultValue={hoy}
            max={hoy}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="metodo" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Método de pago
        </label>
        <select
          id="metodo"
          name="metodo"
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        >
          {METODOS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="referencia" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Número de referencia / transacción
        </label>
        <input
          id="referencia"
          name="referencia"
          type="text"
          placeholder="Ej: 2025051234567"
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        />
      </div>

      <div>
        <label htmlFor="comprobante" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Comprobante (imagen o PDF)
        </label>
        <input
          id="comprobante"
          name="comprobante"
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="w-full text-sm text-[#3f4948] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#f5f3f3] file:text-[#004746] hover:file:bg-[#bec9c8] cursor-pointer"
        />
      </div>

      <div>
        <label htmlFor="notas" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Notas adicionales
        </label>
        <textarea
          id="notas"
          name="notas"
          rows={2}
          placeholder="Información adicional (opcional)"
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
          {pending ? 'Enviando...' : 'Reportar pago'}
        </button>
      </div>
    </form>
  )
}
