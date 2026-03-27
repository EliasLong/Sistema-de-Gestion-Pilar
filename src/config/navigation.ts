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
  Wrench,
} from 'lucide-react'
import type { UserRole } from '../types/database'

export interface NavItem {
  title: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
  badge?: string
  subItems?: { title: string; href: string }[]
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
    subItems: [
      { title: 'PL2', href: '/tracking/pl2' },
      { title: 'PL3', href: '/tracking/pl3' },
      { title: 'Estado del turno', href: '/tracking/estado-del-turno' },
    ],
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
    title: 'Herramientas',
    href: '/herramientas',
    icon: Wrench,
    roles: ['operative', 'supervisor', 'manager', 'admin'],
    subItems: [
      { title: 'Reporte de incidencias', href: '/herramientas/reporte-incidencias' }
    ]
  },
  {
    title: 'Configuración',
    href: '/configuracion',
    icon: Settings,
    roles: ['operative', 'manager', 'admin'],
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
