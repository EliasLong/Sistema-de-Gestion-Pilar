// ============================================
// Tipos del Módulo de Tracking
// ============================================

export type Warehouse = 'PL2' | 'PL3'

export type TripType = 'b2c' | 'b2b'

export type TripStatus =
    | 'released'
    | 'pending'
    | 'picking'
    | 'closing_pending_invoice'
    | 'invoiced'
    | 'cancelled'

export const TRIP_STATUS_LABELS: Record<TripStatus, string> = {
    released: 'Liberado',
    pending: 'Pendiente',
    picking: 'Pickeando',
    closing_pending_invoice: 'Cerrando Pnd Fac',
    invoiced: 'FAC',
    cancelled: 'Cancelado',
}

export const TRIP_STATUS_COLORS: Record<TripStatus, string> = {
    released: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    pending: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    picking: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    closing_pending_invoice: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    invoiced: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
    cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
}

/** Campos comunes a B2C y B2B */
interface TrackingTripBase {
    id: string
    warehouse: Warehouse
    trip_type: TripType
    date: string
    carrier: string
    trip_number: string
    port: string
    task_count: number
    operators: string[]
    documents_printed: boolean
    status: TripStatus
    created_by: string
    created_at: string
    updated_at: string
}

/** Viaje B2C */
export interface B2CTrip extends TrackingTripBase {
    trip_type: 'b2c'
    pallet_count: number
    pallets_dispatched: number
    labeler: string
}

/** Viaje B2B */
export interface B2BTrip extends TrackingTripBase {
    trip_type: 'b2b'
    vehicle_plate: string
    client: string
    client_shift: string
    pallets: number
    detail: string
    comments: string
    bulk_cargo: boolean
}

export type TrackingTrip = B2CTrip | B2BTrip

// ============================================
// Datos importados desde Sheet (pre-confirmación)
// ============================================

export interface SheetImportRow {
    _sheetRowId: string
    date: string
    carrier: string
    vehicle_plate: string
    trip_number: string
    client: string
    client_shift: string
    task_count: number
    port: string
    pallets: number
    operators: string[]
    documents_printed: boolean
    detail: string
    comments: string
    bulk_cargo: boolean
}

// ============================================
// Permisos de edición
// ============================================

const EDIT_WINDOW_HOURS = 48

export function canEditRow(
    rowCreatedAt: string,
    rowCreatedBy: string,
    currentUserId: string,
    currentUserRole: 'operative' | 'supervisor' | 'manager' | 'admin'
): boolean {
    // Admin puede editar siempre
    if (currentUserRole === 'admin') return true

    // Solo el creador puede editar
    if (rowCreatedBy !== currentUserId) return false

    // Verificar ventana de 48 horas
    const createdAt = new Date(rowCreatedAt)
    const now = new Date()
    const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

    return hoursDiff <= EDIT_WINDOW_HOURS
}
