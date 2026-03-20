import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string): string {
    if (!dateStr) return '—'
    try {
        // Normalizar "2026-3-20" a "2026-03-20"
        if (dateStr.includes('-') && !dateStr.includes('T')) {
            const parts = dateStr.split('-')
            if (parts.length === 3 && parts[0].length === 4) {
                dateStr = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
            }
        }

        const hasTime = dateStr.includes('T')
        const normalized = hasTime ? dateStr : `${dateStr}T12:00:00`
        let date = new Date(normalized)
        
        // Si falló, intentar parsear DD/MM/YYYY
        if (isNaN(date.getTime()) && dateStr.includes('/')) {
            const parts = dateStr.split('/')
            if (parts.length === 3) {
                let y = parts[2]
                if (y.length === 2) y = `20${y}`
                date = new Date(`${y}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T12:00:00`)
            }
        }

        if (isNaN(date.getTime())) return dateStr // Devolver original para depuración
        return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
    } catch {
        return dateStr
    }
}
