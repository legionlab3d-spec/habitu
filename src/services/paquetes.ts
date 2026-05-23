import type { SupabaseClient } from '@supabase/supabase-js'

export interface Paquete {
  id: string
  conjunto_id: string
  apartamento_id: string
  usuario_id: string | null
  registrado_por: string
  recibido_por: string | null
  descripcion: string | null
  empresa_envio: string | null
  numero_guia: string | null
  foto_url: string | null
  estado: 'en_porteria' | 'entregado' | 'devuelto'
  fecha_recepcion: string
  fecha_entrega: string | null
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const ESTADO_PAQUETE: Record<Paquete['estado'], { label: string; bg: string; text: string }> = {
  en_porteria: { label: 'En portería', bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]' },
  entregado:   { label: 'Entregado',   bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]' },
  devuelto:    { label: 'Devuelto',    bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]' },
}

export async function getPaquetes(
  supabase: SupabaseClient,
  conjuntoId: string,
  estado?: string
): Promise<Paquete[]> {
  let query = supabase
    .from('paquetes')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('fecha_recepcion', { ascending: false })
    .limit(100)

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data } = await query
  return (data ?? []) as Paquete[]
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
