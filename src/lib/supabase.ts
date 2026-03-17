import { createBrowserClient as _createBrowserClient } from '@supabase/ssr'
import { createServerClient as _createServerClient } from '@supabase/ssr'
import { type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'

// ── Environment validation ──────────────────────────────────────────
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ── Browser Client (for 'use client' components) ────────────────────
export function createBrowserClient() {
  return _createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// ── Server Client (for server components, route handlers, actions) ──
export function createServerComponentClient() {
  const cookieStore = cookies()

  return _createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // Server component — set is not available, safe to ignore
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: '', ...options })
        } catch {
          // Server component — set is not available, safe to ignore
        }
      },
    },
  })
}
