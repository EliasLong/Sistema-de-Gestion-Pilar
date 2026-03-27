'use client'

import React, { useState, useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { Plus, Search, Filter, AlertTriangle, Clock, CheckCircle2, MessageSquareWarning, Image as ImageIcon, MapPin, Package, Tag } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types based on WAREHOUSE PRO GAS Schema
type Nivel = 'Bajo' | 'Medio' | 'Alto'
type Estado = 'PENDIENTE' | 'EN PROCESO' | 'RESUELTO' | 'FINALIZADO'

interface TicketWPro {
    id: number
    createdAt: number
    localizador: string
    sector: string
    nivel: Nivel
    sku: string
    novedad: string
    operario: string
    fotoUrl: string
    estado: Estado
    resolucion: string
    deposito: string
}

// Mock initial data based on the logic
const MOCK_TICKETS: TicketWPro[] = [
    {
        id: 1001,
        createdAt: Date.now() - 3600000 * 2,
        localizador: 'LOC-12345',
        sector: 'RECEPCIÓN',
        nivel: 'Alto',
        sku: 'SKU-9921',
        novedad: 'Llegó mercancía aplastada, compromiso térmico.',
        operario: 'operador@ocasa.com',
        fotoUrl: 'Sin imagen',
        estado: 'PENDIENTE',
        resolucion: '',
        deposito: 'PL2'
    },
    {
        id: 1002,
        createdAt: Date.now() - 3600000 * 24,
        localizador: 'LOC-9988',
        sector: 'EXPEDICIÓN',
        nivel: 'Medio',
        sku: 'SKU-1122',
        novedad: 'Etiqueta ilegible, no se puede despachar.',
        operario: 'supervisor@ocasa.com',
        fotoUrl: 'Sin imagen',
        estado: 'EN PROCESO',
        resolucion: '',
        deposito: 'PL2'
    },
    {
        id: 1003,
        createdAt: Date.now() - 3600000 * 48,
        localizador: 'LOC-5544',
        sector: 'INVENTARIO',
        nivel: 'Bajo',
        sku: 'SKU-0000',
        novedad: 'Diferencia de 1 bulto en consolidado.',
        operario: 'operador2@ocasa.com',
        fotoUrl: 'Sin imagen',
        estado: 'RESUELTO',
        resolucion: 'Ajuste de inventario realizado.',
        deposito: 'PL3'
    }
]

export default function ReporteIncidenciasPage() {
    const { profile } = useProfile()
    
    // State
    const [tickets, setTickets] = useState<TicketWPro[]>(MOCK_TICKETS)
    const [search, setSearch] = useState('')
    const [filtroDeposito, setFiltroDeposito] = useState<string>('Todos')
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Form State
    const [fDeposito, setFDeposito] = useState('PL2')
    const [fSector, setFSector] = useState('')
    const [fNivel, setFNivel] = useState<Nivel>('Bajo')
    const [fLoc, setFLoc] = useState('')
    const [fSku, setFSku] = useState('')
    const [fNovedad, setFNovedad] = useState('')

    // Unique Depositos for filter
    const depositos = useMemo(() => {
        const deps = new Set(tickets.map(t => t.deposito))
        return ['Todos', ...Array.from(deps)]
    }, [tickets])

    // Filter Logic matching GAS `obtenerEstadisticas` / `obtenerUrgentes`
    const filteredTickets = useMemo(() => {
        const query = search.toLowerCase()
        return tickets.filter(t => {
            const matchSearch = String(t.id).includes(query) || t.localizador.toLowerCase().includes(query) || t.sku.toLowerCase().includes(query) || t.novedad.toLowerCase().includes(query)
            const matchDep = filtroDeposito === 'Todos' || t.deposito === filtroDeposito
            return matchSearch && matchDep
        }).sort((a,b) => b.createdAt - a.createdAt)
    }, [tickets, search, filtroDeposito])

    // Stats mimicking GAS stats
    const stats = useMemo(() => {
        return {
            alto: filteredTickets.filter(t => t.nivel === 'Alto' && t.estado !== 'RESUELTO' && t.estado !== 'FINALIZADO').length,
            medio: filteredTickets.filter(t => t.nivel === 'Medio' && t.estado !== 'RESUELTO' && t.estado !== 'FINALIZADO').length,
            bajo: filteredTickets.filter(t => t.nivel === 'Bajo' && t.estado !== 'RESUELTO' && t.estado !== 'FINALIZADO').length,
            pendientes: filteredTickets.filter(t => t.estado === 'PENDIENTE').length,
            enProceso: filteredTickets.filter(t => t.estado === 'EN PROCESO').length,
            total: filteredTickets.length
        }
    }, [filteredTickets])

    // Handlers
    const submitForm = (e: React.FormEvent) => {
        e.preventDefault()
        const newId = tickets.length > 0 ? Math.max(...tickets.map(t => t.id)) + 1 : 1001
        
        const newTicket: TicketWPro = {
            id: newId,
            createdAt: Date.now(),
            localizador: fLoc || 'S/L',
            sector: fSector || 'S/D',
            nivel: fNivel,
            sku: fSku || 'N/A',
            novedad: fNovedad,
            operario: profile?.email || 'Desconocido',
            fotoUrl: 'Sin imagen',
            estado: 'PENDIENTE',
            resolucion: '',
            deposito: fDeposito
        }
        
        setTickets([newTicket, ...tickets])
        
        // Reset
        setFLoc('')
        setFSku('')
        setFNovedad('')
        setIsFormOpen(false)
    }

    const updateEstado = (id: number, nuevoEstado: Estado) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t))
    }

    // Helpers UI
    const getNivelColor = (n: Nivel) => {
        switch(n) {
            case 'Alto': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            case 'Medio': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'Bajo': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto p-4 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Warehouse Pro</h1>
                    <p className="text-muted-foreground mt-1">
                        Monitor visual de incidencias y tareas operativas
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <select 
                        value={filtroDeposito} 
                        onChange={e => setFiltroDeposito(e.target.value)}
                        className="bg-card border-slate-200 dark:border-white/10 rounded-xl px-4 py-2.5 font-medium outline-none"
                    >
                        {depositos.map(d => <option key={d} value={d}>{d === 'Todos' ? 'Todos los Depósitos' : d}</option>)}
                    </select>
                    
                    <button 
                        onClick={() => setIsFormOpen(true)}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                    >
                        <Plus className="w-4 h-4" /> Cargar Novedad
                    </button>
                </div>
            </div>

            {/* KPI Stats Panel */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Total Activos</div>
                    <div className="text-3xl font-bold">{stats.pendientes + stats.enProceso}</div>
                </div>
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-slate-500 mb-1">Pendientes</div>
                    <div className="flex items-baseline gap-2">
                        <div className="text-3xl font-bold">{stats.pendientes}</div>
                    </div>
                </div>
                <div className="bg-card border border-emerald-500/20 dark:bg-emerald-950/10 rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-emerald-500 mb-1">Nivel Bajo</div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.bajo}</div>
                </div>
                <div className="bg-card border border-amber-500/30 dark:bg-amber-950/10 rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-amber-500 mb-1">Nivel Medio</div>
                    <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">{stats.medio}</div>
                </div>
                <div className="bg-card border border-rose-500/30 dark:bg-rose-950/20 rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-rose-500 mb-1">Críticos (Alto)</div>
                    <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.alto}</div>
                </div>
            </div>

            {/* Search */}
            <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    type="text" 
                    placeholder="Buscar por Localizador, SKU, ID..." 
                    className="w-full bg-card border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500" 
                />
            </div>

            {/* KANBAN BOARD */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                
                {/* COLUMN: PENDIENTE */}
                <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-2xl p-4 border border-slate-200 dark:border-white/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2 text-slate-700 dark:text-slate-300">
                            <AlertTriangle className="w-4 h-4 text-amber-500" />
                            PENDIENTE
                        </h2>
                        <span className="bg-slate-200 dark:bg-slate-800 text-xs font-bold px-2.5 py-1 rounded-full">{stats.pendientes}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {filteredTickets.filter(t => t.estado === 'PENDIENTE').map(t => (
                            <TicketCard key={t.id} ticket={t} onStatusChange={updateEstado} />
                        ))}
                    </div>
                </div>

                {/* COLUMN: EN PROCESO */}
                <div className="bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl p-4 border border-blue-100 dark:border-blue-900/30 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2 text-blue-700 dark:text-blue-400">
                            <Clock className="w-4 h-4 text-blue-500" />
                            EN PROCESO
                        </h2>
                        <span className="bg-blue-200 dark:bg-blue-900 text-xs font-bold px-2.5 py-1 rounded-full text-blue-700 dark:text-blue-300">{stats.enProceso}</span>
                    </div>
                    
                    <div className="space-y-3">
                        {filteredTickets.filter(t => t.estado === 'EN PROCESO').map(t => (
                            <TicketCard key={t.id} ticket={t} onStatusChange={updateEstado} />
                        ))}
                    </div>
                </div>

                {/* COLUMN: RESUELTO / FINALIZADO */}
                <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-900/20 space-y-4 opacity-75 hover:opacity-100 transition-opacity">
                    <div className="flex items-center justify-between">
                        <h2 className="font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-500">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            RESUELTOS
                        </h2>
                    </div>
                    
                    <div className="space-y-3">
                        {filteredTickets.filter(t => t.estado === 'RESUELTO' || t.estado === 'FINALIZADO').map(t => (
                            <TicketCard key={t.id} ticket={t} onStatusChange={updateEstado} />
                        ))}
                    </div>
                </div>

            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
                    <div className="bg-card w-full max-w-md h-full shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Carga de Novedad</h2>
                                <p className="text-sm text-muted-foreground">Sistema Warehouse Pro</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors text-slate-500">
                                <Plus className="w-5 h-5 rotate-45" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="wpro-form" onSubmit={submitForm} className="space-y-5">
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Depósito</label>
                                        <input required value={fDeposito} onChange={e=>setFDeposito(e.target.value.toUpperCase())} type="text" className="w-full bg-muted border-transparent rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Sector</label>
                                        <input required value={fSector} onChange={e=>setFSector(e.target.value.toUpperCase())} type="text" placeholder="Ej: RECEPCIÓN" className="w-full bg-muted border-transparent rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 outline-none" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Localizador</label>
                                        <input required value={fLoc} onChange={e=>setFLoc(e.target.value.toUpperCase())} type="text" placeholder="LOC-..." className="w-full bg-muted border-transparent rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">SKU</label>
                                        <input value={fSku} onChange={e=>setFSku(e.target.value.toUpperCase())} type="text" placeholder="SKU-..." className="w-full bg-muted border-transparent rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 outline-none" />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Nivel de Alerta</label>
                                    <div className="flex gap-2 p-1 bg-muted rounded-xl">
                                        {(['Bajo', 'Medio', 'Alto'] as const).map(n => (
                                            <button 
                                                key={n} type="button" onClick={() => setFNivel(n)}
                                                className={cn("flex-1 py-1.5 text-sm font-medium rounded-lg transition-all", fNivel === n ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-background/50")}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Novedad (Detalle)</label>
                                    <textarea required value={fNovedad} onChange={e=>setFNovedad(e.target.value)} placeholder="Describe la incidencia o novedad encontrada..." className="w-full h-24 bg-muted border-transparent rounded-lg px-3 py-3 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 outline-none resize-none"></textarea>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Adjunto Fotográfico</label>
                                    <div className="w-full border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-not-allowed opacity-70">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                                        <span className="text-sm font-medium">Subida de imágenes próximamente disponible</span>
                                        <span className="text-xs text-muted-foreground mt-1">Conectando con Supabase Storage...</span>
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t bg-muted/30 shrink-0">
                            <button type="submit" form="wpro-form" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                Emitir Novedad
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )

}

// INNER COMPONENTS
function TicketCard({ ticket, onStatusChange }: { ticket: TicketWPro, onStatusChange: (id: number, e: Estado) => void }) {
    const getNivelColor = (n: Nivel) => {
        switch(n) {
            case 'Alto': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
            case 'Medio': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'Bajo': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
    }

    return (
        <div className="bg-card border dark:border-white/10 rounded-xl p-4 shadow-sm group">
            <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-slate-500">#{ticket.id}</span>
                    <div className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border", getNivelColor(ticket.nivel))}>
                        {ticket.nivel}
                    </div>
                </div>
                {/* Render minimal actions based on status */}
                {ticket.estado === 'PENDIENTE' && (
                    <button onClick={() => onStatusChange(ticket.id, 'EN PROCESO')} className="text-xs font-bold bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 px-3 py-1 rounded-lg transition-colors">
                        Procesar
                    </button>
                )}
                {ticket.estado === 'EN PROCESO' && (
                    <button onClick={() => onStatusChange(ticket.id, 'RESUELTO')} className="text-xs font-bold bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 px-3 py-1 rounded-lg transition-colors">
                        Cerrar
                    </button>
                )}
                {(ticket.estado === 'RESUELTO' || ticket.estado === 'FINALIZADO') && (
                    <span className="text-xs font-medium text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Terminado
                    </span>
                )}
            </div>

            <div className="space-y-1.5 mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                    {ticket.localizador}
                </div>
                {ticket.sku !== 'N/A' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Tag className="w-3.5 h-3.5" />
                        {ticket.sku}
                    </div>
                )}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    {ticket.sector} • {ticket.deposito}
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 text-sm border dark:border-white/5 line-clamp-3">
                <span className="font-bold text-rose-500 mr-2">Novedad:</span> 
                {ticket.novedad}
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div>{ticket.operario.split('@')[0]}</div>
            </div>
        </div>
    )
}
