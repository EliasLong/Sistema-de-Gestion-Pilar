'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error('Error al iniciar sesión:', error.message)
      setIsLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0f1117]">
      {/* Background gradient effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-[#00B4B4]/10 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#00B4B4]/8 blur-[120px]" />
      </div>

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-10 shadow-2xl backdrop-blur-xl">
        <div className="flex flex-col items-center gap-8">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/logo-ocasa.png"
              alt="OCASA Logo"
              width={180}
              height={60}
              priority
              className="drop-shadow-[0_0_25px_rgba(0,180,180,0.3)]"
            />
            <p className="text-sm text-white/40">Warehouse Platform</p>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />

          {/* Google sign-in button */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="group relative flex w-full items-center justify-center gap-3 rounded-xl px-6 py-3.5 font-medium text-white transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: isLoading
                ? 'rgba(0, 180, 180, 0.4)'
                : 'linear-gradient(135deg, #00B4B4, #009999)',
            }}
          >
            {/* Hover glow */}
            <span className="absolute inset-0 rounded-xl bg-white/0 transition-all duration-300 group-hover:bg-white/10" />

            {isLoading ? (
              <span className="relative flex items-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Redirigiendo...
              </span>
            ) : (
              <span className="relative flex items-center gap-3">
                {/* Google icon */}
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Iniciar sesión con Google
              </span>
            )}
          </button>

          {/* Footer text */}
          <p className="text-center text-xs text-white/30">
            Acceso exclusivo para personal autorizado de OCASA
          </p>
        </div>
      </div>
    </div>
  )
}
