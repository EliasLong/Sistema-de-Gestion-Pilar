'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Warehouse, FileText } from 'lucide-react'

const OPTIONS = [
    {
        id: 'PL2',
        name: 'PL2',
        description: 'Depósito Pilar 2',
        icon: Warehouse
    },
    {
        id: 'PL3',
        name: 'PL3',
        description: 'Depósito Pilar 3',
        icon: Warehouse
    },
    {
        id: 'estado-del-turno',
        name: 'Estado del Turno',
        description: 'Notas de pase de turno',
        icon: FileText
    }
] as const

export function WarehouseSelector() {
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)

    useEffect(() => {
        try {
            const lastWarehouse = localStorage.getItem('tracking_last_warehouse')
            if (lastWarehouse && (lastWarehouse === 'pl2' || lastWarehouse === 'pl3')) {
                router.replace(`/tracking/${lastWarehouse}`)
            } else {
                setIsChecking(false)
            }
        } catch (e) {
            setIsChecking(false)
        }
    }, [router])

    if (isChecking) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tracking</h1>
                <p className="text-muted-foreground">
                    Seleccioná el módulo para gestionar los viajes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
                {OPTIONS.map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => router.push(`/tracking/${opt.id.toLowerCase()}`)}
                        className="group relative flex flex-col items-center gap-4 rounded-xl border bg-card p-8 
                       text-card-foreground shadow-sm transition-all duration-200 
                       hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                            <opt.icon className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{opt.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
