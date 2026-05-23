'use client'

import { useActionState } from 'react'
import { completarPerfil } from '@/app/actions/onboarding'

export default function RegistroCompletarPage() {
  const [state, action, pending] = useActionState(completarPerfil, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#1b1c1c]">
            Completa tu perfil
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">
            Necesitamos algunos datos para continuar
          </p>
        </div>

        <div className="bg-white border border-[#bec9c8] rounded-2xl p-7">
          <form action={action} className="flex flex-col gap-4">
            <div>
              <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                Nombre completo
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                required
                placeholder="Tu nombre"
                className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="conjunto_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                ID del conjunto
              </label>
              <input
                id="conjunto_id"
                name="conjunto_id"
                type="text"
                required
                placeholder="UUID del conjunto"
                className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
              />
              <p className="text-xs text-[#6f7978] mt-1">
                El administrador de tu conjunto te debe proporcionar este dato.
              </p>
            </div>

            {state?.error && (
              <div className="bg-[#ffdad6] rounded-xl px-4 py-3">
                <p className="text-sm text-[#ba1a1a]">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[family-name:var(--font-outfit)] mt-1"
            >
              {pending ? 'Guardando...' : 'Completar perfil'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
