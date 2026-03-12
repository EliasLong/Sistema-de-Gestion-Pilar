'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getNavigationForRole } from '@/config/navigation'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps extends React.HTMLAttributes<HTMLElement> {}

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()
  
  // For now, assume 'admin' role to show all options
  const navItems = getNavigationForRole('admin')

  return (
    <aside className={cn("flex flex-col w-64 bg-card", className)} {...props}>
      <div className="flex h-16 items-center px-6 border-b">
        <Link href="/dashboard" className="font-bold text-lg flex items-center gap-2">
          OCASA
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3">
        <div className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href) && item.href !== '/dashboard' || pathname === item.href
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            )
          })}
        </div>
      </div>

      <div className="border-t p-4">
        <div className="flex items-center justify-between rounded-lg p-2 hover:bg-muted cursor-pointer transition-colors group">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src="" />
              <AvatarFallback>OP</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="text-sm font-medium">Operador</span>
              <span className="text-xs text-muted-foreground">Admin</span>
            </div>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
