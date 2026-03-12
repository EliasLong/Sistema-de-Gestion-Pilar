'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { B2CTable } from './B2CTable'
import { B2BTable } from './B2BTable'
import type { B2CTrip, B2BTrip, Warehouse } from '@/types/tracking'

interface TrackingTabsProps {
    warehouse: Warehouse
    b2cTrips: B2CTrip[]
    b2bTrips: B2BTrip[]
}

type TabValue = 'b2c' | 'b2b'

export function TrackingTabs({ warehouse, b2cTrips, b2bTrips }: TrackingTabsProps) {
    const [activeTab, setActiveTab] = useState<TabValue>('b2c')
    const [hasUnsavedB2C, setHasUnsavedB2C] = useState(false)
    const [hasUnsavedB2B, setHasUnsavedB2B] = useState(false)
    const router = useRouter()

    const hasAnyUnsaved = hasUnsavedB2C || hasUnsavedB2B

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

    const handleBack = useCallback(() => {
        if (hasAnyUnsaved) {
            const confirmed = window.confirm(
                'Tenés filas sin guardar. Si volvés, se perderán los cambios. ¿Continuar?'
            )
            if (!confirmed) return
        }
        router.push('/tracking')
    }, [hasAnyUnsaved, router])

    const handleTabSwitch = useCallback(
        (tab: TabValue) => {
            // Permitir cambio de tab sin perder datos (ambas tablas mantienen su estado)
            setActiveTab(tab)
        },
        []
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleBack}
                        className="rounded-md p-2 hover:bg-muted transition-colors"
                        aria-label="Volver al selector"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Tracking — {warehouse}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            Registro de movimientos de viajes
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
                    <B2CTable trips={b2cTrips} warehouse={warehouse} onUnsavedChange={setHasUnsavedB2C} />
                </div>
                <div className={activeTab === 'b2b' ? 'block' : 'hidden'}>
                    <B2BTable trips={b2bTrips} warehouse={warehouse} onUnsavedChange={setHasUnsavedB2B} />
                </div>
            </div>
        </div>
    )
}
