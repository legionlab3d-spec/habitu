import type { SupabaseClient } from '@supabase/supabase-js'

export interface DocumentoConjunto {
  id: string
  conjunto_id: string
  subido_por: string
  nombre: string
  descripcion: string | null
  categoria: 'reglamento' | 'manual_convivencia' | 'acta' | 'certificado' | 'circular' | 'presupuesto' | 'otro'
  url: string
  publico: boolean
  created_at: string
  subidores?: { nombre: string } | null
}

export const CATEGORIA_DOCUMENTO: Record<DocumentoConjunto['categoria'], string> = {
  reglamento:        'Reglamento',
  manual_convivencia:'Manual de convivencia',
  acta:              'Acta',
  certificado:       'Certificado',
  circular:          'Circular',
  presupuesto:       'Presupuesto',
  otro:              'Otro',
}

export async function getDocumentos(
  supabase: SupabaseClient,
  conjuntoId: string,
  soloPublicos = false
): Promise<DocumentoConjunto[]> {
  let query = supabase
    .from('documentos_conjunto')
    .select('*, subidores:usuarios!documentos_conjunto_subido_por_fkey(nombre)')
    .eq('conjunto_id', conjuntoId)
    .order('created_at', { ascending: false })

  if (soloPublicos) {
    query = query.eq('publico', true)
  }

  const { data } = await query
  return (data ?? []) as DocumentoConjunto[]
}
