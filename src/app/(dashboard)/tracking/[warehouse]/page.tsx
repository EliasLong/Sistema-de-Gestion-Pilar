'use client'

import { useParams, notFound } from 'next/navigation'
import { TrackingTabs } from '@/components/tracking/TrackingTabs'
import { MOCK_B2C_TRIPS, MOCK_B2B_TRIPS } from '@/lib/mock-tracking'
import type { Warehouse } from '@/types/tracking'

const VALID_WAREHOUSES = ['pl2', 'pl3'] as const

export default function WarehouseTrackingPage() {
    const params = useParams()
    const warehouseParam = params.warehouse as string

    if (!VALID_WAREHOUSES.includes(warehouseParam as typeof VALID_WAREHOUSES[number])) {
        notFound()
    }

    const warehouse = warehouseParam.toUpperCase() as Warehouse

    // Filtrar viajes por depósito (mock data es toda PL2 por ahora)
    const b2cTrips = MOCK_B2C_TRIPS.filter(
        (trip) => trip.warehouse === warehouse
    )
    const b2bTrips = MOCK_B2B_TRIPS.filter(
        (trip) => trip.warehouse === warehouse
    )

    return (
        <div className="flex-1 space-y-4">
            <TrackingTabs
                warehouse={warehouse}
                b2cTrips={b2cTrips}
                b2bTrips={b2bTrips}
            />
        </div>
    )
}
