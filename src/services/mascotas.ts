import type { SupabaseClient } from '@supabase/supabase-js'

export interface Mascota {
  id: string
  conjunto_id: string
  apartamento_id: string
  usuario_id: string
  nombre: string
  tipo: 'perro' | 'gato' | 'ave' | 'reptil' | 'otro'
  raza: string | null
  color: string | null
  vacunas_al_dia: boolean
  soporte_emocional: boolean
  foto_url: string | null
  activo: boolean
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export const TIPO_MASCOTA: Record<Mascota['tipo'], string> = {
  perro:   'Perro',
  gato:    'Gato',
  ave:     'Ave',
  reptil:  'Reptil',
  otro:    'Otro',
}

export async function getMascotas(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Mascota[]> {
  const { data } = await supabase
    .from('mascotas')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Mascota[]
}

export async function getMisMascotas(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Mascota[]> {
  const { data } = await supabase
    .from('mascotas')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('usuario_id', usuarioId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Mascota[]
}
