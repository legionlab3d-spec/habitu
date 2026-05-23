'use client'

import { useActionState, useState } from 'react'
import { registrarVisitante } from '@/app/actions/visitantes'

const TIPOS = [
  { value: 'persona',  label: 'Persona' },
  { value: 'vehiculo', label: 'Vehículo' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'servicio', label: 'Servicio técnico' },
]

const TIPOS_VEHICULO = [
  { value: 'carro', label: 'Carro' },
  { value: 'moto',  label: 'Moto' },
]

const INPUT = 'w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent'
const SELECT = 'w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent'
const LABEL = 'block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5'

export default function AutorizarVisitanteForm({ apartamentoId }: { apartamentoId: string }) {
  const [state, action, pending] = useActionState(registrarVisitante, undefined)
  const [tipoVisita, setTipoVisita] = useState('persona')
  const [parqTipo, setParqTipo] = useState('ninguno')
  const hoy = new Date().toISOString().split('T')[0]

  if (state?.ok) {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-5 text-center">
        <p className="text-sm font-semibold text-[#2f9e44]">Visitante autorizado correctamente</p>
        <p className="text-xs text-[#3f4948] mt-1">La portería ya puede registrar su ingreso.</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-xs text-[#2f9e44] underline">
          Autorizar otro
        </button>
      </div>
    )
  }

  const esVehiculo = tipoVisita === 'vehiculo'

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="apartamento_id" value={apartamentoId} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="nombre" className={LABEL}>
            Nombre <span className="text-[#ba1a1a]">*</span>
          </label>
          <input
            id="nombre" name="nombre" type="text" required
            placeholder="Nombre del visitante"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="tipo_visita" className={LABEL}>Tipo</label>
          <select
            id="tipo_visita" name="tipo_visita"
            value={tipoVisita}
            onChange={(e) => { setTipoVisita(e.target.value); setParqTipo('ninguno') }}
            className={SELECT}
          >
            {TIPOS.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="documento" className={LABEL}>Documento</label>
          <input
            id="documento" name="documento" type="text"
            placeholder="Cédula / pasaporte"
            className={INPUT}
          />
        </div>
        <div>
          <label htmlFor="fecha_expiracion" className={LABEL}>Válido hasta</label>
          <input
            id="fecha_expiracion" name="fecha_expiracion" type="date"
            min={hoy}
            className={INPUT}
          />
        </div>
      </div>

      {/* Sección vehículo — visible solo cuando tipo_visita = vehiculo */}
      {esVehiculo && (
        <div className="border border-[#bec9c8] rounded-2xl p-4 flex flex-col gap-3 bg-[#f5f3f3]/40">
          <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide">Datos del vehículo</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label htmlFor="placa_vehiculo" className={LABEL}>
                Placa <span className="text-[#ba1a1a]">*</span>
              </label>
              <input
                id="placa_vehiculo" name="placa_vehiculo" type="text"
                placeholder="ABC123"
                className={`${INPUT} uppercase`}
              />
            </div>
            <div>
              <label htmlFor="tipo_vehiculo_visitante" className={LABEL}>Tipo vehículo</label>
              <select
                id="tipo_vehiculo_visitante" name="tipo_vehiculo_visitante"
                className={SELECT}
              >
                {TIPOS_VEHICULO.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="color_vehiculo_visitante" className={LABEL}>Color</label>
              <input
                id="color_vehiculo_visitante" name="color_vehiculo_visitante" type="text"
                placeholder="Blanco (opcional)"
                className={INPUT}
              />
            </div>
          </div>

          {/* Opciones de parqueadero */}
          <div>
            <p className={LABEL}>Parqueadero</p>
            <div className="flex flex-col gap-2">
              {[
                { value: 'ninguno',    label: 'Sin parqueadero' },
                { value: 'propio',     label: 'Ceder mi parqueadero' },
                { value: 'visitantes', label: 'Requiere parqueadero visitantes' },
              ].map((op) => (
                <label key={op.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="parqueadero_tipo"
                    value={op.value}
                    checked={parqTipo === op.value}
                    onChange={() => setParqTipo(op.value)}
                    className="accent-[#004746]"
                  />
                  <span className="text-sm text-[#1b1c1c]">{op.label}</span>
                </label>
              ))}
            </div>
            {parqTipo === 'propio' && (
              <p className="text-[11px] text-[#6f7978] mt-1.5">
                Se verificará que tengas parqueadero asignado al guardar.
              </p>
            )}
          </div>
        </div>
      )}

      <div>
        <label htmlFor="observaciones" className={LABEL}>Observaciones</label>
        <input
          id="observaciones" name="observaciones" type="text"
          placeholder="Motivo de la visita (opcional)"
          className={INPUT}
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
          {pending ? 'Autorizando...' : 'Autorizar visitante'}
        </button>
      </div>
    </form>
  )
}
