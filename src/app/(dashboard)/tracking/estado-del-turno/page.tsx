'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useEstadoTurno } from '@/hooks/useEstadoTurno'
import { useProfile } from '@/hooks/useProfile'
import { RefreshCcw, Search, Mail, Play, Square } from 'lucide-react'
import { cn } from '@/lib/utils'

// Types
type ViewType = 'monitor' | 'dash'
type FilterType = 'ALL' | 'B2C' | 'FLOTA' | 'B2B'

interface ShiftStartData {
    startTime: number
    pickers: Record<string, { op: string, pkgs: number }>
    etiquetadores: Record<string, { etiq: string, pkgs: number }>
}

export default function EstadoDelTurnoPage() {
    const { profile } = useProfile()
    const { trips, isLoading, syncAll, lastSync } = useEstadoTurno()

    const [view, setView] = useState<ViewType>('monitor')
    const [filter, setFilter] = useState<FilterType>('ALL')
    const [search, setSearch] = useState('')
    
    const [shiftData, setShiftData] = useState<ShiftStartData | null>(null)
    const [isFinTurnoOpen, setIsFinTurnoOpen] = useState(false)
    const [reportText, setReportText] = useState('')

    // Load shift data on mount
    useEffect(() => {
        const stored = localStorage.getItem('pl2_shift_start')
        if (stored) {
            try { setShiftData(JSON.parse(stored)) } catch(e) {}
        }
    }, [])

    // Auth & Initial Sync
    const [hasInitialSync, setHasInitialSync] = useState(false)
    useEffect(() => {
        if (profile?.email && !hasInitialSync) {
            syncAll()
            setHasInitialSync(true)
        }
    }, [profile?.email, hasInitialSync, syncAll])

    // Derived Data
    const filteredTrips = useMemo(() => {
        const query = search.toLowerCase()
        return trips.filter(t => {
            const matchFilter = filter === 'ALL' || t.type === filter || (filter === 'B2C' && t.type === 'FLOTA')
            const matchSearch = t.id.toLowerCase().includes(query) || t.op.toLowerCase().includes(query) || t.carrier.toLowerCase().includes(query)
            return matchFilter && matchSearch
        })
    }, [trips, filter, search])

    const performance = useMemo(() => {
        let pData = { pickers: {} as Record<string, number>, etiqs: {} as Record<string, number>, totalPick: 0, totalEtiq: 0 }
        if (!shiftData) return pData
        
        trips.forEach(t => {
            if (t.op !== '---') {
                const prev = shiftData.pickers[t.id]
                let diff = (prev && prev.op === t.op) ? Math.max(0, t.pkgs - prev.pkgs) : t.pkgs
                if (diff > 0) { pData.pickers[t.op] = (pData.pickers[t.op] || 0) + diff; pData.totalPick += diff }
            }
            if (t.etiq !== '---') {
                const prev = shiftData.etiquetadores[t.id]
                let diff = (prev && prev.etiq === t.etiq) ? Math.max(0, t.pkgs - prev.pkgs) : t.pkgs
                if (diff > 0) { pData.etiqs[t.etiq] = (pData.etiqs[t.etiq] || 0) + diff; pData.totalEtiq += diff }
            }
        })
        return pData
    }, [trips, shiftData])

    const dashboardStats = useMemo(() => {
        const today = new Date().setHours(0,0,0,0)
        let prog = 0, desp = 0, pend = 0
        trips.forEach(t => {
            const dateParts = t.fecha.split('/')
            if (dateParts.length >= 3) {
                const tDate = new Date(parseInt(dateParts[2]), parseInt(dateParts[1])-1, parseInt(dateParts[0]))
                const isToday = tDate.getTime() === today
                if (t.type === 'FLOTA' || (t.originalType === 'B2B' && isToday)) {
                    prog++
                    if (t.status === 5) desp++; else pend++
                }
            }
        })
        const perc = prog > 0 ? Math.round((desp/prog)*100) : 0
        return { prog, desp, pend, perc }
    }, [trips])

    // Handlers
    const iniciarJornada = () => {
        const snapshot: ShiftStartData = { startTime: new Date().getTime(), pickers: {}, etiquetadores: {} }
        trips.forEach(t => {
            if (t.op !== '---') snapshot.pickers[t.id] = { op: t.op, pkgs: t.pkgs }
            if (t.etiq !== '---') snapshot.etiquetadores[t.id] = { etiq: t.etiq, pkgs: t.pkgs }
        })
        setShiftData(snapshot)
        localStorage.setItem('pl2_shift_start', JSON.stringify(snapshot))
    }

    const abrirFinTurno = () => {
        let bodyText = `PL2 REPORTE JORNADA - ${new Date().toLocaleString()}\nUsuario: ${profile?.email || 'N/A'}\n\n`
        bodyText += `PICKEADOS: ${performance.totalPick}\n`
        Object.entries(performance.pickers).sort((a,b)=>b[1]-a[1]).forEach(([n,v]) => bodyText += `- ${n}: ${v}\n`)
        bodyText += `\nETIQUETADOS: ${performance.totalEtiq}\n`
        Object.entries(performance.etiqs).sort((a,b)=>b[1]-a[1]).forEach(([n,v]) => bodyText += `- ${n}: ${v}\n`)
        
        setReportText(bodyText)
        setIsFinTurnoOpen(true)
    }

    const enviarReporte = () => {
        const dateStr = new Date().toLocaleString()
        const mailtoUrl = `mailto:${profile?.email || ''}?subject=PL2 Reporte Jornada ${dateStr}&body=${encodeURIComponent(reportText)}`
        window.open(mailtoUrl, '_blank')
        setTimeout(() => {
            setShiftData(null)
            localStorage.removeItem('pl2_shift_start')
            setIsFinTurnoOpen(false)
        }, 500)
    }

    // Sub-components
    const renderKanbanColumn = (num: string, title: string, colorClass: string, status: number) => {
        const colTrips = filteredTrips.filter(t => t.status === status)
        return (
            <div key={status} className="flex flex-col min-w-[300px] h-[calc(100vh-200px)] bg-slate-900/40 border border-white/5 last:border-r-0 rounded-2xl overflow-hidden shrink-0">
                <div className={cn("p-4 flex items-center justify-between border-b border-white/5", colorClass)}>
                    <h3 className={cn("text-[10px] font-bold uppercase tracking-widest", colorClass.replace('bg-', 'text-').replace('/5', ''))}>{num}. {title}</h3>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded", colorClass.replace('/5', '/20').replace('bg-', 'text-').replace('-500', '-400'))}>{colTrips.length}</span>
                </div>
                <div className="p-3 space-y-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-700">
                    {colTrips.map(t => (
                        <div key={t.id} className={cn(
                            "p-4 rounded-xl border border-white/5 bg-slate-800 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:bg-slate-700 border-l-4",
                            t.type === 'B2C' ? 'border-l-rose-500' : t.type === 'FLOTA' ? 'border-l-amber-500' : 'border-l-sky-500'
                        )}>
                            <div className="flex justify-between items-start mb-2"><span className="text-[11px] font-bold text-white">#{t.id}</span></div>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{t.fecha}</p>
                            <p className="text-[10px] text-slate-300 font-medium truncate">{t.carrier}</p>
                            <div className="flex justify-between items-end pt-1">
                                <p className="text-[10px] text-blue-400 font-bold">{t.pkgs} Bultos</p>
                                <p className="text-[9px] text-slate-500 italic truncate">{t.op}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-[calc(100vh-80px)] bg-[#060912] text-slate-200 font-sans -m-6 h-full overflow-hidden flex flex-col">
            {/* Loader */}
            {isLoading && trips.length === 0 && (
                <div className="fixed inset-0 bg-[#060912]/80 backdrop-blur-sm z-[100] flex items-center justify-center">
                    <div className="text-center">
                        <RefreshCcw className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-500 animate-pulse">Sincronizando</p>
                    </div>
                </div>
            )}

            {/* Nav */}
            <nav className="h-20 border-b border-white/5 bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20">PL2</div>
                        <div className="hidden md:block">
                            <span className="font-bold text-lg block leading-none tracking-tight">Logística <span className="text-blue-500">B2C/B2B</span></span>
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest truncate max-w-[150px]">{profile?.email || 'Cargando...'}</span>
                        </div>
                    </div>
                    <div className="flex gap-1 bg-slate-900 rounded-xl p-1 border border-white/5">
                        <button onClick={() => setView('monitor')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition", view === 'monitor' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white')}>Monitor</button>
                        <button onClick={() => setView('dash')} className={cn("px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition", view === 'dash' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white')}>KPIs</button>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {shiftData ? (
                        <button onClick={abrirFinTurno} className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"><Square className="h-3 w-3 fill-current" /> Fin de Turno</button>
                    ) : (
                        <button onClick={iniciarJornada} className="px-4 py-2 bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider flex items-center gap-2"><Play className="h-3 w-3 fill-current" /> Iniciar Jornada</button>
                    )}
                    
                    <div className="text-right hidden sm:block border-l border-white/10 pl-4">
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{lastSync ? lastSync.toLocaleTimeString() : 'Sincronizando...'}</div>
                        <div className="flex items-center justify-end gap-1.5 mt-0.5">
                            <span className="text-[9px] font-bold text-green-500 uppercase tracking-tighter">Sistemas Live</span>
                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_#22c55e]"></div>
                        </div>
                    </div>
                    <button onClick={syncAll} className="p-2.5 bg-white/5 hover:bg-white/10 rounded-xl transition-all border border-white/10">
                        <RefreshCcw className={cn("w-5 h-5 text-slate-400", isLoading && "animate-spin")} />
                    </button>
                </div>
            </nav>

            {/* Filters */}
            {view === 'monitor' && (
                <div className="bg-slate-950/40 border-b border-white/5 px-6 py-3 flex flex-wrap items-center gap-4 shrink-0">
                    <div className="flex items-center gap-1.5 bg-slate-900/50 p-1 rounded-xl border border-white/5">
                        {(['ALL', 'B2C', 'FLOTA', 'B2B'] as const).map(f => (
                            <button key={f} onClick={() => setFilter(f)} className={cn("px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition", filter === f ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-white/5')}>
                                {f === 'ALL' ? 'Todos' : f === 'FLOTA' ? 'Flota Propia' : f}
                            </button>
                        ))}
                    </div>
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                        <input value={search} onChange={e => setSearch(e.target.value)} type="text" placeholder="Viaje, Operario, Transporte..." className="w-full bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-600 outline-none text-white" />
                    </div>
                </div>
            )}

            {/* Views */}
            {view === 'monitor' ? (
                <div className="flex-1 overflow-x-auto flex p-4 gap-4 scrollbar-thin scrollbar-thumb-slate-700 pb-20">
                    {renderKanbanColumn("01", "Pendientes", "bg-slate-800/10 text-slate-400", 1)}
                    {renderKanbanColumn("02", "En Picking", "bg-blue-500/5 text-blue-400", 2)}
                    {renderKanbanColumn("03", "Fac / ETIQ", "bg-pink-500/5 text-pink-400", 3)}
                    {renderKanbanColumn("04", "Listo Despacho", "bg-orange-500/5 text-orange-400", 4)}
                    {renderKanbanColumn("05", "Despachados", "bg-emerald-500/5 text-emerald-400", 5)}
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-[#060912] pb-20">
                    <div className="max-w-6xl mx-auto space-y-8">
                        <div>
                            <h2 className="text-3xl font-bold tracking-tight text-white mb-0">Performance Logística</h2>
                            <p className="text-slate-500 text-sm mt-1">Métricas de la Jornada Actual</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                            <div className="bg-slate-900 p-6 rounded-2xl border border-blue-500/20">
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-2">Programados</p>
                                <h4 className="text-4xl font-extrabold text-white tracking-tighter">{dashboardStats.prog}</h4>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl border border-emerald-500/20">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-2">Completados</p>
                                <h4 className="text-4xl font-extrabold text-white tracking-tighter">{dashboardStats.desp}</h4>
                                <div className="flex items-center gap-2 mt-3">
                                    <div className="flex-1 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                                        <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${dashboardStats.perc}%` }}></div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400">{dashboardStats.perc}%</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl border border-orange-500/20">
                                <p className="text-[10px] font-bold text-orange-400 uppercase tracking-widest mb-2">Pendientes</p>
                                <h4 className="text-4xl font-extrabold text-white tracking-tighter">{dashboardStats.pend}</h4>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl border border-purple-500/20">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2">Bultos Pick</p>
                                <h4 className="text-4xl font-extrabold text-white tracking-tighter">{performance.totalPick}</h4>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 h-80 flex flex-col">
                                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4 shrink-0">Jornada: Pickers</h3>
                                <div className="space-y-2 overflow-y-auto pr-2 flex-1 scrollbar-thin">
                                    {Object.entries(performance.pickers).sort((a,b)=>b[1]-a[1]).map(([n, p]) => (
                                        <div key={n} className="flex justify-between p-2 hover:bg-white/5 rounded-lg border border-transparent">
                                            <span className="text-xs font-bold text-slate-300 uppercase">{n}</span>
                                            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">{p} bultos</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="bg-slate-900 p-6 rounded-2xl border border-white/5 h-80 flex flex-col">
                                <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-4 shrink-0">Jornada: Etiquetadores</h3>
                                <div className="space-y-2 overflow-y-auto pr-2 flex-1 scrollbar-thin">
                                    {Object.entries(performance.etiqs).sort((a,b)=>b[1]-a[1]).map(([n, p]) => (
                                        <div key={n} className="flex justify-between p-2 hover:bg-white/5 rounded-lg border border-transparent">
                                            <span className="text-xs font-bold text-slate-300 uppercase">{n}</span>
                                            <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 px-2 py-1 rounded-md">{p} bultos</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Fin Turno Modal */}
            {isFinTurnoOpen && (
                <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-[200] flex items-center justify-center p-4">
                    <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative">
                        <h2 className="text-2xl font-bold text-white mb-2">Resumen de Turno</h2>
                        <p className="text-sm text-slate-400 mb-6 font-medium">
                            Actividad detectada desde las {shiftData ? new Date(shiftData.startTime).toLocaleTimeString() : ''}.
                        </p>
                        
                        <div className="grid grid-cols-2 gap-4 mb-8">
                            <div className="bg-slate-950 p-5 rounded-2xl border border-blue-500/20 text-center">
                                <div className="text-[10px] text-blue-400 uppercase font-bold tracking-widest">Pickeados</div>
                                <div className="text-3xl font-black text-white">{performance.totalPick}</div>
                            </div>
                            <div className="bg-slate-950 p-5 rounded-2xl border border-pink-500/20 text-center">
                                <div className="text-[10px] text-pink-400 uppercase font-bold tracking-widest">Etiquetados</div>
                                <div className="text-3xl font-black text-white">{performance.totalEtiq}</div>
                            </div>
                        </div>

                        <div className="mb-6">
                            <label className="text-[10px] font-bold uppercase text-slate-500 mb-2 block">Texto del reporte:</label>
                            <textarea readOnly value={reportText} className="w-full bg-slate-950 border border-white/5 rounded-xl p-3 text-xs text-slate-400 h-32 focus:outline-none"></textarea>
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button onClick={() => setIsFinTurnoOpen(false)} className="px-6 py-3 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors">Cancelar</button>
                            <button onClick={enviarReporte} className="px-6 py-3 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-2 shadow-lg shadow-blue-500/20">
                                <Mail className="h-4 w-4" /> Enviar al Mail
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
