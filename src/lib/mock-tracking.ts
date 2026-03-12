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
]

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
]

export const MOCK_OPERATORS = [
    'Carlos García',
    'Martín López',
    'Pedro Rodríguez',
    'Juan Fernández',
    'Diego Martínez',
    'Lucas Sánchez',
    'Matías Gómez',
    'Nicolás Díaz',
]

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
