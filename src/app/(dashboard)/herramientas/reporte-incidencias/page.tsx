'use client'

import React, { useState, useMemo } from 'react'
import { useProfile } from '@/hooks/useProfile'
import { AlertTriangle, Clock, Search, ExternalLink, Plus, Filter, MessageSquareWarning, X, CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type TipoIncidencia = 'Faltante' | 'Rotura' | 'Sistemas' | 'Accidente' | 'Otro'
type Gravedad = 'Baja' | 'Media' | 'Alta' | 'Crítica'
type Operacion = 'B2C' | 'B2B' | 'Flota' | 'Interna'
type EstadoIncidencia = 'Abierto' | 'En Revisión' | 'Resuelto'

interface Ticket {
    id: string
    createdAt: number
    tipo: TipoIncidencia
    gravedad: Gravedad
    operacion: Operacion
    viaje: string
    descripcion: string
    estado: EstadoIncidencia
    reporter: string
}

const MOCK_TICKETS: Ticket[] = [
    {
        id: 'INC-9012',
        createdAt: Date.now() - 3600000 * 2,
        tipo: 'Rotura',
        gravedad: 'Media',
        operacion: 'B2C',
        viaje: 'OCA 1234',
        descripcion: 'Paquete de logística reversa llegó con embalaje dañado y contenido expuesto.',
        estado: 'En Revisión',
        reporter: 'operador@ocasa.com'
    },
    {
        id: 'INC-9013',
        createdAt: Date.now() - 3600000 * 24,
        tipo: 'Faltante',
        gravedad: 'Alta',
        operacion: 'B2B',
        viaje: 'AND 9923',
        descripcion: 'Faltan 2 bultos en el manifiesto de carga del proveedor.',
        estado: 'Abierto',
        reporter: 'supervisor@ocasa.com'
    }
]

export default function ReporteIncidenciasPage() {
    const { profile } = useProfile()
    
    // State
    const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS)
    const [search, setSearch] = useState('')
    const [filterEstado, setFilterEstado] = useState<EstadoIncidencia | 'Todos'>('Todos')
    const [isFormOpen, setIsFormOpen] = useState(false)

    // Form State
    const [fTipo, setFTipo] = useState<TipoIncidencia>('Otro')
    const [fGravedad, setFGravedad] = useState<Gravedad>('Media')
    const [fOperacion, setFOperacion] = useState<Operacion>('Interna')
    const [fViaje, setFViaje] = useState('')
    const [fDesc, setFDesc] = useState('')

    // Derived
    const filteredTickets = useMemo(() => {
        const query = search.toLowerCase()
        return tickets.filter(t => {
            const matchSearch = t.id.toLowerCase().includes(query) || t.descripcion.toLowerCase().includes(query) || t.viaje.toLowerCase().includes(query)
            const matchEstado = filterEstado === 'Todos' || t.estado === filterEstado
            return matchSearch && matchEstado
        }).sort((a,b) => b.createdAt - a.createdAt)
    }, [tickets, search, filterEstado])

    const stats = useMemo(() => {
        return {
            abiertos: tickets.filter(t => t.estado === 'Abierto').length,
            revision: tickets.filter(t => t.estado === 'En Revisión').length,
            resueltos: tickets.filter(t => t.estado === 'Resuelto').length,
            criticos: tickets.filter(t => t.gravedad === 'Crítica' && t.estado !== 'Resuelto').length
        }
    }, [tickets])

    // Handlers
    const submitForm = (e: React.FormEvent) => {
        e.preventDefault()
        const newTicket: Ticket = {
            id: `INC-${Math.floor(1000 + Math.random() * 9000)}`,
            createdAt: Date.now(),
            tipo: fTipo,
            gravedad: fGravedad,
            operacion: fOperacion,
            viaje: fViaje,
            descripcion: fDesc,
            estado: 'Abierto',
            reporter: profile?.email || 'Usuario Desconocido'
        }
        setTickets([newTicket, ...tickets])
        
        // Reset
        setFTipo('Otro')
        setFGravedad('Media')
        setFOperacion('Interna')
        setFViaje('')
        setFDesc('')
        setIsFormOpen(false)
    }

    const toggleEstado = (id: string, nuevoEstado: EstadoIncidencia) => {
        setTickets(tickets.map(t => t.id === id ? { ...t, estado: nuevoEstado } : t))
    }

    // Helpers
    const getGravedadColor = (g: Gravedad) => {
        switch(g) {
            case 'Baja': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'Media': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'Alta': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
            case 'Crítica': return 'bg-rose-500/10 text-rose-500 border-rose-500/20'
        }
    }

    const getEstadoColor = (e: EstadoIncidencia) => {
        switch(e) {
            case 'Abierto': return 'bg-slate-800 text-slate-300 border-slate-700'
            case 'En Revisión': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
            case 'Resuelto': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        }
    }

    const getTipoIcon = (t: TipoIncidencia) => {
        switch(t) {
            case 'Rotura': return <AlertTriangle className="w-4 h-4" />
            case 'Faltante': return <Search className="w-4 h-4" />
            case 'Accidente': return <AlertCircle className="w-4 h-4" />
            case 'Sistemas': return <Info className="w-4 h-4" />
            default: return <MessageSquareWarning className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto p-4 md:p-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Reporte de Incidencias</h1>
                    <p className="text-muted-foreground mt-1">
                        Centro de control de tickets, roturas y novedades operativas.
                    </p>
                </div>
                <button 
                    onClick={() => setIsFormOpen(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-lg shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" /> Nuevo Reporte
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-muted-foreground mb-1">Abiertos</div>
                    <div className="text-3xl font-bold">{stats.abiertos}</div>
                </div>
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-blue-500 mb-1">En Revisión</div>
                    <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.revision}</div>
                </div>
                <div className="bg-card border rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-emerald-500 mb-1">Resueltos</div>
                    <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">{stats.resueltos}</div>
                </div>
                <div className="bg-card border border-rose-500/30 dark:bg-rose-950/20 rounded-2xl p-5 shadow-sm">
                    <div className="text-sm font-medium text-rose-500 mb-1">Alertas Críticas</div>
                    <div className="text-3xl font-bold text-rose-600 dark:text-rose-400">{stats.criticos}</div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-card border rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center shadow-sm">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        type="text" 
                        placeholder="Buscar por ID, Viaje o descripción..." 
                        className="w-full bg-muted/50 border-transparent focus:border-blue-500 focus:bg-background rounded-xl pl-9 pr-4 py-2 text-sm transition-all focus:outline-none focus:ring-1 focus:ring-blue-500" 
                    />
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
                    {(['Todos', 'Abierto', 'En Revisión', 'Resuelto'] as const).map(e => (
                        <button 
                            key={e} 
                            onClick={() => setFilterEstado(e)}
                            className={cn(
                                "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors",
                                filterEstado === e 
                                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900" 
                                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                        >
                            {e}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets Feed */}
            <div className="space-y-4">
                {filteredTickets.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-2xl bg-muted/20">
                        <CheckCircle2 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                        <h3 className="text-lg font-medium">Bandeja Limpia</h3>
                        <p className="text-sm text-muted-foreground">No se encontraron incidencias con estos filtros.</p>
                    </div>
                ) : (
                    filteredTickets.map(t => (
                        <div key={t.id} className="bg-card border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                                <div className="flex items-start gap-3">
                                    <div className={cn("p-2.5 rounded-xl border", getGravedadColor(t.gravedad))}>
                                        {getTipoIcon(t.tipo)}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-bold text-lg leading-none">{t.id}</h3>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted text-muted-foreground">{t.operacion}</span>
                                            {t.viaje && <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">Viaje: {t.viaje}</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3" />
                                            {new Date(t.createdAt).toLocaleString()}
                                            <span>•</span>
                                            <span>Por {t.reporter.split('@')[0]}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <select 
                                        value={t.estado}
                                        onChange={(e) => toggleEstado(t.id, e.target.value as EstadoIncidencia)}
                                        className={cn(
                                            "text-xs font-bold px-3 py-1.5 rounded-lg border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 dark:focus:ring-offset-slate-900 transition-all",
                                            getEstadoColor(t.estado)
                                        )}
                                    >
                                        <option value="Abierto">Abierto</option>
                                        <option value="En Revisión">En Revisión</option>
                                        <option value="Resuelto">Resuelto</option>
                                    </select>
                                </div>
                            </div>
                            
                            <div className="bg-muted/30 rounded-xl p-4 text-sm leading-relaxed border border-transparent dark:border-white/5">
                                <span className="font-semibold mr-2">{t.tipo}:</span> 
                                {t.descripcion}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Form */}
            {isFormOpen && (
                <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex justify-end">
                    <div className="bg-card w-full max-w-md h-full shadow-2xl border-l flex flex-col animate-in slide-in-from-right duration-300">
                        <div className="p-6 border-b flex items-center justify-between shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Nueva Incidencia</h2>
                                <p className="text-sm text-muted-foreground">Registra un nuevo suceso</p>
                            </div>
                            <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <form id="incident-form" onSubmit={submitForm} className="space-y-5">
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Clasificación</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground mb-1 block">Tipo</span>
                                            <select required value={fTipo} onChange={e=>setFTipo(e.target.value as TipoIncidencia)} className="w-full bg-muted border-transparent rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                                                <option value="Faltante">Faltante</option>
                                                <option value="Rotura">Rotura</option>
                                                <option value="Sistemas">Sistemas</option>
                                                <option value="Accidente">Accidente</option>
                                                <option value="Otro">Otro</option>
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground mb-1 block">Gravedad</span>
                                            <select required value={fGravedad} onChange={e=>setFGravedad(e.target.value as Gravedad)} className="w-full bg-muted border-transparent rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                                                <option value="Baja">Baja</option>
                                                <option value="Media">Media</option>
                                                <option value="Alta">Alta</option>
                                                <option value="Crítica">Crítica</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Contexto Operativo</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <span className="text-xs text-muted-foreground mb-1 block">Sector</span>
                                            <select required value={fOperacion} onChange={e=>setFOperacion(e.target.value as Operacion)} className="w-full bg-muted border-transparent rounded-lg px-3 py-2.5 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 focus:ring-blue-500 outline-none transition-all">
                                                <option value="B2C">B2C</option>
                                                <option value="B2B">B2B</option>
                                                <option value="Flota">Flota Propia</option>
                                                <option value="Interna">Procesos Internos</option>
                                            </select>
                                        </div>
                                        <div>
                                            <span className="text-xs text-muted-foreground mb-1 block">ID Referencia (Opcional)</span>
                                            <input value={fViaje} onChange={e=>setFViaje(e.target.value)} type="text" placeholder="Viaje / Guía..." className="w-full bg-muted border-transparent rounded-lg px-3 py-2 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 focus:ring-blue-500 outline-none transition-all" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium block">Descripción Detallada</label>
                                    <textarea required value={fDesc} onChange={e=>setFDesc(e.target.value)} placeholder="Describe qué sucedió, evidencias visuales, y acciones iniciales tomadas..." className="w-full h-32 bg-muted border-transparent rounded-lg px-3 py-3 text-sm focus:border-blue-500 focus:bg-background focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"></textarea>
                                </div>
                            </form>
                        </div>

                        <div className="p-6 border-t bg-muted/30 shrink-0">
                            <button type="submit" form="incident-form" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/20">
                                Registrar Incidencia
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
