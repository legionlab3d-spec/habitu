'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registrarResidente } from '@/app/actions/onboarding'

export default function RegistroResidentePage() {
  const [state, action, pending] = useActionState(registrarResidente, undefined)
  const [tipo, setTipo] = useState<'propietario' | 'residente'>('propietario')

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
            Crear cuenta
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">
            Accede al portal de tu conjunto residencial
          </p>
        </div>

        <div className="bg-white border border-[#bec9c8] rounded-2xl p-6 sm:p-7">
          <form action={action} className="flex flex-col gap-4">

            {/* Tipo de cuenta */}
            <div>
              <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-2">
                ¿Cuál es tu relación con el apartamento?
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipo('propietario')}
                  className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors text-sm font-semibold ${
                    tipo === 'propietario'
                      ? 'border-[#004746] bg-[#e8f3f3] text-[#004746]'
                      : 'border-[#bec9c8] bg-[#f5f3f3] text-[#6f7978]'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                    <polyline points="9,22 9,12 15,12 15,22"/>
                  </svg>
                  Propietario
                </button>
                <button
                  type="button"
                  onClick={() => setTipo('residente')}
                  className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-colors text-sm font-semibold ${
                    tipo === 'residente'
                      ? 'border-[#004746] bg-[#e8f3f3] text-[#004746]'
                      : 'border-[#bec9c8] bg-[#f5f3f3] text-[#6f7978]'
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                  Arrendatario
                </button>
              </div>
              <input type="hidden" name="tipo_cuenta" value={tipo} />
              <p className="text-xs text-[#6f7978] mt-1.5">
                {tipo === 'propietario'
                  ? 'Eres dueño del inmueble. Tendrás acceso completo a la información del apartamento.'
                  : 'Vives en arriendo. Tu cuenta estará vinculada al apartamento del propietario.'}
              </p>
            </div>

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
                  id="nombre" name="nombre" type="text" required
                  placeholder="María García"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Email <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="email" name="email" type="email" required autoComplete="email"
                  placeholder="maria@ejemplo.com"
                  className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                  Contraseña <span className="text-[#ba1a1a]">*</span>
                </label>
                <input
                  id="password" name="password" type="password" required autoComplete="new-password"
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
                  id="conjunto_id" name="conjunto_id" type="text" required
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
                    id="numero" name="numero" type="text" required
                    placeholder="101"
                    className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="torre" className="block text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-1.5">
                    Torre
                  </label>
                  <input
                    id="torre" name="torre" type="text"
                    placeholder="A (si aplica)"
                    className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
                  />
                </div>
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
