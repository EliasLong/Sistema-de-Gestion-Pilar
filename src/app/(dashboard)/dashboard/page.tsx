// src/app/(dashboard)/dashboard/page.tsx

'use client'

import { useState, useEffect } from 'react'
import { Truck, MapPin, AlertCircle, TrendingUp, RefreshCw, BarChart3, PieChart as PieChartIcon, Activity, Package, Layers } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line 
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

// Colores Corporativos OCASA y Semáforo
const COLORS_OCASA = {
    primary: '#003366', // Navy OCASA
    secondary: '#00AEEF', // Light Blue OCASA
    accent: '#F97316', // Orange
    success: '#00cc00', // Green Traffic Light
    warning: '#ffff00', // Yellow Traffic Light
    danger: '#ff0000', // Red Traffic Light
    text: '#333333',
    chart: ['#003366', '#00AEEF', '#006699', '#3399FF', '#66CCFF']
}

interface SheetData {
    [key: string]: string | number
}

// Función para parsear la fecha del sheet "9 abr 2026"
const parseSheetDate = (dateStr: string) => {
    if (!dateStr) return new Date()
    const months: { [key: string]: number } = {
        'ene': 0, 'feb': 1, 'mar': 2, 'abr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'ago': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dic': 11
    }
    const parts = dateStr.toLowerCase().split(' ')
    if (parts.length < 3) return new Date()
    
    const day = parseInt(parts[0])
    const month = months[parts[1]] ?? 0
    const year = parseInt(parts[2])
    return new Date(year, month, day)
}

