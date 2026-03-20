import {
  LayoutDashboard,
  Truck,
  MessageSquareWarning,
  Map,
  DollarSign,
  FileText,
  MessageCircle,
  Settings,
  Users,
  Trash2,
} from 'lucide-react'
import type { UserRole } from '../types/database'

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
}

export const navigation: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Tracking',
    href: '/tracking',
    icon: Truck,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Reclamos',
    href: '/claims',
    icon: MessageSquareWarning,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Warehouse',
    href: '/warehouse',
    icon: Map,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Financiero',
    href: '/financial',
    icon: DollarSign,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Reportes',
    href: '/reports',
    icon: FileText,
    roles: ['supervisor', 'manager', 'admin'],
  },
  {
    title: 'Chat IA',
    href: '/chat',
    icon: MessageCircle,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
  },
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    roles: ['manager', 'admin'],
  },
  {
    title: 'Usuarios',
    href: '/configuracion/usuarios',
    icon: Users,
    roles: ['admin'],
  },
  {
    title: 'Borrado',
    href: '/tracking/borrado',
    icon: Trash2,
    roles: ['admin'],
  },
]

export function getNavigationForRole(role: UserRole): NavItem[] {
  return navigation.filter(item => item.roles.includes(role))
}
