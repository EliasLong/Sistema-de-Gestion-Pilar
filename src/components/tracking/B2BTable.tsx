'use client'

import { useState, useCallback, useEffect } from 'react'
import type { B2BTrip, TripStatus, SheetImportRow } from '@/types/tracking'
import { TRIP_STATUS_LABELS, canEditRow } from '@/types/tracking'
import { Check, X, Plus, Save, Trash2, Lock, Search, ChevronDown } from 'lucide-react'
import { MOCK_CARRIERS_B2B, getOperatorsForContext } from '@/lib/mock-tracking'
import { useProfile } from '@/hooks/useProfile'
import { useAutoSaveField } from '@/hooks/useAutoSaveField'
import { formatDate } from '@/lib/utils'

// ============================================
// Row Draft types
// ============================================

export interface B2BRowDraft {
    _localId: string
    _saved: boolean
    _isNew: boolean
    created_by: string
    created_at: string
    date: string
    carrier: string
    vehicle_plate: string
    trip_number: string
    client: string
    client_shift: string
    task_count: string
    port: string
    pallets: string
    operators: string[]
    documents_printed: boolean
    detail: string
    comments: string
    bulk_cargo: boolean
    status: TripStatus | ''
    retira?: string
}

function createEmptyB2BRow(userId: string): B2BRowDraft {
    return {
        _localId: `new-${Date.now()}`,
        _saved: false,
        _isNew: true,
        created_by: userId,
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        carrier: '',
        vehicle_plate: '',
        trip_number: '',
        client: '',
        client_shift: '',
        task_count: '',
        port: '',
        pallets: '',
        operators: [],
        documents_printed: false,
        detail: '',
        comments: '',
        bulk_cargo: false,
        status: '',
        retira: ''
    }
}

function tripToRow(trip: B2BTrip): B2BRowDraft {
    return {
        ...trip,
        _localId: trip.id,
        _saved: true,
        _isNew: false,
        task_count: String(trip.task_count || ''),
        pallets: String(trip.pallets || ''),
        retira: trip.retira || ''
    }
}

function sheetRowToPreview(row: SheetImportRow, userId: string): B2BRowDraft {
    return {
        _localId: `sheet-${row.trip_number}-${Date.now()}`,
        _saved: false,
        _isNew: true,
        created_by: userId,
        created_at: new Date().toISOString(),
        date: row.date || '',
        carrier: row.carrier || '',
        vehicle_plate: row.vehicle_plate || '',
        trip_number: row.trip_number || '',
        client: row.client || '',
        client_shift: row.client_shift || '',
        task_count: String(row.task_count || ''),
        port: row.port || '',
        pallets: String(row.pallets || ''),
        operators: [],
        documents_printed: false,
        detail: '',
        comments: row.comments || '',
        bulk_cargo: false,
        status: '',
        retira: row.retira || ''
    }
}

function isRowComplete(row: B2BRowDraft): boolean {
    return (
        !!row.date &&
        !!row.carrier &&
        !!row.vehicle_plate &&
        !!row.trip_number &&
        !!row.client &&
        !!row.status
    )
}

interface B2BTableProps {
    trips: B2BTrip[]
    warehouse: string
    onUnsavedChange?: (hasUnsaved: boolean) => void
    onSave: (data: any, isNew: boolean) => Promise<any>
    onSaveBatch: (data: any[], areNew: boolean) => Promise<any>
    onDelete: (id: string) => Promise<any>
    onRefresh: () => Promise<void>
}

