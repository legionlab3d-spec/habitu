import type { SupabaseClient } from '@supabase/supabase-js'

export type EstadoVehiculo = 'pendiente_aprobacion' | 'aprobado' | 'rechazado'

export interface Vehiculo {
  id: string
  conjunto_id: string
  apartamento_id: string | null
  usuario_id: string | null
  parqueadero_id: string | null
  placa: string
  marca: string | null
  modelo: string | null
  color: string | null
  tipo: 'carro' | 'moto' | 'bicicleta' | 'otro'
  estado: EstadoVehiculo
  aprobado_por: string | null
  aprobado_at: string | null
  comentarios_admin: string | null
  activo: boolean
  created_at: string
  apartamentos?: { numero: string; torre: string | null } | null
  usuarios?: { nombre: string } | null
}

export interface VehiculoDocumento {
  id: string
  vehiculo_id: string
  conjunto_id: string
  tipo_documento: 'soat' | 'tarjeta_propiedad' | 'otro'
  archivo_url: string
  nombre_archivo: string | null
  uploaded_at: string
}

export const TIPO_VEHICULO: Record<Vehiculo['tipo'], string> = {
  carro:     'Carro',
  moto:      'Moto',
  bicicleta: 'Bicicleta',
  otro:      'Otro',
}

export const ESTADO_VEHICULO: Record<EstadoVehiculo, { label: string; bg: string; text: string }> = {
  pendiente_aprobacion: { label: 'Pendiente aprobación', bg: 'bg-[#fff9db]',  text: 'text-[#e67700]' },
  aprobado:             { label: 'Aprobado',             bg: 'bg-[#d3f9d8]',  text: 'text-[#2f9e44]' },
  rechazado:            { label: 'Rechazado',            bg: 'bg-[#ffdad6]',  text: 'text-[#ba1a1a]' },
}

export const TIPO_DOCUMENTO: Record<VehiculoDocumento['tipo_documento'], string> = {
  soat:              'SOAT',
  tarjeta_propiedad: 'Tarjeta de propiedad',
  otro:              'Otro',
}

export async function getVehiculos(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Vehiculo[]> {
  const { data } = await supabase
    .from('vehiculos')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Vehiculo[]
}

export async function getVehiculosPendientes(
  supabase: SupabaseClient,
  conjuntoId: string
): Promise<Vehiculo[]> {
  const { data } = await supabase
    .from('vehiculos')
    .select('*, apartamentos(numero, torre), usuarios(nombre)')
    .eq('conjunto_id', conjuntoId)
    .eq('activo', true)
    .eq('estado', 'pendiente_aprobacion')
    .order('created_at', { ascending: true })

  return (data ?? []) as Vehiculo[]
}

export async function getMisVehiculos(
  supabase: SupabaseClient,
  conjuntoId: string,
  usuarioId: string
): Promise<Vehiculo[]> {
  const { data } = await supabase
    .from('vehiculos')
    .select('*')
    .eq('conjunto_id', conjuntoId)
    .eq('usuario_id', usuarioId)
    .eq('activo', true)
    .order('created_at', { ascending: false })

  return (data ?? []) as Vehiculo[]
}

export async function getDocumentosVehiculo(
  supabase: SupabaseClient,
  vehiculoId: string
): Promise<VehiculoDocumento[]> {
  const { data } = await supabase
    .from('vehiculo_documentos')
    .select('*')
    .eq('vehiculo_id', vehiculoId)
    .order('uploaded_at', { ascending: false })

  return (data ?? []) as VehiculoDocumento[]
}