function VolumenDashboard() {
    const [warehouse, setWarehouse] = useState<'pl2' | 'pl3'>('pl2')
    const [data, setData] = useState<SheetData[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const fetchSheetData = async () => {
        try {
            setLoading(true)
            const gid = warehouse === 'pl2' ? 0 : 1
            const url = `https://docs.google.com/spreadsheets/d/1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY/gviz/tq?tqx=out:csv&gid=${gid}`
            const response = await fetch(url)
            if (!response.ok) throw new Error('Error al conectar con Google Sheets')
            
            const csv = await response.text()
            const rows = csv.split('\n').filter(r => r.trim())
            if (rows.length < 2) {
                setData([])
                return
            }

            const headers = rows[0].split(',').map(h => h.trim().replace(/"/g, ''))
            const parsed = rows.slice(1).map(row => {
                const values = row.split(',').map(v => v.trim().replace(/"/g, ''))
                const obj: SheetData = {}
                headers.forEach((h, i) => obj[h] = values[i] || '')
                return obj
            })
            setData(parsed)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSheetData()
    }, [warehouse])

    // Lógica de mapeo según PL2 o PL3
    const mapRow = (row: SheetData) => {
        const isPL3 = warehouse === 'pl3'
        return {
            nroPedido: row['Nro Pedido'] || '',
            vendedor: row['Nombre Cliente'] || row['Vendedor'] || '',
            vtoPedido: row['Vto OC'] || '',
            transporte: row['Transporte'] || 'S/A',
            articulo: isPL3 ? row['Articulo'] : row['Articulo'], // Ajustar si hay desfase real en los nombres de keys
            tamaño: warehouse === 'pl2' ? row['Tamaño PL2'] : row['Tamaño PL3'],
            descripcion: row['Descripción Articulo'] || row['Descripción'],
            cantidad: row['Cantidad'] || '0'
        }
    }

    const getVencimientoStatus = (vtoStr: string) => {
        const vtoDate = parseSheetDate(vtoStr)
        const now = new Date()
        const diffHours = (now.getTime() - vtoDate.getTime()) / (1000 * 60 * 60)
        
        if (diffHours <= 24) return 'verde'
        if (diffHours <= 48) return 'amarillo'
        return 'rojo'
    }

    const getVencimientoData = () => {
        const counts = { verde: 0, amarillo: 0, rojo: 0 }
        data.forEach(row => {
            const status = getVencimientoStatus(row['Vto OC'] as string)
            counts[status]++
        })
        const total = data.length || 1
        return [
            { name: 'Al día', value: (counts.verde / total) * 100, count: counts.verde, color: COLORS_OCASA.success },
            { name: '24-48h', value: (counts.amarillo / total) * 100, count: counts.amarillo, color: COLORS_OCASA.warning },
            { name: '>48h', value: (counts.rojo / total) * 100, count: counts.rojo, color: COLORS_OCASA.danger }
        ]
    }

    const getOperadorData = () => {
        const grouped: { [key: string]: number } = {}
        data.forEach(row => {
            const key = (row['Transporte'] || 'S/A').toString()
            grouped[key] = (grouped[key] || 0) + 1
        })
        return Object.entries(grouped).map(([name, value]) => ({ name, value }))
            .sort((a,b) => b.value - a.value).slice(0, 5)
    }

    const vencidosCount = data.filter(row => getVencimientoStatus(row['Vto OC'] as string) !== 'verde').length

    return (
        <div className="space-y-6">
            {/* Cabecera con Logo y Selector de Almacén */}
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setWarehouse('pl2')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${warehouse === 'pl2' ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}
                    >
                        B2C PL2
                    </button>
                    <button 
                        onClick={() => setWarehouse('pl3')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${warehouse === 'pl3' ? 'bg-primary text-white shadow-lg' : 'bg-muted text-muted-foreground'}`}
                    >
                        B2C PL3
                    </button>
                </div>
                <div className="flex flex-col items-end">
                    <h1 className="text-2xl font-black text-[#003366]">OCASA</h1>
                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{warehouse} B2C</span>
                </div>
            </div>

            {loading ? (
                <div className="flex h-96 items-center justify-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-primary opacity-20" />
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    {/* Top Section: Charts & KPIs */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* Pedidos x Operador */}
                        <div className="lg:col-span-3 bg-white p-4 rounded-xl border shadow-sm">
                            <h3 className="text-sm font-bold text-[#003366] mb-4">Pedidos x Operador</h3>
                            <div className="h-[200px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={getOperadorData()}
                                            innerRadius={50}
                                            outerRadius={70}
                                            paddingAngle={4}
                                            dataKey="value"
                                        >
                                            {getOperadorData().map((_, i) => (
                                                <Cell key={i} fill={COLORS_OCASA.chart[i % COLORS_OCASA.chart.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* KPI Boxes */}
                        <div className="lg:col-span-4 grid grid-cols-2 gap-4 h-full">
                            <div className="flex flex-col items-center justify-center border-2 border-slate-200 rounded-lg bg-white p-4 shadow-sm">
                                <span className="text-sm font-bold text-[#003366] border-b pb-1 mb-2 px-4">Pedidos Totales</span>
                                <span className="text-5xl font-black text-slate-800">{data.length}</span>
                            </div>
                            <div className="flex flex-col items-center justify-center border-2 border-slate-200 rounded-lg bg-white p-4 shadow-sm">
                                <span className="text-sm font-bold text-[#003366] border-b pb-1 mb-2 px-4">Pedidos Vencidos</span>
                                <span className="text-5xl font-black text-rose-600">{vencidosCount}</span>
                            </div>
                        </div>

                        {/* Vencimiento Pedidos */}
                        <div className="lg:col-span-5 bg-white p-4 rounded-xl border shadow-sm h-full">
                            <h3 className="text-sm font-bold text-[#003366] mb-4 flex justify-between">
                                Vencimiento pedidos
                                <span className="text-xs font-normal text-slate-400 flex items-center gap-1">
                                    <div className="h-2 w-2 rounded-full bg-[#00cc00]" /> Al día
                                </span>
                            </h3>
                            <div className="h-[120px] flex items-center">
                                <ResponsiveContainer width="100%" height={40}>
                                    <BarChart data={[{ name: 'Total', ...getVencimientoData().reduce((acc, curr) => ({ ...acc, [curr.name]: curr.value }), {}) }]} layout="vertical">
                                        <XAxis type="number" hide domain={[0, 100]} />
                                        <YAxis type="category" dataKey="name" hide />
                                        {getVencimientoData().map((entry) => (
                                            <Bar 
                                                key={entry.name} 
                                                dataKey={entry.name} 
                                                stackId="a" 
                                                fill={entry.color} 
                                                radius={0}
                                            />
                                        ))}
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400 mt-2">
                                <span>0%</span>
                                <span>20%</span>
                                <span>Recuente de Nro Pedido</span>
                                <span>80%</span>
                                <span>100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        {['Nro Pedido', 'Vendedor', 'Vto pedido', 'Transporte', 'Articulo', warehouse === 'pl2' ? 'Tamaño PL2' : 'Tamaño PL3', 'Descripcion', 'Cantidad de bultos'].map(h => (
                                            <th key={h} className="px-4 py-4 font-bold text-slate-700 whitespace-nowrap">{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {data.map((row, idx) => {
                                        const m = mapRow(row)
                                        return (
                                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-900 border-r">{m.nroPedido}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r">{m.vendedor}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r">{m.vtoPedido}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r">{m.transporte}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r font-mono text-xs">{m.articulo}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r">{m.tamaño}</td>
                                                <td className="px-4 py-3 text-slate-600 border-r text-xs max-w-[200px] truncate">{m.descripcion}</td>
                                                <td className="px-4 py-3 text-center font-bold text-slate-800">{m.cantidad}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-50 font-bold border-t">
                                    <tr>
                                        <td colSpan={7} className="px-4 py-3 text-slate-700">Total</td>
                                        <td className="px-4 py-3 text-center text-slate-900">{data.length}</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </motion.div>
            )}

            {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-center gap-4 text-red-800">
                    <AlertCircle className="h-6 w-6" />
                    <p className="font-semibold">{error}</p>
                </div>
            )}
        </div>
    )
}

export default function DashboardPage() {
    const [activeMainTab, setActiveMainTab] = useState('volumen') // Forzado para visualizar el cambio

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