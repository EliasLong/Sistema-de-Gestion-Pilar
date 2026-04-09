import { useState, useEffect, useRef } from 'react'

interface UseAutoSaveFieldProps<T> {
  value: T
  onSave: (newValue: T) => Promise<void>
  debounceMs?: number
}

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export function useAutoSaveField<T>({
  value,
  onSave,
  debounceMs = 1500,
}: UseAutoSaveFieldProps<T>) {
  const [status, setStatus] = useState<SaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const prevValueRef = useRef<T>(value)

  useEffect(() => {
    if (value === prevValueRef.current) {
      return
    }

    prevValueRef.current = value

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    setStatus('saving')
    setError(null)

    timeoutRef.current = setTimeout(async () => {
      try {
        await onSave(value)
        setStatus('saved')
        setError(null)

        setTimeout(() => setStatus('idle'), 2000)
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        setError(errorMsg)
        setStatus('error')
        console.error('Auto-save error:', err)
      }
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onSave, debounceMs])

  return {
    status,
    error,
    isSaved: status === 'saved',
    isSaving: status === 'saving',
    isError: status === 'error',
  }
}
