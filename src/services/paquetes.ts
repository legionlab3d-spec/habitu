import type { SupabaseClient } from '@supabase/supabase-js'

export interface Paquete {
  id: string
  conjunto_id: string
  apartamento_id: string
  usuario_id: string | null
  registrado_por: string
  recibido_por: string | null
  recibido_por_nombre: string | null  // nombre libre: "Portero Carlos", "Recepción"
  descripcion: string | null
  empresa_envio: string | null
  numero_guia: string | null
  foto_url: string | null
  estado: 'en_porteria' | 'pendiente_entrega' | 'entregado' | 'devuelto'
  fecha_recepcion: string
  fecha_entrega: string | null
  entregado_a: string | null          // nombre residente que retiró
  entregado_por: string | null        // nombre portero/admin que entregó
  updated_at: string | null
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const ESTADO_PAQUETE: Record<Paquete['estado'], { label: string; bg: string; text: string }> = {
  en_porteria:       { label: 'En portería',       bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]' },
  pendiente_entrega: { label: 'Pendiente entrega',  bg: 'bg-[#fff9db]', text: 'text-[#e67700]' },
  entregado:         { label: 'Entregado',          bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]' },
  devuelto:          { label: 'Devuelto',           bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]' },
}

export interface FiltrosPaquetes {
  estado?: string
  apartamento?: string  // texto libre para buscar por número de apt
  recibido_por?: string
}

export async function getPaquetes(
  supabase: SupabaseClient,
  conjuntoId: string,
  filtros: FiltrosPaquetes = {}
): Promise<Paquete[]> {
  let query = supabase
    .from('paquetes')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('fecha_recepcion', { ascending: false })
    .limit(200)

  if (filtros.estado && filtros.estado !== 'todos') {
    query = query.eq('estado', filtros.estado)
  }

  const { data } = await query
  let lista = (data ?? []) as Paquete[]

  // JS-side filters (MVP scale)
  if (filtros.apartamento?.trim()) {
    const term = filtros.apartamento.trim().toLowerCase()
    lista = lista.filter((p) => {
      const apto = p.apartamentos as { numero: string; torre: string | null } | null
      return apto?.numero?.toLowerCase().includes(term) || apto?.torre?.toLowerCase().includes(term)
    })
  }
  if (filtros.recibido_por?.trim()) {
    const term = filtros.recibido_por.trim().toLowerCase()
    lista = lista.filter((p) =>
      p.recibido_por_nombre?.toLowerCase().includes(term)
    )
  }

  return lista
}

export async function getMisPaquetes(
  supabase: SupabaseClient,
  conjuntoId: string,
  apartamentoId: string
): Promise<Paquete[]> {
  const { data } = await supabase
    .from('paquetes')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('apartamento_id', apartamentoId)
    .order('fecha_recepcion', { ascending: false })

  return (data ?? []) as Paquete[]
}
