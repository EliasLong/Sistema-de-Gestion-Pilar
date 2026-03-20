'use client'

import { usePathname } from 'next/navigation'
import { Bell, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { useProfile } from '@/hooks/useProfile'
import { useSearchStore } from '@/hooks/useSearchStore'

export function Header() {
  const pathname = usePathname()
  const { profile } = useProfile()
  const { searchTerm, setSearchTerm } = useSearchStore()
  
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard'
    const segments = pathname.split('/').filter(Boolean)
    const currentSegment = segments[1] || segments[0]
    return currentSegment.charAt(0).toUpperCase() + currentSegment.slice(1)
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight">{getPageTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block w-64">
           <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
           <input 
             type="search" 
             placeholder="Buscar en el warehouse..." 
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             className="w-full rounded-md border border-input bg-background pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
           />
        </div>

        <Button variant="ghost" size="icon" className="relative group">
          <Bell className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
          <span className="absolute top-2 right-2.5 h-1.5 w-1.5 rounded-full bg-primary"></span>
        </Button>

        <div className="h-6 w-px bg-border mx-1"></div>

        <Avatar className="h-8 w-8 cursor-pointer">
           <AvatarImage src={profile?.avatar_url || ""} alt="User" />
           <AvatarFallback>{profile?.full_name?.substring(0,2).toUpperCase() || "U"}</AvatarFallback>
        </Avatar>
      </div>
    </header>
  )
}
