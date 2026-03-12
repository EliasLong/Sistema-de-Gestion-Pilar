'use client'

import { useEffect } from 'react'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <AlertCircle className="h-10 w-10 text-red-500" />
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Algo salió mal</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {error.message || 'Ocurrió un error inesperado al cargar la página.'}
        </p>
      </div>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
