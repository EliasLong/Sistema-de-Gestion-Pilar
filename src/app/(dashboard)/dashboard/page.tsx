// src/app/(dashboard)/dashboard/page.tsx

'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
    Truck, MapPin, AlertCircle, TrendingUp, BarChart3, 
    PieChart as PieChartIcon, Activity, Package, Layers, ArrowRight 
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'
import { VolumenDashboard } from '@/components/dashboard/VolumenDashboard'

function DashboardContent() {
    const searchParams = useSearchParams()
    const [activeMainTab, setActiveMainTab] = useState('inicio')

    useEffect(() => {
        const tab = searchParams.get('tab')
        if (tab === 'volumen') {
            setActiveMainTab('volumen')
        } else if (tab === 'inicio') {
            setActiveMainTab('inicio')
        }
    }, [searchParams])

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Pestañas principales */}
            <div className="flex gap-2 border-b mb-6">
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveMainTab('inicio')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeMainTab === 'inicio'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Inicio
                    </button>
                    <button
                        onClick={() => setActiveMainTab('volumen')}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeMainTab === 'volumen'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Volumen
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeMainTab === 'inicio' ? (
                    <motion.div 
                        key="inicio"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                    >
                        {/* Grid de KPIs e Invitación a Volumen */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                            {/* Card de Acceso Directo a Volumen */}
                            <button 
                                onClick={() => setActiveMainTab('volumen')}
                                className="group relative overflow-hidden rounded-xl border-2 border-primary/20 bg-primary/5 p-6 text-left transition-all hover:border-primary/50 hover:bg-primary/10 shadow-sm"
                            >
                                <div className="flex flex-col h-full justify-between">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <BarChart3 className="h-6 w-6 text-primary" />
                                            <ArrowRight className="h-4 w-4 text-primary opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                                        </div>
                                        <h3 className="font-bold text-lg text-[#003366]">Análisis de Volumen</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Dashboard Power BI: PL2/PL3, transportes y vencimientos.</p>
                                    </div>
                                    <div className="mt-4">
                                        <Badge className="bg-primary text-white">Nuevo Submódulo</Badge>
                                    </div>
                                </div>
                            </button>

                            {/* Otros KPIs */}
                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium">Estado de Docks</h3>
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="pt-2">
                                    <div className="text-2xl font-bold">12 / 40</div>
                                    <p className="text-xs text-muted-foreground">Ocupados actualmente</p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium">Movimientos</h3>
                                    <Truck className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="pt-2">
                                    <div className="text-2xl font-bold">+245</div>
                                    <p className="text-xs text-muted-foreground">En la última hora</p>
                                </div>
                            </div>

                            <div className="rounded-xl border bg-card p-6 shadow-sm">
                                <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <h3 className="tracking-tight text-sm font-medium">OTIF</h3>
                                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                                </div>
                                <div className="pt-2">
                                    <div className="text-2xl font-bold">94.2%</div>
                                    <p className="text-xs text-muted-foreground">+2.1% desde ayer</p>
                                </div>
                            </div>
                        </div>

                        {/* Paneles Inferiores */}
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                            <div className="col-span-4 rounded-xl border bg-card shadow-sm">
                                <div className="p-6">
                                    <h3 className="font-semibold leading-none tracking-tight">Estado de la Operación</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Visión general de los viajes activos</p>
                                </div>
                                <div className="p-6 pt-0">
                                    <div className="relative w-full overflow-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b text-muted-foreground">
                                                    <th className="h-10 px-2 text-left">Viaje</th>
                                                    <th className="h-10 px-2 text-left">Estado</th>
                                                    <th className="h-10 px-2 text-left">Destino</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr className="border-b">
                                                    <td className="p-2">#1024</td>
                                                    <td className="p-2"><Badge variant="default">En Tránsito</Badge></td>
                                                    <td className="p-2">Buenos Aires</td>
                                                </tr>
                                                <tr>
                                                    <td className="p-2">#1025</td>
                                                    <td className="p-2"><Badge variant="secondary">Preparación</Badge></td>
                                                    <td className="p-2">Córdoba</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            <div className="col-span-3 rounded-xl border bg-card shadow-sm">
                                <div className="p-6">
                                    <h3 className="font-semibold leading-none tracking-tight">Alertas Recientes</h3>
                                    <p className="text-sm text-muted-foreground mt-2">Notificaciones operativas</p>
                                </div>
                                <div className="p-6 pt-0 space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-red-500" />
                                        <div>
                                            <p className="text-sm font-medium">Dock #12 en mantenimiento</p>
                                            <p className="text-xs text-muted-foreground">Hace 15 min</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                                        <div>
                                            <p className="text-sm font-medium">Demora carga PL3</p>
                                            <p className="text-xs text-muted-foreground">Hace 32 min</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="volumen"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                    >
                        <VolumenDashboard />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="p-8">Cargando dashboard...</div>}>
            <DashboardContent />
        </Suspense>
    )
}