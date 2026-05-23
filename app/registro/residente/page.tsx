'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { registrarResidente } from '@/app/actions/onboarding'

export default function RegistroResidentePage() {
  const [state, action, pending] = useActionState(registrarResidente, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#f5f3f3] border border-[#bec9c8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#08605f" strokeWidth="1.5">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#1b1c1c]">
            Registro de residente
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">
            Crea tu cuenta para acceder al conjunto
          </p>
        </div>

        <div className="bg-white border border-[#bec9c8] rounded-2xl p-6 sm:p-7">
          <form action={action} className="flex flex-col gap-4">

            {/* Datos personales */}
            <fieldset className="border border-[#bec9c8] rounded-xl p-4 flex flex-col gap-4">
              <legend className="px-2 text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
                Tu cuenta
              </legend>

              <div>
                <label htmlFor="nombre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Nombre completo <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  required
                  placeholder="María García"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="maria@ejemplo.com"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Contraseña <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  placeholder="Mínimo 6 caracteres"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>
            </fieldset>

            {/* Datos del conjunto y apartamento */}
            <fieldset className="border border-[#bec9c8] rounded-xl p-4 flex flex-col gap-4">
              <legend className="px-2 text-xs font-semibold text-[#3f4948] uppercase tracking-wide">
                Tu apartamento
              </legend>

              <div>
                <label htmlFor="conjunto_id" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  ID del conjunto <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="conjunto_id"
                  name="conjunto_id"
                  type="text"
                  required
                  placeholder="El administrador te lo proporciona"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="numero" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                    N° Apartamento <span className="text-[#ba1a1a]">*</span>
                  </label>
                  <input
                    id="numero"
                    name="numero"
                    type="text"
                    required
                    placeholder="101"
                    className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="torre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                    Torre
                  </label>
                  <input
                    id="torre"
                    name="torre"
                    type="text"
                    placeholder="A (si aplica)"
                    className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                  />
                </div>
              </div>

              <p className="text-xs text-[#6f7978]">
                Solo se permite un residente por apartamento. Si el apartamento ya tiene residente asignado, contacta al administrador.
              </p>
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
              {pending ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-[#3f4948] mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/login" className="text-[#004746] font-semibold hover:underline">
            Ingresar
          </Link>
        </p>
      </div>
    </div>
  )
}
