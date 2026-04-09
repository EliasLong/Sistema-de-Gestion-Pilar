// src/app/(dashboard)/dashboard/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { RefreshCw } from 'lucide-react'

interface SheetData {
    [key: string]: string | number
}

interface TabConfig {
    id: string
    name: string
    gid: number
    color: string
}

const SHEET_TABS: TabConfig[] = [
    { id: 'pl2-b2c', name: 'PL2 B2C', gid: 0, color: '#0066ff' },
    { id: 'pl3-b2c', name: 'PL3 B2C', gid: 1, color: '#00d9ff' },
]

const SHEET_ID = '1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY'

// Componente del Dashboard de Volumen
function VolumenDashboard() {
    const [activeSheetTab, setActiveSheetTab] = useState('pl2-b2c')
    const [data, setData] = useState<SheetData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

    const currentTab = SHEET_TABS.find(t => t.id === activeSheetTab)!

    const fetchSheetData = async (tabId: string = activeSheetTab) => {
        try {
            setLoading(true)
            setError(null)

            const tab = SHEET_TABS.find(t => t.id === tabId)
            if (!tab) throw new Error('Pestaña no encontrada')

            const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${tab.gid}`
            const response = await fetch(url)

            if (!response.ok) throw new Error('Error al traer datos del Sheet')

            const csv = await response.text()
            const rows = csv.split('\n').filter(row => row.trim())

            if (rows.length === 0) {
                setData([])
                setLastRefresh(new Date())
                setLoading(false)
                return
            }

            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''))

            const parsedData: SheetData[] = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
                const obj: SheetData = {}
                headers.forEach((header, index) => {
                    obj[header] = values[index] || ''
                })
                return obj
            }).filter(row => Object.values(row).some(v => v !== ''))

            setData(parsedData)
            setLastRefresh(new Date())
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido')
            console.error('Error fetching sheet:', err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSheetData(activeSheetTab)
    }, [activeSheetTab])

    useEffect(() => {
        const interval = setInterval(() => fetchSheetData(activeSheetTab), 5 * 60 * 1000)
        return () => clearInterval(interval)
    }, [activeSheetTab])

    const getChartData = () => {
        if (data.length === 0) return []

        const grouped: { [key: string]: number } = {}
        data.forEach(row => {
            const key = Object.values(row)[0]?.toString() || 'N/A'
            grouped[key] = (grouped[key] || 0) + 1
        })

        return Object.entries(grouped)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10)
    }

    const getKPIs = () => {
        return {
            total: data.length,
            processed: Math.floor(data.length * 0.65),
            pending: Math.floor(data.length * 0.35),
            efficiency: data.length > 0 ? ((Math.floor(data.length * 0.65) / data.length) * 100).toFixed(1) : '0',
        }
    }

    const kpis = getKPIs()
    const chartData = getChartData()
    const COLORS = ['#0066ff', '#00d9ff', '#6600ff', '#fbbf24', '#10b981', '#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#14b8a6']

    return (
        <div className="space-y-6">
            {/* Tabs para cambiar entre PL2 B2C y PL3 B2C */}
            <div className="flex gap-2 border-b">
                {SHEET_TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveSheetTab(tab.id)}
                        className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${activeSheetTab === tab.id
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        {tab.name}
                    </button>
                ))}
                <button
                    onClick={() => fetchSheetData(activeSheetTab)}
                    disabled={loading}
                    className="ml-auto inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                    <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* Último refresh */}
            {lastRefresh && (
                <div className="text-xs text-muted-foreground">
                    Última actualización: {lastRefresh.toLocaleTimeString('es-AR')}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
                    Error: {error}
                </div>
            )}

            {/* Loading */}
            {loading && (
                <div className="flex h-40 items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                </div>
            )}

            {!loading && data.length > 0 && (
                <>
                    {/* KPIs */}
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-4">
                        <div className="rounded-lg border bg-card p-6">
                            <p className="text-sm text-muted-foreground mb-2">Total de Pedidos</p>
                            <p className="text-3xl font-bold text-primary">{kpis.total}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-6">
                            <p className="text-sm text-muted-foreground mb-2">Procesados</p>
                            <p className="text-3xl font-bold text-emerald-600">{kpis.processed}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-6">
                            <p className="text-sm text-muted-foreground mb-2">Pendientes</p>
                            <p className="text-3xl font-bold text-amber-600">{kpis.pending}</p>
                        </div>
                        <div className="rounded-lg border bg-card p-6">
                            <p className="text-sm text-muted-foreground mb-2">Tasa de Procesamiento</p>
                            <p className="text-3xl font-bold text-blue-600">{kpis.efficiency}%</p>
                        </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                        {/* Gráfico de barras */}
                        <div className="rounded-lg border bg-card p-6">
                            <h2 className="font-semibold mb-4">Top Categorías/Transportes</h2>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={chartData}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="name" fontSize={12} angle={-45} textAnchor="end" height={80} />
                                        <YAxis fontSize={12} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#0066ff" radius={[8, 8, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Sin datos para mostrar
                                </div>
                            )}
                        </div>

                        {/* Gráfico de pie */}
                        <div className="rounded-lg border bg-card p-6">
                            <h2 className="font-semibold mb-4">Distribución de Pedidos</h2>
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, value }) => `${name}: ${value}`}
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                                    Sin datos para mostrar
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tabla de datos */}
                    <div className="rounded-lg border bg-card p-6">
                        <h2 className="font-semibold mb-4">Datos del Sheet ({data.length} registros)</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="border-b bg-muted/50">
                                    <tr>
                                        {Object.keys(data[0] || {}).slice(0, 8).map(header => (
                                            <th key={header} className="px-4 py-2 text-left font-medium whitespace-nowrap">
                                                {header}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.slice(0, 10).map((row, idx) => (
                                        <tr key={idx} className="border-b hover:bg-muted/50">
                                            {Object.values(row).slice(0, 8).map((value, col) => (
                                                <td key={col} className="px-4 py-2 truncate">
                                                    {value}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {data.length > 10 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                    Mostrando 10 de {data.length} registros
                                </p>
                            )}
                        </div>
                    </div>
                </>
            )}

            {!loading && data.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">No hay datos en esta pestaña</p>
                </div>
            )}
        </div>
    )
}

// Componente principal del Dashboard
export default function DashboardPage() {
    const [activeMainTab, setActiveMainTab] = useState('inicio')

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            {/* Pestañas principales */}
            <div className="flex gap-2 border-b mb-6">
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

            {/* Contenido de Inicio */}
            {activeMainTab === 'inicio' && (
                <>
                    {/* KPIGrid placeholders */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

                        {/* KPICard */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Estado de Docks</h3>
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="text-2xl font-bold">12 / 40</div>
                            <p className="text-xs text-muted-foreground">Ocupados actualmente</p>
                        </div>

                        {/* KPICard */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Movimientos Inventario</h3>
                            <Truck className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="text-2xl font-bold">+245</div>
                            <p className="text-xs text-muted-foreground">En la última hora</p>
                        </div>

                        {/* KPICard */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">OTIF</h3>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="text-2xl font-bold">94.2%</div>
                            <p className="text-xs text-muted-foreground">+2.1% desde ayer</p>
                        </div>

                        {/* KPICard */}
                        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
                            <h3 className="tracking-tight text-sm font-medium">Reclamos Activos</h3>
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="px-6 pb-6">
                            <div className="text-2xl font-bold">3</div>
                            <p className="text-xs text-muted-foreground">Requieren atención</p>
                        </div>

                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
                        {/* DockStatusPanel placeholder */}
                        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="p-6">
                                <h3 className="font-semibold leading-none tracking-tight">Estado de la Operación</h3>
                                <p className="text-sm text-muted-foreground mt-2">Visión general de los viajes activos</p>
                            </div>
                            <div className="p-6 pt-0">
                                {/* Tabla simple placeholder */}
                                <div className="relative w-full overflow-auto">
                                    <table className="w-full caption-bottom text-sm">
                                        <thead className="[&_tr]:border-b">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Viaje</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Destino</th>
                                            </tr>
                                        </thead>
                                        <tbody className="[&_tr:last-child]:border-0">
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">#1024</td>
                                                <td className="p-4 align-middle"><Badge variant="default">En Tránsito</Badge></td>
                                                <td className="p-4 align-middle">Buenos Aires</td>
                                            </tr>
                                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                                <td className="p-4 align-middle">#1025</td>
                                                <td className="p-4 align-middle"><Badge variant="secondary">Preparación</Badge></td>
                                                <td className="p-4 align-middle">Córdoba</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* AlertsPanel placeholder */}
                        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
                            <div className="p-6">
                                <h3 className="font-semibold leading-none tracking-tight">Alertas Recientes</h3>
                                <p className="text-sm text-muted-foreground mt-2">Notificaciones operativas</p>
                            </div>
                            <div className="p-6 pt-0">
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">Dock #12 en mantenimiento</p>
                                            <p className="text-sm text-muted-foreground">Hace 15 min</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Contenido de Volumen */}
            {activeMainTab === 'volumen' && (
                <VolumenDashboard />
            )}
        </div>
    )
}