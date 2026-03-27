'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { B2CTable } from './B2CTable'
import { B2BTable } from './B2BTable'
import { useProfile } from '@/hooks/useProfile'
import { useSearchStore } from '@/hooks/useSearchStore'
import { formatDate, cn } from '@/lib/utils'
import type { B2CTrip, B2BTrip, Warehouse } from '@/types/tracking'

interface TrackingTabsProps {
    warehouse: Warehouse
    b2cTrips: B2CTrip[]
    b2bTrips: B2BTrip[]
    onSave: (data: any, isNew: boolean) => Promise<any>
    onSaveBatch: (data: any[], areNew: boolean) => Promise<any>
    onDelete: (id: string) => Promise<any>
    onRefresh: () => Promise<void>
}

type TabValue = 'b2c' | 'b2b'

export function TrackingTabs({ warehouse, b2cTrips, b2bTrips, onSave, onSaveBatch, onDelete, onRefresh }: TrackingTabsProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('b2c')
    const [hasUnsavedB2C, setHasUnsavedB2C] = useState(false)
    const [hasUnsavedB2B, setHasUnsavedB2B] = useState(false)
    const router = useRouter()
    const { profile } = useProfile()
    const { searchTerm } = useSearchStore()

    const hasAnyUnsaved = hasUnsavedB2C || hasUnsavedB2B

    // Restore last tab & save warehouse history on mount
    useEffect(() => {
        try {
            // Save current warehouse to history
            if (warehouse) {
                localStorage.setItem('tracking_last_warehouse', warehouse.toLowerCase())
            }

            // Restore last tab for THIS specific warehouse
            const savedTab = localStorage.getItem(`tracking_last_tab_${warehouse.toLowerCase()}`) as TabValue
            if (savedTab === 'b2c' || savedTab === 'b2b') {
                setActiveTab(savedTab)
            }
        } catch (e) {
            console.warn('localStorage is not available')
        }
    }, [warehouse])

    // Alerta al cerrar pestaña/navegador si hay cambios sin guardar
    useEffect(() => {
        if (!hasAnyUnsaved) return

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault()
            e.returnValue = 'Tenés filas sin guardar. ¿Seguro que querés salir?'
            return e.returnValue
        }

        window.addEventListener('beforeunload', handleBeforeUnload)
        return () => window.removeEventListener('beforeunload', handleBeforeUnload)
    }, [hasAnyUnsaved])

    const handleSwitchWarehouse = useCallback((newWarehouse: 'PL2' | 'PL3') => {
        if (warehouse.toUpperCase() === newWarehouse) return
        if (hasAnyUnsaved) {
            const confirmed = window.confirm(
                'Tenés filas sin guardar. Si cambiás de depósito se perderán los cambios. ¿Continuar?'
            )
            if (!confirmed) return
        }
        router.push(`/tracking/${newWarehouse.toLowerCase()}`)
    }, [hasAnyUnsaved, router, warehouse])

    const handleTabSwitch = useCallback(
        (tab: TabValue) => {
            setActiveTab(tab)
            try {
                localStorage.setItem(`tracking_last_tab_${warehouse.toLowerCase()}`, tab)
            } catch (e) {
                // Ignore
            }
        },
        [warehouse]
    )

    const filteredB2C = b2cTrips.filter(trip => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            trip.trip_number.toLowerCase().includes(search) ||
            trip.carrier.toLowerCase().includes(search) ||
            (trip.retira || '').toLowerCase().includes(search) ||
            (trip.vehicle_plate || '').toLowerCase().includes(search) ||
            trip.labeler.toLowerCase().includes(search) ||
            formatDate(trip.date).toLowerCase().includes(search) ||
            trip.operators.some(op => op.toLowerCase().includes(search)) ||
            trip.port.toLowerCase().includes(search)
        )
    })

    const filteredB2B = b2bTrips.filter(trip => {
        if (!searchTerm) return true
        const search = searchTerm.toLowerCase()
        return (
            trip.trip_number.toLowerCase().includes(search) ||
            trip.carrier.toLowerCase().includes(search) ||
            (trip.retira || '').toLowerCase().includes(search) ||
            (trip.vehicle_plate || '').toLowerCase().includes(search) ||
            trip.client.toLowerCase().includes(search) ||
            formatDate(trip.date).toLowerCase().includes(search) ||
            trip.operators.some(op => op.toLowerCase().includes(search)) ||
            trip.port.toLowerCase().includes(search)
        )
    })

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex bg-muted/50 p-1 rounded-xl">
                        <button
                            onClick={() => handleSwitchWarehouse('PL2')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                                warehouse?.toUpperCase() === 'PL2' 
                                    ? "bg-primary text-primary-foreground shadow-sm" 
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            PL2
                        </button>
                        <button
                            onClick={() => handleSwitchWarehouse('PL3')}
                            className={cn(
                                "px-4 py-2 text-sm font-bold rounded-lg transition-all",
                                warehouse?.toUpperCase() === 'PL3' 
                                    ? "bg-primary text-primary-foreground shadow-sm" 
                                    : "text-muted-foreground hover:bg-muted"
                            )}
                        >
                            PL3
                        </button>
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            {profile?.full_name || 'Usuario'}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Registro de movimientos operativos
                        </p>
                    </div>
                </div>

                {hasAnyUnsaved && (
                    <div className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-2">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        <span className="text-sm text-amber-400 font-medium">
                            Cambios sin guardar
                        </span>
                    </div>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b">
                <div className="flex gap-0">
                    <button
                        onClick={() => handleTabSwitch('b2c')}
                        className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'b2c'
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        B2C
                        {hasUnsavedB2C && (
                            <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 inline-block" />
                        )}
                        {activeTab === 'b2c' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => handleTabSwitch('b2b')}
                        className={`relative px-6 py-3 text-sm font-medium transition-colors ${activeTab === 'b2b'
                                ? 'text-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        B2B
                        {hasUnsavedB2B && (
                            <span className="ml-1.5 h-2 w-2 rounded-full bg-amber-400 inline-block" />
                        )}
                        {activeTab === 'b2b' && (
                            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                </div>
            </div>

            {/* Content — ambas tablas siempre montadas para no perder estado */}
            <div>
                <div className={activeTab === 'b2c' ? 'block' : 'hidden'}>
                    <B2CTable trips={filteredB2C} warehouse={warehouse} onUnsavedChange={setHasUnsavedB2C} onSave={onSave} onSaveBatch={onSaveBatch} onDelete={onDelete} onRefresh={onRefresh} />
                </div>
                <div className={activeTab === 'b2b' ? 'block' : 'hidden'}>
                    <B2BTable trips={filteredB2B} warehouse={warehouse} onUnsavedChange={setHasUnsavedB2B} onSave={onSave} onSaveBatch={onSaveBatch} onDelete={onDelete} onRefresh={onRefresh} />
                </div>
            </div>
        </div>
    )
}
