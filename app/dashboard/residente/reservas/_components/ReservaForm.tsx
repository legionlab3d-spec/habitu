'use client'

import { useActionState, useState } from 'react'
import { crearReserva } from '@/app/actions/reservas'
import type { ZonaComun } from '@/src/services/zonas'

interface Props {
  zonas: ZonaComun[]
}

export default function ReservaForm({ zonas }: Props) {
  const [state, action, pending] = useActionState(crearReserva, undefined)
  const [zonaSeleccionada, setZonaSeleccionada] = useState<ZonaComun | null>(zonas[0] ?? null)
  const [duracion, setDuracion] = useState(1)

  const precioPorHora = zonaSeleccionada?.precio_por_hora ?? 0
  const valorTotal = precioPorHora * duracion

  const today = new Date().toISOString().split('T')[0]

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="precio_por_hora" value={precioPorHora} />

      <div>
        <label htmlFor="zona_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Zona <span className="text-[#ba1a1a]">*</span>
        </label>
        <select
          id="zona_id"
          name="zona_id"
          required
          onChange={(e) => {
            const zona = zonas.find(z => z.id === e.target.value) ?? null
            setZonaSeleccionada(zona)
          }}
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        >
          {zonas.map((z) => (
            <option key={z.id} value={z.id}>{z.nombre}</option>
          ))}
        </select>
        {zonaSeleccionada && (
          <p className="text-[11px] text-[#6f7978] mt-1">
            {zonaSeleccionada.capacidad ? `Capacidad: ${zonaSeleccionada.capacidad} personas · ` : ''}
            {precioPorHora === 0 ? 'Gratis' : `$${precioPorHora.toLocaleString('es-CO')}/hora`}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="fecha" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Fecha <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="fecha"
            name="fecha"
            type="date"
            required
            min={today}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>

        <div>
          <label htmlFor="hora_inicio" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Hora inicio <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="hora_inicio"
            name="hora_inicio"
            type="time"
            required
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="duracion_horas" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Duración
        </label>
        <select
          id="duracion_horas"
          name="duracion_horas"
          value={duracion}
          onChange={(e) => setDuracion(parseInt(e.target.value, 10))}
          className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
        >
          {[1, 2, 3, 4, 5, 6].map((h) => (
            <option key={h} value={h}>{h} hora{h !== 1 ? 's' : ''}</option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="observaciones" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Observaciones
        </label>
        <textarea
          id="observaciones"
          name="observaciones"
          rows={2}
          placeholder="Motivo o notas adicionales (opcional)"
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      {precioPorHora > 0 && (
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-xl px-4 py-3 flex items-center justify-between">
          <span className="text-xs text-[#3f4948] font-medium">Valor estimado</span>
          <span className="text-sm font-semibold text-[#1b1c1c]">${valorTotal.toLocaleString('es-CO')}</span>
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || zonas.length === 0}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Reservando...' : 'Solicitar reserva'}
        </button>
      </div>
    </form>
  )
}
