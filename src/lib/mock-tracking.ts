// ============================================
// Datos mock para el Módulo de Tracking
// Solo para desarrollo — reemplazar con Supabase
// ============================================

import type { B2CTrip, B2BTrip, SheetImportRow } from '@/types/tracking'

export const MOCK_CARRIERS_B2C = [
    'Retira Meli',
    'DPD next day',
    'MELI FLEX MOOVA',
    'Andreani logistica B2C',
    'La sevillanita',
    'Andesmar',
    'Flota Propia',
    'Envio Pack Pi',
    'Andreani Service Canje',
    'OCA B2C',
    'Oro negro B2C',
    'HOP',
    'Webpack Nextday',
    'Andreani Correo Interior',
    'Del valle',
    'MARKETPLACE',
    'Envio Pack NS',
    'Iflow B2C',
    'ANDREANI PICK UP',
    'Andreani logistica interior',
    'Meli flex webpack',
    'Andreani service',
    'ANDREANI PEDIDOS ESPECIALES',
    'ANDREANI MULTIBULTO B2C',
].sort((a, b) => a.localeCompare(b))

export const MOCK_CARRIERS_B2B = [
    '26/02/26',
    'BESSONE',
    'CAMILA DUARTE',
    'CST',
    'ESETECE',
    'FRATI',
    'GRUPO LURO',
    'LOG. INTEGRAL ROMANO',
    'LOGITECK',
    'LOGYT',
    'MARRA',
    'MC S.R.L',
    'MEFF',
    'NORTE',
    'OCA',
    'PANGEA',
    'PL2',
    'RD',
    'RETIRA CLIENTE',
    'TABLADA TRUCK',
    'TOLIZ',
    'TRANSPORTE NORTE S.A'
].sort((a, b) => a.localeCompare(b))

export interface Operator {
    id: string
    name: string
    warehouse: 'PL2' | 'PL3'
    shift: {
        days: number[] // 0-6 (Sunday-Saturday)
        start: string  // HH:mm
        end: string    // HH:mm
    }
}

export const OPERATORS_DATA: Operator[] = [
    {
        id: 'op-1',
        name: 'Jonatan Flores',
        warehouse: 'PL2',
        shift: { days: [1, 2, 3, 4, 5, 6], start: '14:00', end: '22:00' } // L-V 14-22, S 9-13 (Simplified to 14-22 for now or split)
    },
    {
        id: 'op-2',
        name: 'Dario Seta',
        warehouse: 'PL2',
        shift: { days: [1, 2, 3, 4, 5, 6], start: '14:00', end: '22:00' }
    },
    {
        id: 'op-3',
        name: 'Luciano Bullon',
        warehouse: 'PL2',
        shift: { days: [1, 2, 3, 4, 5, 6], start: '14:00', end: '22:00' }
    },
    {
        id: 'op-4',
        name: 'Nelson Lauria',
        warehouse: 'PL2',
        shift: { days: [1, 2, 3, 4, 5, 6], start: '14:00', end: '22:00' }
    },
    {
        id: 'op-5',
        name: 'Martinez Facundo',
        warehouse: 'PL3',
        shift: { days: [1, 2, 3, 4, 5, 6], start: '14:00', end: '22:00' }
    }
]

// Backward compatibility or legacy support
export const MOCK_OPERATORS = OPERATORS_DATA.map(o => o.name)

/**
 * Gets operators filtered by warehouse and sorted by shift relevance
 */
export function getOperatorsForContext(warehouse: string): string[] {
    const now = new Date()
    const currentDay = now.getDay()
    const currentTime = now.getHours() * 100 + now.getMinutes()

    const checkInShift = (op: Operator) => {
        const isDay = op.shift.days.includes(currentDay)
        if (!isDay) return false

        // Special case for Saturday 9-13 (user spec)
        if (currentDay === 6) {
            const start = 900
            const end = 1300
            return currentTime >= start && currentTime <= end
        }

        const start = parseInt(op.shift.start.replace(':', ''))
        const end = parseInt(op.shift.end.replace(':', ''))
        return currentTime >= start && currentTime <= end
    }

    return OPERATORS_DATA
        .filter(op => op.warehouse === warehouse)
        .sort((a, b) => {
            const aInShift = checkInShift(a)
            const bInShift = checkInShift(b)
            if (aInShift && !bInShift) return -1
            if (!aInShift && bInShift) return 1
            return a.name.localeCompare(b.name)
        })
        .map(op => op.name)
}

export const MOCK_LABELERS = [
    'Ana Torres',
    'María Ruiz',
    'Laura Paz',
    'Sofía Morales',
]

// Usuario simulado actual
export const MOCK_CURRENT_USER = {
    id: 'user-001',
    name: 'Operador',
    role: 'admin' as const,
}

// --- Datos mock B2C ---

export const MOCK_B2C_TRIPS: B2CTrip[] = []

// --- Datos mock B2B ---

export const MOCK_B2B_TRIPS: B2BTrip[] = []

// --- Datos simulados de importación desde Sheet ---

export const MOCK_SHEET_IMPORTS: SheetImportRow[] = []
