import { useState, useCallback, useEffect } from 'react'
import type { B2CTrip, B2BTrip, Warehouse } from '@/types/tracking'

export function useTrackingTrips(warehouse?: Warehouse) {
    const [b2cTrips, setB2cTrips] = useState<B2CTrip[]>([])
    const [b2bTrips, setB2bTrips] = useState<B2BTrip[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchTrips = useCallback(async () => {
        setIsLoading(true)
        try {
            const t = Date.now()
            const query = warehouse ? `?warehouse=${warehouse}&t=${t}` : `?t=${t}`
            const res = await fetch(`/api/tracking${query}`)
            if (res.ok) {
                const data = await res.json()
                setB2cTrips(data.filter((t: any) => t.trip_type === 'b2c'))
                setB2bTrips(data.filter((t: any) => t.trip_type === 'b2b'))
            }
        } catch (error) {
            console.error('Error fetching trips:', error)
        } finally {
            setIsLoading(false)
        }
    }, [warehouse])

    // Llenar datos al iniciar
    useEffect(() => {
        fetchTrips()
    }, [fetchTrips])

    const saveTrip = async (tripData: any, isNew: boolean) => {
        const method = isNew ? 'POST' : 'PUT'
        const res = await fetch('/api/tracking', {
            method,
            body: JSON.stringify({ ...tripData, warehouse: tripData.warehouse || warehouse }),
            headers: { 'Content-Type': 'application/json' }
        })
        
        if (!res.ok) {
            const error = await res.json()
            throw new Error(error.error || 'Error saving trip')
        }
        
        return res.json()
    }
    
    // Función separada para guardar múltiples al mismo tiempo (ej for B2C table Save All)
    const saveTripsBatch = async (tripsData: any[], areNew: boolean) => {
        const results = await Promise.all(
            tripsData.map(trip => saveTrip(trip, areNew))
        )
        await fetchTrips() // Reload to get fresh IDs and accurate states
        return results
    }

    const deleteTrip = async (id: string) => {
        console.log('Hook: Requesting deletion for ID:', id)
        const res = await fetch(`/api/tracking?id=${id}`, {
            method: 'DELETE'
        })
        
        const data = await res.json()
        console.log('Hook: Deletion response:', data)

        if (!res.ok) {
            throw new Error(data.error || 'Error deleting trip')
        }
        
        await fetchTrips()
        return data
    }

    return { 
        b2cTrips, 
        b2bTrips, 
        isLoading, 
        fetchTrips, 
        saveTrip,
        saveTripsBatch,
        deleteTrip
    }
}
