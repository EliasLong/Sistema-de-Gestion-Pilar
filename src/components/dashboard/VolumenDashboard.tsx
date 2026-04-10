// src/components/dashboard/VolumenDashboard.tsx

'use client'

import { useState, useEffect } from 'react'
import { RefreshCw, AlertCircle } from 'lucide-react'
import { 
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer 
} from 'recharts'
import { motion } from 'framer-motion'

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

export function VolumenDashboard() {
    const [warehouse, setWarehouse] = useState<'pl2' | 'pl3'>('pl2')
    const [data, setData] = useState<SheetData[]>([])
    const [loading, setLoading] = useState(true)
    const [lastUpdated, setLastUpdated] = useState<string | null>(null)
    const [isRefreshing, setIsRefreshing] = useState(false)

    const fetchSheetData = async (silent = false) => {
        try {
            if (!silent) setLoading(true)
            else setIsRefreshing(true)

            const gid = warehouse === 'pl2' ? 0 : 1150456694
            const url = `https://docs.google.com/spreadsheets/d/1NmNAOaUSnUknHLCiqPOIqaX8qdqUUzEZh0qSyZKRKJY/gviz/tq?tqx=out:csv&gid=${gid}&_t=${Date.now()}`
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

            // Filtro permanente solicitado: Excluir 'FLOTA PROPIA CON COORDINACION'
            const filtered = parsed.filter(row => {
                const transporte = String(row['Transporte'] || '').trim().toUpperCase()
                return transporte !== 'FLOTA PROPIA CON COORDINACION'
            })

            setData(filtered)
            setLastUpdated(new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos')
        } finally {
            setLoading(false)
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchSheetData()
        
        // Auto-refresco cada 5 minutos
        const interval = setInterval(() => {
            fetchSheetData(true)
        }, 5 * 60 * 1000)

        return () => clearInterval(interval)
    }, [warehouse])

    const mapRow = (row: SheetData) => {
        const isPL3 = warehouse === 'pl3'
        return {
            nroPedido: row['Nro Pedido'] || '',
            vendedor: row['Nombre Cliente'] || row['Vendedor'] || '',
            vtoPedido: row['Vto OC'] || '',
            transporte: row['Transporte'] || 'S/A',
            articulo: isPL3 ? row['Articulo'] : row['Articulo'],
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
            <div className="flex items-center justify-between">
                <div className="flex gap-4">
                    <button 
                        onClick={() => setWarehouse('pl2')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${warehouse === 'pl2' ? 'bg-[#003366] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
                    >
                        B2C PL2
                    </button>
                    <button 
                        onClick={() => setWarehouse('pl3')}
                        className={`px-6 py-2 rounded-lg font-bold transition-all ${warehouse === 'pl3' ? 'bg-[#003366] text-white shadow-lg' : 'bg-slate-100 text-slate-500'}`}
                    >
                        B2C PL3
                    </button>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-black text-[#003366]">OCASA</h1>
                        <button 
                            onClick={() => fetchSheetData(true)} 
                            disabled={isRefreshing}
                            className={`p-1.5 rounded-full hover:bg-slate-100 transition-colors ${isRefreshing ? 'animate-spin text-slate-400' : 'text-[#003366]'}`}
                            title="Actualizar datos ahora"
                        >
                            <RefreshCw className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{warehouse} B2C</span>
                        {lastUpdated && (
                            <span className="text-[10px] text-slate-400 italic">Actualizado: {lastUpdated}</span>
                        )}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex h-96 items-center justify-center">
                    <RefreshCw className="h-12 w-12 animate-spin text-[#003366] opacity-20" />
                </div>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 border-b">
                                    <tr>
                                        {['Nro Pedido', 'Vendedor', 'Vto pedido', 'Transporte', 'Articulo', warehouse === 'pl2' ? 'Tamaño PL2' : 'Tamaño PL3', 'Descripcion', 'Cantidad'].map(h => (
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
