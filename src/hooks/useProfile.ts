import { useState, useEffect } from 'react'
import { createBrowserClient as createClient } from '@/lib/supabase'
import type { UserRole } from '@/types/database'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: UserRole
}

let cachedProfile: UserProfile | null = null

export function useProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(cachedProfile)
  const [loading, setLoading] = useState(cachedProfile === null)

  useEffect(() => {
    if (cachedProfile) return

    async function loadProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setLoading(false)
        return
      }

      const isAdminEmail = ['ignacio.longstaff@ocasa.com', 'juan.cajaravilla@ocasa.com'].includes(user.email?.toLowerCase() || '')

      const { data } = await supabase.from('users').select('*').eq('id', user.id).single()
      if (data) {
        let currentProfile = data as UserProfile
        if (isAdminEmail && currentProfile.role !== 'admin') {
          currentProfile = { ...currentProfile, role: 'admin' }
          supabase.from('users').update({ role: 'admin' }).eq('id', user.id).then()
        }
        cachedProfile = currentProfile
        setProfile(cachedProfile)
      } else {
        cachedProfile = {
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name || 'Usuario',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: isAdminEmail ? 'admin' : 'operative'
        }
        setProfile(cachedProfile)
      }
      setLoading(false)
    }

    loadProfile()
  }, [])

  return { profile, loading }
}
