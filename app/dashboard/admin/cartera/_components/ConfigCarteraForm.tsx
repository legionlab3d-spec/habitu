'use client'

import { useActionState, useState } from 'react'
import { actualizarConfigCartera } from '@/app/actions/cartera'
import type { ConfigCartera } from '@/src/services/cartera'

export default function ConfigCarteraForm({ config }: { config: ConfigCartera | null }) {
  const [state, action, pending] = useActionState(actualizarConfigCartera, undefined)
  const [moraActiva, setMoraActiva] = useState(config?.mora_automatica ?? false)

  return (
    <form action={action} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="valor_cuota_mensual" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Cuota por defecto ($)
          </label>
          <input
            id="valor_cuota_mensual"
            name="valor_cuota_mensual"
            type="number"
            min="0"
            step="1000"
            defaultValue={config?.valor_cuota_mensual ?? 0}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
          <p className="text-[11px] text-[#6f7978] mt-1">Aplica a apartamentos sin cuota individual</p>
        </div>
        <div>
          <label htmlFor="dia_limite_pago" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Día límite pago
          </label>
          <input
            id="dia_limite_pago"
            name="dia_limite_pago"
            type="number"
            min="1"
            max="31"
            defaultValue={config?.dia_limite_pago ?? 10}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-[#f5f3f3] rounded-xl p-4 flex flex-col gap-3">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <input
            name="mora_automatica"
            type="checkbox"
            defaultChecked={config?.mora_automatica ?? false}
            onChange={(e) => setMoraActiva(e.target.checked)}
            className="w-4 h-4 rounded border-[#bec9c8] accent-[#004746]"
          />
          <span className="text-sm font-medium text-[#1b1c1c]">Aplicar mora automática</span>
        </label>

        {moraActiva && (
          <div>
            <label htmlFor="porcentaje_mora" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
              Porcentaje de mora (%)
            </label>
            <input
              id="porcentaje_mora"
              name="porcentaje_mora"
              type="number"
              min="0"
              max="100"
              step="0.5"
              defaultValue={config?.porcentaje_mora ?? 0}
              className="w-full h-10 px-3 bg-white border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="link_pse" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Link PSE / Pago online
          </label>
          <input
            id="link_pse"
            name="link_pse"
            type="url"
            placeholder="https://..."
            defaultValue={config?.link_pse ?? ''}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
        <div>
          <label htmlFor="link_banco" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
            Link banco / cuenta
          </label>
          <input
            id="link_banco"
            name="link_banco"
            type="text"
            placeholder="Nequi, Daviplata, cuenta..."
            defaultValue={config?.link_banco ?? ''}
            className="w-full h-10 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label htmlFor="instrucciones_pago" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
          Instrucciones de pago
        </label>
        <textarea
          id="instrucciones_pago"
          name="instrucciones_pago"
          rows={3}
          placeholder="Ej: Transferir a cuenta Bancolombia 123-456789-00, NIT 900..."
          defaultValue={config?.instrucciones_pago ?? ''}
          className="w-full px-3 py-2.5 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent resize-none"
        />
      </div>

      {state?.error && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-sm text-[#2f9e44] bg-[#d3f9d8] px-3 py-2 rounded-xl">Configuración guardada</p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {pending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
    </form>
  )
}
