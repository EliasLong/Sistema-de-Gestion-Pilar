import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    try {
        const date = new Date(dateStr + 'T12:00:00') // Use 12:00 to avoid timezone offset issues
        if (isNaN(date.getTime())) return '—'
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
        return '—'
    }
}
