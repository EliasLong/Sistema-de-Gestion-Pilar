'use client'

import { useState } from 'react'
import Image from 'next/image'
import { createBrowserClient } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    setIsLoading(true)
    setErrorMessage(null)

    const supabase = createBrowserClient()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('Credenciales inválidas. Verificá tu email y contraseña.')
      setIsLoading(false)
      return
    }

    // Redirect happens via middleware
    window.location.href = '/dashboard'
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
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-6">
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

          {/* Error message */}
          {errorMessage && (
            <div className="w-full rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-2.5 text-sm text-red-400 text-center">
              {errorMessage}
            </div>
          )}

          {/* Email field */}
          <div className="w-full space-y-1.5">
            <label htmlFor="email" className="block text-xs font-medium text-white/60">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu.nombre@ocasa.com"
              required
              autoComplete="email"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#00B4B4]/50 focus:outline-none focus:ring-1 focus:ring-[#00B4B4]/50 transition-colors"
            />
          </div>

          {/* Password field */}
          <div className="w-full space-y-1.5">
            <label htmlFor="password" className="block text-xs font-medium text-white/60">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 focus:border-[#00B4B4]/50 focus:outline-none focus:ring-1 focus:ring-[#00B4B4]/50 transition-colors"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
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
                Iniciando sesión...
              </span>
            ) : (
              <span className="relative">Iniciar sesión</span>
            )}
          </button>

          {/* Footer text */}
          <p className="text-center text-xs text-white/30">
            Acceso exclusivo para personal autorizado de OCASA
          </p>
        </form>
      </div>
    </div>
  )
}
