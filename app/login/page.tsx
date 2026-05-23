'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { login } from '@/app/actions/auth'

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, undefined)

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f8] px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#004746] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9,22 9,12 15,12 15,22"/>
            </svg>
          </div>
          <h1 className="font-[family-name:var(--font-outfit)] text-2xl font-bold text-[#1b1c1c]">
            Habitu
          </h1>
          <p className="text-sm text-[#3f4948] mt-1">Ingresa a tu cuenta</p>
        </div>

        <div className="bg-white border border-[#bec9c8] rounded-2xl p-6 sm:p-7">
          <form action={action} className="flex flex-col gap-4">
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
                placeholder="tu@email.com"
                className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
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
                autoComplete="current-password"
                placeholder="Tu contraseña"
                className="w-full h-12 px-3 bg-[#f5f3f3] border border-[#bec9c8] rounded-xl text-base text-[#1b1c1c] placeholder-[#6f7978] focus:outline-none focus:ring-2 focus:ring-[#004746] focus:border-transparent"
              />
            </div>

            {state?.error && (
              <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">
                {state.error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="w-full h-12 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[family-name:var(--font-outfit)] mt-1"
            >
              {pending ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <div className="mt-4 flex flex-col gap-1.5 text-center text-sm text-[#3f4948]">
          <p>
            ¿Eres administrador?{' '}
            <Link href="/registro" className="text-[#004746] font-semibold hover:underline">
              Crear conjunto
            </Link>
          </p>
          <p>
            ¿Eres residente?{' '}
            <Link href="/registro/residente" className="text-[#004746] font-semibold hover:underline">
              Registrarse
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
