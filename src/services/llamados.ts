import type { SupabaseClient } from '@supabase/supabase-js'

export interface LlamadoAtencion {
  id: string
  conjunto_id: string
  apartamento_id: string
  creado_por: string
  tipo: 'convivencia' | 'ruido' | 'daños' | 'incumplimiento' | 'otro'
  descripcion: string
  evidencia_url: string | null
  estado: 'activo' | 'en_proceso' | 'resuelto' | 'archivado'
  respuesta_residente: string | null
  fecha_en_proceso: string | null
  fecha_resolucion: string | null
  created_at: string
  updated_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  creadores?: { nombre: string } | null
}

export const TIPO_LLAMADO: Record<LlamadoAtencion['tipo'], string> = {
  convivencia:     'Convivencia',
  ruido:           'Ruido',
  daños:           'Daños',
  incumplimiento:  'Incumplimiento',
  otro:            'Otro',
}

export const ESTADO_LLAMADO: Record<LlamadoAtencion['estado'], { label: string; bg: string; text: string }> = {
  activo:      { label: 'Activo',      bg: 'bg-[#ffdad6]', text: 'text-[#ba1a1a]' },
  en_proceso:  { label: 'En proceso',  bg: 'bg-[#fff9db]', text: 'text-[#e67700]' },
  resuelto:    { label: 'Resuelto',    bg: 'bg-[#d3f9d8]', text: 'text-[#2f9e44]' },
  archivado:   { label: 'Archivado',   bg: 'bg-[#f5f3f3]', text: 'text-[#6f7978]' },
}

export function formatFechaHora(iso: string, short = false): string {
  const d = new Date(iso)
  if (short) {
    return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleString('es-CO', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export async function getLlamados(
  supabase: SupabaseClient,
  conjuntoId: string,
  estado?: string
): Promise<LlamadoAtencion[]> {
  let query = supabase
    .from('llamados_atencion')
    .select('*, apartamentos(numero, torre), creadores:usuarios!llamados_atencion_creado_por_fkey(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('created_at', { ascending: false })

  if (estado && estado !== 'todos') {
    query = query.eq('estado', estado)
  }

  const { data } = await query
  return (data ?? []) as LlamadoAtencion[]
}

export async function getMisLlamados(
  supabase: SupabaseClient,
  conjuntoId: string,
  apartamentoId: string
): Promise<LlamadoAtencion[]> {
  const { data } = await supabase
    .from('llamados_atencion')
    .select('*, creadores:usuarios!llamados_atencion_creado_por_fkey(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('apartamento_id', apartamentoId)
    .order('created_at', { ascending: false })

  return (data ?? []) as LlamadoAtencion[]
}
