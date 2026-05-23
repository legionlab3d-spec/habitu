import type { SupabaseClient } from '@supabase/supabase-js'

export interface Pqrs {
  id: string
  conjunto_id: string
  apartamento_id: string | null
  usuario_id: string
  asignado_a: string | null
  tipo: 'peticion' | 'queja' | 'reclamo' | 'sugerencia'
  categoria: 'infraestructura' | 'convivencia' | 'administracion' | 'servicios' | 'financiero' | 'otro'
  asunto: string
  descripcion: string
  adjunto_url: string | null
  estado: 'recibido' | 'en_proceso' | 'resuelto' | 'cerrado'
  respuesta: string | null
  fecha_respuesta: string | null
  created_at: string
  updated_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const TIPO_PQRS: Record<Pqrs['tipo'], string> = {
  peticion:    'Petición',
  queja:       'Queja',
  reclamo:     'Reclamo',
  sugerencia:  'Sugerencia',
}

export const CATEGORIA_PQRS: Record<Pqrs['categoria'], string> = {
  infraestructura: 'Infraestructura',
  convivencia:     'Convivencia',
  administracion:  'Administración',
  servicios:       'Servicios',
  financiero:      'Financiero',
  otro:            'Otro',
}

export const ESTADO_PQRS: Record<Pqrs['estado'], { label: string; bg: string; text: string }> = {
  recibido:   { label: 'Recibido',    bg: 'bg-[#d0ebff]', text: 'text-[#1971c2]' },
  en_proceso: { label: 'En proceso',  bg: 'bg-[#fff9db]', text: 'text-[#e67700]' },
  resuelto:   { label: 'Resuelto',    bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]' },
  cerrado:    { label: 'Cerrado',     bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]' },
}

export async function getPqrs(
  supabase: SupabaseClient,
  conjuntoId: string,
  estado?: string
): Promise<Pqrs[]> {
  let query = supabase
    .from('pqrs')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('created_at', { ascending: false })

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data } = await query
  return (data ?? []) as Pqrs[]
}

export async function getMisPqrs(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Pqrs[]> {
  const { data } = await supabase
    .from('pqrs')
    .select('*, apartamentos(numero, torre)')
    .eq('conjunto_id', conjuntoId)
    .eq('usuario_id', usuarioId)
    .order('created_at', { ascending: false })

  return (data ?? []) as Pqrs[]
}

export async function getStatsPqrs(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from('pqrs')
    .select('estado')
    .eq('conjunto_id', conjuntoId)

  if (!data) return {}
  return data.reduce((acc, r) => {
    acc[r.estado] = (acc[r.estado] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)
}