export function B2BTable({ trips, warehouse, onUnsavedChange, onSave, onSaveBatch, onDelete, onRefresh }: B2BTableProps) {
    const { profile } = useProfile()
    const currentUserId = profile?.id || 'unknown'
    const currentUserRole = profile?.role || 'operative'
    
    const [rows, setRows] = useState<B2BRowDraft[]>(() => trips.map(tripToRow))
    
    useEffect(() => {
        setRows(prev => {
            const drafts = prev.filter(r => !r._saved)
            const draftIds = drafts.map(d => d._localId)
            const synced = trips.map(tripToRow).filter(s => !draftIds.includes(s._localId))
            return [...drafts, ...synced]
        })
    }, [trips])

    const [importedRows, setImportedRows] = useState<B2BRowDraft[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<string | null>(null)

    const unsavedRows = rows.filter((r) => !r._saved)
    const hasUnsaved = unsavedRows.length > 0 || importedRows.length > 0

    const handleRefreshFromSheet = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch(`/api/tracking/import-sheet?warehouse=${warehouse}`)
            if (!res.ok) throw new Error('Error en la API de importación')
            
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            const newImports = data
                .filter((item: any) => item.trip_type === 'b2b')
                .map((item: any) => sheetRowToPreview(item, currentUserId))
                .filter((row: any) => !rows.some(r => r.trip_number === row.trip_number))
                .filter((row: any) => !importedRows.some(r => r.trip_number === row.trip_number))

            if (newImports.length > 0) {
                setImportedRows((prev) => [...prev, ...newImports])
                onUnsavedChange?.(true)
                alert(`Se encontraron ${newImports.length} nuevos viajes para ${warehouse}`)
            } else {
                alert(`No se encontraron nuevos viajes para ${warehouse} en el Sheet`)
            }

            setLastRefresh(new Date().toLocaleTimeString('es-AR'))
        } catch (error: any) {
            console.error('Error fetching Sheet via API:', error)
            alert('Error al conectar con el servidor para la importación: ' + error.message)
        } finally {
            setIsRefreshing(false)
        }
    }, [rows, importedRows, onUnsavedChange, warehouse, currentUserId])

    const confirmImportedRow = useCallback(
        async (localId: string) => {
            const row = importedRows.find((r) => r._localId === localId)
            if (!row) return
            
            try {
                const payload = { ...row, status: 'pending', trip_type: 'b2b', warehouse }
                const { _localId: lId, _saved, _isNew, ...body } = payload as any
                body.task_count = Number(body.task_count) || 0
                body.pallets = Number(body.pallets) || 0
                body.status = body.status || 'pending'

                await onSave(body, true)

                setImportedRows((prev) => {
                    const remaining = prev.filter((r) => r._localId !== localId)
                    onUnsavedChange?.(remaining.length > 0 || rows.some((r) => !r._saved))
                    return remaining
                })
                
                await onRefresh()
            } catch (e) {
                console.error("Error confirming imported row", e)
                alert("Error al guardar registro importado")
            }
        },
        [importedRows, onSave, onRefresh, warehouse, rows, onUnsavedChange]
    )

    const confirmAllImported = useCallback(async () => {
        if (importedRows.length === 0) return
        const confirmed = window.confirm(`¿Deseás confirmar los ${importedRows.length} viajes importados?`)
        if (!confirmed) return

        setIsRefreshing(true)
        try {
            const batch = importedRows.map(row => {
                const { _localId, _saved, _isNew, ...tripData } = row
                return { 
                    ...tripData, 
                    trip_type: 'b2b', 
                    warehouse,
                    task_count: Number(row.task_count) || 0,
                    pallets: Number(row.pallets) || 0
                }
            })
            await onSaveBatch(batch, true)
            setImportedRows([])
            onUnsavedChange?.(rows.some((r) => !r._saved))
            await onRefresh()
            alert(`${batch.length} viajes confirmados correctamente`)
        } catch (e) {
            console.error("Error confirming batch", e)
            alert("Error al confirmar el lote: " + (e instanceof Error ? e.message : String(e)))
        } finally {
            setIsRefreshing(false)
        }
    }, [importedRows, onSaveBatch, onRefresh, warehouse, rows, onUnsavedChange])

    const discardImportedRow = useCallback(
        (localId: string) => {
            setImportedRows((prev) => {
                const remaining = prev.filter((r) => r._localId !== localId)
                onUnsavedChange?.(remaining.length > 0 || rows.some((r) => !r._saved))
                return remaining
            })
        },
        [rows, onUnsavedChange]
    )

    const updateRow = useCallback(
        (localId: string, field: keyof B2BRowDraft, value: unknown) => {
            setRows((prev) => {
                const next = prev.map((row) => {
                    if (row._localId !== localId) return row
                    return { ...row, [field]: value, _saved: false }
                })
                onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                return next
            })
        },
        [onUnsavedChange, importedRows]
    )

    const handleAutoSaveRowB2B = useCallback(
        async (row: B2BRowDraft, field: string, newValue: any) => {
            if (row._isNew) return

            const { _localId, _saved, _isNew, ...payload } = row as any
            const savePayload = {
                ...payload,
                [field]: newValue,
                task_count: Number(field === 'task_count' ? newValue : row.task_count) || 0,
                pallets: Number(field === 'pallets' ? newValue : row.pallets) || 0,
                status: payload.status || 'pending',
                trip_type: 'b2b',
                warehouse,
                id: row._localId
            }

            try {
                const savedTrip = await onSave(savePayload, false)
                setRows((prev) => {
                    const next = prev.map((r) => {
                        if (r._localId !== row._localId) return r
                        return { ...r, _localId: savedTrip.id, _saved: true, _isNew: false }
                    })
                    onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                    return next
                })
            } catch (error) {
                console.error(`Error auto-guardando ${field}:`, error)
                throw error
            }
        },
        [onSave, warehouse, onUnsavedChange, importedRows]
    )

    const toggleAndAutoSaveOperatorB2B = useCallback(
        async (row: B2BRowDraft, operator: string) => {
            const hasOp = row.operators.includes(operator)
            const newOps = hasOp ? [] : [operator]
            updateRow(row._localId, 'operators', newOps)
            if (!row._isNew) {
                await handleAutoSaveRowB2B({ ...row, operators: newOps }, 'operators', newOps)
            }
        },
        [handleAutoSaveRowB2B, updateRow]
    )

    const addRow = useCallback(() => {
        const newRow = createEmptyB2BRow(currentUserId)
        setRows((prev) => [newRow, ...prev])
        onUnsavedChange?.(true)
    }, [onUnsavedChange, currentUserId])

    const removeRow = useCallback(
        async (localId: string) => {
            const row = rows.find(r => r._localId === localId)
            if (row?._saved) {
                const confirmed = window.confirm('¿Deseás enviar este viaje al módulo de Borrado?')
                if (!confirmed) return
                try {
                    await onDelete(localId)
                    alert("Viaje enviado al módulo de Borrado")
                } catch (e) {
                    console.error('Error deleting:', e)
                    alert("Error al eliminar el viaje")
                    return
                }
            }
            setRows((prev) => {
                const next = prev.filter((r) => r._localId !== localId)
                onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                return next
            })
        },
        [onUnsavedChange, importedRows, rows, onDelete]
    )

    const saveRow = useCallback(
        async (localId: string) => {
            const row = rows.find(r => r._localId === localId)
            if (!row) return
            try {
                const { _localId: lId, _saved, _isNew, ...payload } = row as any
                const savePayload = {
                    ...payload,
                    task_count: Number(payload.task_count) || 0,
                    pallets: Number(payload.pallets) || 0,
                    trip_type: 'b2b',
                    warehouse,
                    ...(row._isNew ? {} : { id: localId })
                }
                const savedTrip = await onSave(savePayload, row._isNew)
                setRows((prev) => {
                    const next = prev.map((r) => {
                        if (r._localId !== localId) return r
                        return { ...r, _localId: savedTrip.id, _saved: true, _isNew: false }
                    })
                    onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                    return next
                })
                await onRefresh()
            } catch (error) {
                console.error("Error saving row", error)
                alert("Error guardando el viaje")
            }
        },
        [rows, onSave, onRefresh, onUnsavedChange, warehouse, importedRows]
    )

    const saveAll = useCallback(async () => {
        const rowsToSave = rows.filter((row) => !row._saved)
        if (rowsToSave.length === 0) return
        try {
            const savedResults = await Promise.all(rowsToSave.map(row => {
                const { _localId, _saved, _isNew, ...payload } = row as any
                return onSave({
                    ...payload,
                    task_count: Number(payload.task_count) || 0,
                    pallets: Number(payload.pallets) || 0,
                    trip_type: 'b2b',
                    warehouse,
                    ...(row._isNew ? {} : { id: row._localId })
                }, row._isNew)
            }))
            
            setRows((prev) => {
                const next = [...prev]
                rowsToSave.forEach((originalRow, index) => {
                    const savedTrip = savedResults[index]
                    const rowIdx = next.findIndex(r => r._localId === originalRow._localId)
                    if (rowIdx !== -1) {
                        next[rowIdx] = { ...next[rowIdx], _localId: savedTrip.id, _saved: true, _isNew: false }
                    }
                })
                onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                return next
            })
            await onRefresh()
        } catch (error) {
            console.error(error)
            alert("Error guardando los viajes")
        }
    }, [rows, onSave, onRefresh, onUnsavedChange, warehouse, importedRows])

    const toggleOperator = useCallback(
        (localId: string, operator: string, isImported: boolean) => {
            if (isImported) {
                setImportedRows((prev) => prev.map((row) => {
                    if (row._localId !== localId) return row
                    const hasOp = row.operators.includes(operator)
                    return { ...row, operators: hasOp ? [] : [operator] }
                }))
            } else {
                setRows((prev) => {
                    const next = prev.map((row) => {
                        if (row._localId !== localId) return row
                        const hasOp = row.operators.includes(operator)
                        return { ...row, operators: hasOp ? [] : [operator], _saved: false }
                    })
                    onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                    return next
                })
            }
        },
        [importedRows, onUnsavedChange]
    )

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button onClick={addRow} className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors">
                        <Plus className="h-4 w-4" /> Nueva Fila
                    </button>
                    <button onClick={handleRefreshFromSheet} disabled={isRefreshing} className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-50">
                        <Check className="h-4 w-4" /> {isRefreshing ? 'Consultando...' : 'Refrescar Sheet'}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {lastRefresh && <span className="text-xs text-muted-foreground italic">Actualizado: {lastRefresh}</span>}
                    {hasUnsaved && (
                        <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-amber-500 flex items-center gap-1"><X className="h-3 w-3" /> Cambios sin guardar</span>
                            <button onClick={saveAll} className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"><Save className="h-4 w-4" /> Guardar Todo</button>
                        </div>
                    )}
                </div>
            </div>

            {importedRows.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-amber-100 rounded-lg text-amber-600"><Plus className="h-5 w-5" /></div>
                            <div>
                                <h3 className="font-semibold text-amber-900">Previsualización de Importación</h3>
                                <p className="text-xs text-amber-700">{importedRows.length} registros encontrados en el Sheet esperando aprobación.</p>
                            </div>
                        </div>
                        <button onClick={confirmAllImported} className="inline-flex items-center gap-2 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors shadow-sm"><Check className="h-3.5 w-3.5" /> Confirmar Todos</button>
                    </div>
                    <div className="overflow-x-auto rounded-md border border-amber-200 bg-white">
                        <table className="w-full text-sm">
                            <thead className="bg-amber-50 text-amber-900 border-b border-amber-200">
                                <tr>
                                    <th className="px-3 py-2 text-left font-semibold">Fecha</th>
                                    <th className="px-3 py-2 text-left font-semibold">Carrier</th>
                                    <th className="px-3 py-2 text-left font-semibold">Nro Viaje</th>
                                    <th className="px-3 py-2 text-left font-semibold text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-amber-100">
                                {importedRows.map((row) => (
                                    <tr key={row._localId} className="hover:bg-amber-50/30">
                                        <td className="px-3 py-2 text-xs font-medium text-amber-900">{formatDate(row.date)}</td>
                                        <td className="px-3 py-2 text-xs font-medium text-amber-900">{row.carrier}</td>
                                        <td className="px-3 py-2 text-xs font-mono font-bold text-amber-700">{row.trip_number}</td>
                                        <td className="px-3 py-2 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <button onClick={() => confirmImportedRow(row._localId)} className="rounded p-1 text-emerald-600 hover:bg-emerald-100" title="Confirmar"><Check className="h-4 w-4" /></button>
                                                <button onClick={() => discardImportedRow(row._localId)} className="rounded p-1 text-red-600 hover:bg-red-100" title="Descartar"><X className="h-4 w-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div className="relative w-full overflow-auto rounded-lg border">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/50 border-b sticky top-0 z-10 backdrop-blur-sm">
                        <tr>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Fecha</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Carrier</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Retira</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Patente</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Nro Viaje</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Cliente</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Turno</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Bultos</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Puerto</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Pallets</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Operarios</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Detalle</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Comentarios</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Granel</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Estado</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap w-[80px]">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const complete = isRowComplete(row)
                            const editable = row._isNew || canEditRow(row.created_at, row.created_by, currentUserId, currentUserRole)
                            const rowBorder = !row._saved ? (complete ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-amber-500') : (!editable ? 'border-l-2 border-l-muted-foreground/30' : '')

                            return (
                                <tr key={row._localId} className={`border-b transition-colors hover:bg-muted/20 ${rowBorder} ${!editable ? 'opacity-75' : ''}`}>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="date" value={row.date} onChange={(v) => updateRow(row._localId, 'date', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'date', v)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm px-2">{formatDate(row.date)}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveSelect value={row.carrier} onChange={(v) => updateRow(row._localId, 'carrier', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'carrier', v)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm">
                                                <option value="">Seleccionar</option>
                                                {MOCK_CARRIERS_B2B.map(c => <option key={c} value={c}>{c}</option>)}
                                            </AutoSaveSelect>
                                        ) : (
                                            <span className="text-sm font-medium px-2">{row.carrier}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.retira || ''} onChange={(v) => updateRow(row._localId, 'retira', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'retira', v)} placeholder="Retira" className="w-[120px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm px-2 truncate max-w-[120px] block">{row.retira || '—'}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.vehicle_plate} onChange={(v) => updateRow(row._localId, 'vehicle_plate', v.toUpperCase())} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'vehicle_plate', v)} placeholder="Patente" className="w-[100px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono" />
                                        ) : (
                                            <span className="text-sm font-mono px-2">{row.vehicle_plate}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.trip_number} onChange={(v) => updateRow(row._localId, 'trip_number', v.replace(/\D/g, '').slice(0, 6))} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'trip_number', v)} placeholder="Nro" maxLength={6} className="w-[80px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono" />
                                        ) : (
                                            <span className="text-sm font-mono px-2">{row.trip_number}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.client} onChange={(v) => updateRow(row._localId, 'client', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'client', v)} placeholder="Cliente" className="w-[120px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm font-medium px-2">{row.client}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.client_shift} onChange={(v) => updateRow(row._localId, 'client_shift', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'client_shift', v)} placeholder="Turno" className="w-[100px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm px-2">{row.client_shift}</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        {editable ? (
                                            <AutoSaveInput value={row.task_count} onChange={(v) => updateRow(row._localId, 'task_count', v.replace(/\D/g, ''))} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'task_count', Number(v) || 0)} className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center" />
                                        ) : (
                                            <span className="text-sm">{row.task_count}</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.port} onChange={(v) => updateRow(row._localId, 'port', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'port', v)} placeholder="Puerto" className="w-[70px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm font-mono px-2">{row.port}</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.pallets} onChange={(v) => updateRow(row._localId, 'pallets', v.replace(/\D/g, ''))} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'pallets', Number(v) || 0)} className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center" />
                                        ) : (
                                            <span className="text-sm font-semibold">{row.pallets}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <OperatorMultiSelect selected={row.operators} warehouse={warehouse} onToggle={(op) => toggleAndAutoSaveOperatorB2B(row, op)} />
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {row.operators.map(op => <span key={op} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground border">{op.split(' ')[0]}</span>)}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.detail} onChange={(v) => updateRow(row._localId, 'detail', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'detail', v)} placeholder="Detalle..." className="w-[130px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm truncate max-w-[130px] block" title={row.detail}>{row.detail || '—'}</span>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveInput type="text" value={row.comments} onChange={(v) => updateRow(row._localId, 'comments', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'comments', v)} placeholder="Comentarios..." className="w-[130px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm" />
                                        ) : (
                                            <span className="text-sm truncate max-w-[130px] block" title={row.comments}>{row.comments || '—'}</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        {editable ? (
                                            <button onClick={() => { const val = !row.bulk_cargo; updateRow(row._localId, 'bulk_cargo', val); if (!row._isNew) handleAutoSaveRowB2B(row, 'bulk_cargo', val); }} className={`flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${row.bulk_cargo ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-transparent border-input text-muted-foreground'}`}>{row.bulk_cargo ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</button>
                                        ) : (
                                            row.bulk_cargo ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {editable ? (
                                            <AutoSaveSelect value={row.status} onChange={(v) => updateRow(row._localId, 'status', v)} onAutoSave={(v) => handleAutoSaveRowB2B(row, 'status', v)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-black">
                                                <option value="">Seleccionar</option>
                                                {Object.entries(TRIP_STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                                            </AutoSaveSelect>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold bg-muted/60 text-slate-700">{row.status ? TRIP_STATUS_LABELS[row.status as TripStatus] : '—'}</span>
                                        )}
                                    </td>
                                    <td className="p-2 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {!editable && <span title="Bloqueada"><Lock className="h-4 w-4 text-muted-foreground" /></span>}
                                            {editable && !row._saved && <button onClick={() => saveRow(row._localId)} className="rounded-md p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors" title="Guardar"><Save className="h-4 w-4" /></button>}
                                            {(editable || currentUserRole === 'operative') && <button onClick={() => removeRow(row._localId)} className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20 transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function OperatorMultiSelect({ selected, warehouse, onToggle }: { selected: string[]; warehouse: string; onToggle: (op: string) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const allOperators = getOperatorsForContext(warehouse)
    const filteredOperators = allOperators.filter(op => op.toLowerCase().includes(searchTerm.toLowerCase()))
    return (
        <div className="relative">
            <button type="button" onClick={() => setIsOpen(!isOpen)} className="flex w-full min-w-[120px] items-center justify-between rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring">
                <div className="flex-1 text-left truncate">{selected.length === 0 ? <span className="text-muted-foreground">Seleccionar...</span> : <span className="truncate font-medium">{selected[0]}</span>}</div>
                <ChevronDown className="h-4 w-4 opacity-40 ml-1" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearchTerm(''); }} />
                    <div className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                        <div className="relative mb-2">
                             <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                             <input autoFocus type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full rounded-md border border-input bg-transparent py-2 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-0.5">
                            {filteredOperators.map((op) => (
                                <button key={op} type="button" onClick={() => { onToggle(op); setIsOpen(false); setSearchTerm(''); }} className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all hover:bg-accent ${selected.includes(op) ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'}`}>
                                    <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${selected.includes(op) ? 'bg-primary border-primary text-primary-foreground' : 'border-input bg-background'}`}>
                                        {selected.includes(op) && <Check className="h-3 w-3" />}
                                    </div>
                                    <span className="truncate">{op}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {selected.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{selected.map(op => <span key={op} className="bg-secondary px-1.5 py-0.5 text-[10px] font-medium rounded">{op.split(' ')[0]}</span>)}</div>}
        </div>
    )
}

function SaveIndicator({ status, error }: { status: string, error: string | null }) {
    return (
        <div className="flex items-center gap-1 min-w-[12px]">
            {status === 'saving' && <div className="h-3 w-3 rounded-full border-2 border-transparent border-t-blue-500 animate-spin" />}
            {status === 'saved' && <span className="text-xs text-green-600 font-bold" title="Guardado">✓</span>}
            {status === 'error' && <span className="text-xs text-red-600 font-bold" title={error || 'Error'}>!</span>}
        </div>
    )
}

function AutoSaveInput({ value, onChange, onAutoSave, className, placeholder, maxLength, type = 'text', title }: { value: string; onChange: (v: string) => void; onAutoSave: (v: string) => Promise<void>; className?: string; placeholder?: string; maxLength?: number; type?: string; title?: string }) {
    const { status, error } = useAutoSaveField({ value, onSave: async (nv) => { await onAutoSave(nv) }, debounceMs: 1500 })
    return (
        <div className="relative inline-flex items-center gap-1.5 w-full">
            <input type={type} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} disabled={status === 'saving'} className={`${className} transition-all disabled:opacity-50`} title={error ? `Error: ${error}` : title} />
            <SaveIndicator status={status} error={error} />
        </div>
    )
}

function AutoSaveSelect({ value, onChange, onAutoSave, className, children, title }: { value: string; onChange: (v: string) => void; onAutoSave: (v: string) => Promise<void>; className?: string; children: React.ReactNode; title?: string }) {
    const { status, error } = useAutoSaveField({ value, onSave: async (nv) => { await onAutoSave(nv) }, debounceMs: 500 })
    return (
        <div className="relative inline-flex items-center gap-1.5 w-full">
            <select value={value} onChange={(e) => onChange(e.target.value)} disabled={status === 'saving'} className={`${className} transition-all disabled:opacity-50`} title={error ? `Error: ${error}` : title}>{children}</select>
            <SaveIndicator status={status} error={error} />
        </div>
    )
}
