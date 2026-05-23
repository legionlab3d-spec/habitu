'use client'

import { useState } from 'react'
import type { Comunicado } from '@/src/services/comunicados'

interface Estilo {
  border: string
  bg: string
  text: string
  label: string
}

interface Props {
  comunicado: Comunicado
  estilo: Estilo
}

const PREVIEW_LENGTH = 140

function formatFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

export default function ComunicadoCard({ comunicado: c, estilo }: Props) {
  const [expandido, setExpandido] = useState(false)
  const esTruncable = c.contenido.length > PREVIEW_LENGTH

  return (
    <div
      className={`bg-white border border-[#bec9c8] border-l-4 ${estilo.border} rounded-r-2xl rounded-l-none pl-4 pr-5 py-4`}
    >
      <div className="flex items-start gap-2 mb-1">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${estilo.bg} ${estilo.text}`}>
          {estilo.label}
        </span>
      </div>

      <p className="text-sm font-semibold text-[#1b1c1c] mb-1">{c.titulo}</p>

      <p className="text-sm text-[#3f4948] leading-relaxed">
        {esTruncable && !expandido
          ? `${c.contenido.slice(0, PREVIEW_LENGTH).trim()}…`
          : c.contenido}
      </p>

      <div className="flex items-center justify-between mt-2 flex-wrap gap-2">
        <p className="text-[10px] text-[#6f7978] uppercase tracking-wide">{formatFecha(c.created_at)}</p>
        {esTruncable && (
          <button
            onClick={() => setExpandido(!expandido)}
            className={`text-xs font-semibold transition-colors ${estilo.text} hover:opacity-70`}
          >
            {expandido ? 'Ver menos' : 'Ver más'}
          </button>
        )}
      </div>
    </div>
  )
}
