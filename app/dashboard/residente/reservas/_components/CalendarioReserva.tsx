'use client'

import { useActionState, useState, useMemo } from 'react'
import { crearReserva } from '@/app/actions/reservas'
import type { ZonaComun } from '@/src/services/zonas'
import type { ReservaActiva } from '@/src/services/reservas'

interface Props {
  zonas: ZonaComun[]
  reservasActivas: ReservaActiva[]
  tieneMora: boolean
}

const HORAS = Array.from({ length: 15 }, (_, i) => i + 7) // 7:00 – 21:00

function padH(h: number) {
  return `${String(h).padStart(2, '0')}:00`
}

export default function CalendarioReserva({ zonas, reservasActivas, tieneMora }: Props) {
  const [state, action, pending] = useActionState(crearReserva, undefined)
  const [zonaId, setZonaId] = useState(zonas[0]?.id ?? '')
  const [fecha, setFecha] = useState('')
  const [slotInicio, setSlotInicio] = useState<number | null>(null)
  const [duracion, setDuracion] = useState(1)

  const zona = zonas.find((z) => z.id === zonaId) ?? null
  const today = new Date().toISOString().split('T')[0]
  const ahora = new Date().toISOString()

  // Horas bloqueadas para zona+fecha seleccionada
  const horasBloqueadas = useMemo(() => {
    if (!fecha) return new Set<number>()
    const activas = reservasActivas.filter((r) => {
      if (r.zona_id !== zonaId || r.fecha !== fecha) return false
      if (r.estado === 'pendiente_pago' && r.pago_expira_en && r.pago_expira_en < ahora) return false
      return true
    })
    const bloqueadas = new Set<number>()
    for (const r of activas) {
      const inicio = parseInt(r.hora_inicio.split(':')[0], 10)
      const fin = parseInt(r.hora_fin.split(':')[0], 10)
      for (let h = inicio; h < fin; h++) bloqueadas.add(h)
    }
    return bloqueadas
  }, [reservasActivas, zonaId, fecha, ahora])

  function rangoDisponible(inicio: number, dur: number): boolean {
    for (let h = inicio; h < inicio + dur; h++) {
      if (h > 21 || horasBloqueadas.has(h)) return false
    }
    return true
  }

  const horaInicio = slotInicio !== null ? padH(slotInicio) : ''
  const horaFin = slotInicio !== null ? padH(slotInicio + duracion) : ''
  const valorTotal = (zona?.precio_por_hora ?? 0) * duracion
  const seleccionValida = slotInicio !== null && fecha && rangoDisponible(slotInicio, duracion)

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="zona_id" value={zonaId} />
      <input type="hidden" name="fecha" value={fecha} />
      <input type="hidden" name="hora_inicio" value={horaInicio} />
      <input type="hidden" name="duracion_horas" value={duracion} />
      <input type="hidden" name="precio_por_hora" value={zona?.precio_por_hora ?? 0} />

      {tieneMora && (
        <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
          <p className="text-sm font-semibold text-[#ba1a1a]">Reservas bloqueadas</p>
          <p className="text-xs text-[#ba1a1a] mt-0.5">
            Póngase al día con el pago de la administración para completar esta reserva.
          </p>
        </div>
      )}

      {/* Paso 1 — Zona */}
      <div>
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-2">
          1. Selecciona la zona
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {zonas.map((z) => (
            <button
              key={z.id}
              type="button"
              disabled={tieneMora}
              onClick={() => { setZonaId(z.id); setSlotInicio(null) }}
              className={`text-left px-4 py-3 rounded-xl border-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                zonaId === z.id
                  ? 'border-[#004746] bg-[#e8f3f3]'
                  : 'border-[#bec9c8] bg-[#f5f3f3] hover:border-[#004746]'
              }`}
            >
              <p className="text-sm font-semibold text-[#1b1c1c]">{z.nombre}</p>
              <p className="text-xs text-[#6f7978] mt-0.5">
                {z.capacidad ? `${z.capacidad} personas · ` : ''}
                {z.precio_por_hora === 0 ? 'Gratis' : `$${z.precio_por_hora.toLocaleString('es-CO')}/h`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Paso 2 — Fecha */}
      <div>
        <label htmlFor="fecha-sel" className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-2 block">
          2. Selecciona la fecha
        </label>
        <input
          id="fecha-sel"
          type="date"
          min={today}
          value={fecha}
          disabled={tieneMora}
          onChange={(e) => { setFecha(e.target.value); setSlotInicio(null) }}
          className="w-full sm:w-48 h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent disabled:opacity-40"
        />
      </div>

      {/* Paso 3 — Horario */}
      {fecha && (
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
              3. Elige el horario
            </p>
            <div className="flex items-center gap-3 text-[10px] text-[#6f7978]">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#004746] inline-block" /> Seleccionado
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-white border border-[#bec9c8] inline-block" /> Libre
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded bg-[#efeded] inline-block" /> Ocupado
              </span>
            </div>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-1.5">
            {HORAS.map((h) => {
              const bloqueado = horasBloqueadas.has(h)
              const seleccionado = slotInicio !== null && h >= slotInicio && h < slotInicio + duracion
              return (
                <button
                  key={h}
                  type="button"
                  disabled={bloqueado || tieneMora}
                  onClick={() => setSlotInicio(h === slotInicio ? null : h)}
                  className={`h-10 rounded-xl text-xs font-medium border transition-colors ${
                    seleccionado
                      ? 'bg-[#004746] border-[#004746] text-white'
                      : bloqueado
                      ? 'bg-[#efeded] border-[#efeded] text-[#bec9c8] cursor-not-allowed'
                      : 'bg-white border-[#bec9c8] text-[#3f4948] hover:border-[#004746] hover:bg-[#e8f3f3]'
                  }`}
                >
                  {padH(h)}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Paso 4 — Duración */}
      {slotInicio !== null && fecha && (
        <div>
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-2">
            4. Duración
          </p>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4].map((h) => {
              const ok = rangoDisponible(slotInicio, h)
              return (
                <button
                  key={h}
                  type="button"
                  disabled={!ok}
                  onClick={() => setDuracion(h)}
                  className={`h-9 px-4 rounded-xl border text-sm font-semibold transition-colors ${
                    duracion === h && ok
                      ? 'bg-[#004746] border-[#004746] text-white'
                      : ok
                      ? 'bg-white border-[#bec9c8] text-[#3f4948] hover:border-[#004746]'
                      : 'bg-[#efeded] border-[#efeded] text-[#bec9c8] cursor-not-allowed'
                  }`}
                >
                  {h}h
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Resumen */}
      {seleccionValida && (
        <div className="bg-[#e8f3f3] border border-[#004746]/20 rounded-xl px-4 py-4">
          <p className="text-[10px] font-semibold text-[#004746] uppercase tracking-wide mb-2">Resumen de tu reserva</p>
          <p className="text-sm font-bold text-[#1b1c1c]">{zona?.nombre}</p>
          <p className="text-xs text-[#3f4948] mt-1">
            {new Date(fecha + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-xs text-[#3f4948]">{horaInicio} – {horaFin} · {duracion}h</p>
          <p className="text-sm font-bold text-[#1b1c1c] mt-2">
            {valorTotal === 0 ? 'Gratis' : `$${valorTotal.toLocaleString('es-CO')}`}
          </p>
          {valorTotal > 0 && (
            <p className="text-[11px] text-[#6f7978] mt-1">
              Tendrás 10 minutos para completar el pago después de confirmar.
            </p>
          )}
        </div>
      )}

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending || tieneMora || !seleccionValida}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Reservando...' : 'Confirmar reserva'}
        </button>
      </div>
    </form>
  )
}
