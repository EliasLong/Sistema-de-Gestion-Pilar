export type UserRole = 'operative' | 'supervisor' | 'manager' | 'admin'

export interface User {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
  department: string | null
  phone: string | null
  is_active: boolean
  financial_password_hash: string | null
  created_at: string
  updated_at: string
}

export interface Trip {
  id: string
  trip_number: number
  client_id: string
  status: 'preparation' | 'ready' | 'in_transit' | 'delivered' | 'cancelled'
  destination_city: string
  total_packages: number
  shipping_method: 'ground' | 'air' | 'sea' | 'multimodal'
  created_by: string
  created_at: string
  updated_at: string
}
