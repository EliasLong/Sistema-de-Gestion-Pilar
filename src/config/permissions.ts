import type { UserRole } from '../types/database'

export const PERMISSIONS = {
  // Dashboard
  'dashboard:view': ['operative', 'supervisor', 'manager', 'admin'],
  'dashboard:edit_kpis': ['manager', 'admin'],
  
  // Tracking/Trips
  'trips:view': ['operative', 'supervisor', 'manager', 'admin'],
  'trips:create': ['supervisor', 'manager', 'admin'],
  'trips:edit': ['supervisor', 'manager', 'admin'],
  'trips:delete': ['manager', 'admin'],
  'trips:change_status': ['supervisor', 'manager', 'admin'],
  'trips:export': ['supervisor', 'manager', 'admin'],
  
  // Claims
  'claims:view': ['operative', 'supervisor', 'manager', 'admin'],
  'claims:create': ['supervisor', 'manager', 'admin'],
  'claims:edit': ['supervisor', 'manager', 'admin'],
  'claims:assign': ['supervisor', 'manager', 'admin'],
  'claims:resolve': ['supervisor', 'manager', 'admin'],
  'claims:delete': ['manager', 'admin'],
  
  // Warehouse Map
  'warehouse:view': ['operative', 'supervisor', 'manager', 'admin'],
  'warehouse:edit_layout': ['manager', 'admin'],
  
  // Financial (requiere password adicional)
  'financial:view': ['manager', 'admin'],
  'financial:edit': ['admin'],
  
  // Chat
  'chat:use': ['operative', 'supervisor', 'manager', 'admin'],
  
  // Reports
  'reports:view': ['supervisor', 'manager', 'admin'],
  'reports:create': ['supervisor', 'manager', 'admin'],
  'reports:schedule': ['manager', 'admin'],
  
  // Users Management
  'users:view': ['admin'],
  'users:create': ['admin'],
  'users:edit': ['admin'],
  'users:delete': ['admin'],
  
  // Settings
  'settings:view': ['manager', 'admin'],
  'settings:edit': ['admin'],
} as const

export type Permission = keyof typeof PERMISSIONS

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowedRoles = PERMISSIONS[permission] as readonly UserRole[]
  return allowedRoles?.includes(role) ?? false
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(p => hasPermission(role, p))
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(p => hasPermission(role, p))
}
