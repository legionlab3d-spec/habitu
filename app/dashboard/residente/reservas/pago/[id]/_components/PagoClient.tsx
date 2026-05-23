'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import ContadorRegresivo from '../../../_components/ContadorRegresivo'
import { confirmarPago, expirarReserva, cancelarReserva } from '@/app/actions/reservas'

interface Props {
  reservaId: string
  zona: string
  fecha: string
  horaInicio: string
  horaFin: string
  valorTotal: number
  expiresAt: string
}

function formatFecha(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function PagoClient({ reservaId, zona, fecha, horaInicio, horaFin, valorTotal, expiresAt }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [estado, setEstado] = useState<'pendiente' | 'confirmado' | 'expirado' | 'error'>('pendiente')
  const [errorMsg, setErrorMsg] = useState('')

  const handleExpire = useCallback(() => {
    setEstado('expirado')
    startTransition(() => expirarReserva(reservaId))
  }, [reservaId])

  function handlePagar() {
    startTransition(async () => {
      const result = await confirmarPago(reservaId)
      if (result?.ok) {
        setEstado('confirmado')
      } else {
        setErrorMsg(result?.error ?? 'Error al confirmar el pago.')
        setEstado('error')
      }
    })
  }

  function handleCancelar() {
    startTransition(async () => {
      await cancelarReserva(reservaId)
      router.push('/dashboard/residente/reservas')
    })
  }

  // ── Confirmado ──────────────────────────────────────────────────
  if (estado === 'confirmado') {
    return (
      <div className="bg-[#d3f9d8] border border-[#2f9e44]/20 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#2f9e44]/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2f9e44" strokeWidth="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </div>
        <p className="text-lg font-bold text-[#2f9e44] font-[family-name:var(--font-outfit)]">¡Reserva confirmada!</p>
        <p className="text-sm text-[#2f9e44] mt-1">{zona} · {horaInicio.slice(0,5)}–{horaFin.slice(0,5)}</p>
        <button
          onClick={() => router.push('/dashboard/residente/reservas')}
          className="mt-4 h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Ver mis reservas
        </button>
      </div>
    )
  }

  // ── Expirado ────────────────────────────────────────────────────
  if (estado === 'expirado') {
    return (
      <div className="bg-[#ffdad6] border border-[#ba1a1a]/20 rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#ba1a1a]/10 flex items-center justify-center mx-auto mb-4">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>
        <p className="text-lg font-bold text-[#ba1a1a] font-[family-name:var(--font-outfit)]">Tiempo agotado</p>
        <p className="text-sm text-[#ba1a1a] mt-1">Tu reserva expiró. El horario volvió a estar disponible.</p>
        <button
          onClick={() => router.push('/dashboard/residente/reservas')}
          className="mt-4 h-10 px-6 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Hacer otra reserva
        </button>
      </div>
    )
  }

  // ── Pendiente pago ──────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Contador */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5 text-center">
        <p className="text-xs font-semibold text-[#6f7978] uppercase tracking-wide mb-2">
          Tiempo para completar el pago
        </p>
        <div className="text-5xl mb-1">
          <ContadorRegresivo expiresAt={expiresAt} onExpire={handleExpire} />
        </div>
        <p className="text-xs text-[#6f7978]">Si no pagas a tiempo, la reserva se libera automáticamente.</p>
      </div>

      {/* Detalle reserva */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-3">Detalle de la reserva</p>
        <div className="flex flex-col gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-[#6f7978]">Zona</span>
            <span className="font-semibold text-[#1b1c1c]">{zona}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6f7978]">Fecha</span>
            <span className="font-semibold text-[#1b1c1c] text-right capitalize">{formatFecha(fecha)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6f7978]">Horario</span>
            <span className="font-semibold text-[#1b1c1c]">{horaInicio.slice(0,5)} – {horaFin.slice(0,5)}</span>
          </div>
          <div className="border-t border-[#efeded] pt-2 flex justify-between">
            <span className="font-semibold text-[#3f4948]">Total</span>
            <span className="text-lg font-bold text-[#1b1c1c]">
              {valorTotal === 0 ? 'Gratis' : `$${valorTotal.toLocaleString('es-CO')}`}
            </span>
          </div>
        </div>
      </div>

      {/* Métodos de pago (MVP simulado) */}
      <div className="bg-white border border-[#bec9c8] rounded-2xl p-5">
        <p className="text-xs font-semibold text-[#3f4948] uppercase tracking-wide mb-3">Método de pago</p>
        <div className="bg-[#f5f3f3] border border-[#bec9c8] rounded-xl px-4 py-3 flex items-center gap-3">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#004746" strokeWidth="1.75">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="2" y1="10" x2="22" y2="10"/>
          </svg>
          <div>
            <p className="text-sm font-semibold text-[#1b1c1c]">Transferencia / PSE</p>
            <p className="text-xs text-[#6f7978]">Pago simulado — MVP</p>
          </div>
        </div>
      </div>

      {estado === 'error' && (
        <p className="text-sm text-[#ba1a1a] bg-[#ffdad6] px-3 py-2 rounded-xl">{errorMsg}</p>
      )}

      <div className="flex flex-col gap-2">
        <button
          onClick={handlePagar}
          disabled={isPending}
          className="w-full h-12 bg-[#08605f] hover:bg-[#004746] text-white text-sm font-bold rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-[family-name:var(--font-outfit)]"
        >
          {isPending ? 'Procesando...' : `Pagar $${valorTotal.toLocaleString('es-CO')}`}
        </button>
        <button
          onClick={handleCancelar}
          disabled={isPending}
          className="w-full h-10 text-sm text-[#6f7978] hover:text-[#ba1a1a] transition-colors rounded-xl hover:bg-[#ffdad6] disabled:opacity-50"
        >
          Cancelar reserva
        </button>
      </div>
    </div>
  )
}
