'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registrar } from '@/app/actions/onboarding'

export default function RegistroPage() {
  const [state, action, pending] = useActionState(registrar, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#08605f" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#1b1c1c]">
            Crear tu conjunto
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">
            Configura Habitu para tu conjunto residencial
          </p>
        </div>

        {/* Form */}
        <div className="bg-white border border-[#bec9c8] rounded-2xl p-7">
          <form action={action} className="flex flex-col gap-4">

            <fieldset className="border border-[#bec9c8] rounded-xl p-4 flex flex-col gap-4">
              <legend className="px-2 text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
                Tu cuenta
              </legend>

              <div>
                <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Nombre completo
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  placeholder="Carlos Mejía"
                  className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="carlos@ejemplo.com"
                  className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Contraseña
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>
            </fieldset>

            <fieldset className="border border-[#bec9c8] rounded-xl p-4">
              <legend className="px-2 text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
                Tu conjunto
              </legend>
              <div className="mt-2">
                <label htmlFor="nombre_conjunto" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Nombre del conjunto
                </label>
                <input
                  id="nombre_conjunto"
                  name="nombre_conjunto"
                  type="text"
                  required
                  placeholder="Torres del Parque"
                  className="w-full h-11 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-sm text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>
            </fieldset>

            {state?.error && (
              <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-xl px-4 py-3">
                <p className="text-sm text-[#ba1a1a]">{state.error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[family-name:var(--font-outfit)] mt-1"
            >
              {pending ? 'Creando conjunto...' : 'Crear conjunto'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#3f4948] mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#004746] font-semibold hover:underline">
            Ingresar
          </Link>
        </p>

        <p className="text-center text-xs text-[#6f7978] mt-6">
          Al registrarte serás el administrador del conjunto.
        </p>
      </div>
    </div>
  )
}
