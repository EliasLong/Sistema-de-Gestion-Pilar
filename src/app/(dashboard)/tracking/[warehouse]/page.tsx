'use client'

import { useParams, notFound } from 'next/navigation'
import { TrackingTabs } from '@/components/tracking/TrackingTabs'
import { useTrackingTrips } from '@/hooks/useTrackingTrips'
import type { Warehouse } from '@/types/tracking'

const VALID_WAREHOUSES = ['pl2', 'pl3'] as const

export default function WarehouseTrackingPage() {
    const params = useParams()
    const warehouseParam = params.warehouse as string

    if (!VALID_WAREHOUSES.includes(warehouseParam as typeof VALID_WAREHOUSES[number])) {
        notFound()
    }

    const warehouse = warehouseParam.toUpperCase() as Warehouse

    const { b2cTrips, b2bTrips, isLoading, fetchTrips, saveTrip, saveTripsBatch } = useTrackingTrips(warehouse)

    return (
        <div className="flex-1 space-y-4">
            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
            ) : (
                <TrackingTabs
                    warehouse={warehouse}
                    b2cTrips={b2cTrips}
                    b2bTrips={b2bTrips}
                    onSave={saveTrip}
                    onSaveBatch={saveTripsBatch}
                    onRefresh={fetchTrips}
                />
            )}
        </div>
    )
}
