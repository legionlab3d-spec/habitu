'use client'

import { useState, useEffect, useRef } from 'react'

interface Props {
  expiresAt: string
  onExpire: () => void
}

export default function ContadorRegresivo({ expiresAt, onExpire }: Props) {
  const [segs, setSegs] = useState(() =>
    Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
  )
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire

  useEffect(() => {
    const iv = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000))
      setSegs(remaining)
      if (remaining <= 0) {
        clearInterval(iv)
        onExpireRef.current()
      }
    }, 1000)
    return () => clearInterval(iv)
  }, [expiresAt])

  const min = Math.floor(segs / 60)
  const sec = segs % 60
  const urgente = segs < 60

  return (
    <span className={`font-mono font-bold tabular-nums ${urgente ? 'text-[#ba1a1a]' : 'text-[#004746]'}`}>
      {String(min).padStart(2, '0')}:{String(sec).padStart(2, '0')}
    </span>
  )
}
