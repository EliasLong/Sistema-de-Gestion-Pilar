'use client'

import { useRouter } from 'next/navigation'
import { Warehouse } from 'lucide-react'

const WAREHOUSES = [
    {
        id: 'PL2',
        name: 'PL2',
        description: 'Depósito Pilar 2',
    },
    {
        id: 'PL3',
        name: 'PL3',
        description: 'Depósito Pilar 3',
    },
] as const

export function WarehouseSelector() {
    const router = useRouter()

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Tracking</h1>
                <p className="text-muted-foreground">
                    Seleccioná el depósito para gestionar los viajes
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-lg">
                {WAREHOUSES.map((wh) => (
                    <button
                        key={wh.id}
                        onClick={() => router.push(`/tracking/${wh.id.toLowerCase()}`)}
                        className="group relative flex flex-col items-center gap-4 rounded-xl border bg-card p-8 
                       text-card-foreground shadow-sm transition-all duration-200 
                       hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 hover:scale-[1.02]
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <div className="rounded-full bg-primary/10 p-4 transition-colors group-hover:bg-primary/20">
                            <Warehouse className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center">
                            <h2 className="text-2xl font-bold">{wh.name}</h2>
                            <p className="text-sm text-muted-foreground mt-1">{wh.description}</p>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    )
}
