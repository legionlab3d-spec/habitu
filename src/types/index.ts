export type Rol = 'admin' | 'residente'

export interface Conjunto {
  id: string
  nombre: string
  slug: string
  direccion?: string | null
  ciudad?: string | null
  plan: string
  estado: string
  created_at: string
}

export interface Usuario {
  id: string
  conjunto_id: string
  nombre: string
  email: string
  telefono?: string | null
  rol: Rol
  activo: boolean
  created_at: string
  conjuntos?: Pick<Conjunto, 'id' | 'nombre' | 'slug'>
}

export interface DashboardStats {
  apartamentos: number
  reservas: number
  zonas_comunes: number
  anuncios: number
}

export type ActionState =
  | { error: string }
  | undefined
