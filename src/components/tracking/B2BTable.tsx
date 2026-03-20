'use client'

import { useState, useCallback, useEffect } from 'react'
import type { B2BTrip, TripStatus, SheetImportRow } from '@/types/tracking'
import { TRIP_STATUS_LABELS, canEditRow } from '@/types/tracking'
import { Check, X, Plus, Save, Trash2, RefreshCw, FileSpreadsheet, Lock, ArrowUp, Search, ChevronDown } from 'lucide-react'
import { MOCK_CARRIERS_B2B, getOperatorsForContext } from '@/lib/mock-tracking'
import { useProfile } from '@/hooks/useProfile'
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
    warehouse?: string
    operators: string[]
    documents_printed: boolean
    detail: string
    comments: string
    bulk_cargo: boolean
    status: TripStatus | ''
    retira?: string
}

function createEmptyB2BRow(): B2BRowDraft {
    return {
        _localId: crypto.randomUUID(),
        _saved: false,
        _isNew: true,
        created_by: '',
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        carrier: '', vehicle_plate: '', trip_number: '', client: '', client_shift: '',
        task_count: '', port: '', pallets: '', operators: [], documents_printed: false,
        detail: '', comments: '', bulk_cargo: false, status: '',
    }
}

function tripToRow(trip: B2BTrip): B2BRowDraft {
    return {
        _localId: trip.id, _saved: true, _isNew: false,
        created_by: trip.created_by, created_at: trip.created_at,
        date: trip.date, carrier: trip.carrier, vehicle_plate: trip.vehicle_plate,
        trip_number: trip.trip_number, client: trip.client, client_shift: trip.client_shift,
        task_count: trip.task_count != null ? String(trip.task_count) : '', port: trip.port, pallets: trip.pallets != null ? String(trip.pallets) : '',
        operators: [...trip.operators], documents_printed: trip.documents_printed,
        detail: trip.detail, comments: trip.comments, bulk_cargo: trip.bulk_cargo,
        status: trip.status,
        retira: trip.retira,
    }
}

function sheetRowToPreview(row: SheetImportRow, userId: string): B2BRowDraft {
    return {
        _localId: row._sheetRowId, _saved: false, _isNew: true,
        created_by: userId, created_at: new Date().toISOString(),
        date: row.date, carrier: row.carrier, vehicle_plate: row.vehicle_plate,
        trip_number: row.trip_number, client: row.client, client_shift: row.client_shift,
        task_count: row.task_count != null ? String(row.task_count) : '', port: row.port, pallets: row.pallets != null ? String(row.pallets) : '',
        operators: [...row.operators], documents_printed: row.documents_printed,
        detail: row.detail, comments: row.comments, bulk_cargo: row.bulk_cargo,
        status: '',
        retira: row.retira,
    }
}

function isRowComplete(row: B2BRowDraft): boolean {
    return (
        row.date !== '' && row.carrier !== '' && row.vehicle_plate !== '' &&
        row.trip_number !== '' && row.client !== '' && row.task_count !== '' &&
        row.port !== '' && row.pallets !== '' && row.operators.length > 0 &&
        row.status !== ''
    )
}

// ============================================
// Component
// ============================================

interface B2BTableProps {
    trips: B2BTrip[]
    warehouse: 'PL2' | 'PL3'
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

    // --- Refresh from Sheet (Real via API) ---
    const handleRefreshFromSheet = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch(`/api/tracking/import-sheet?warehouse=${warehouse}`)
            if (!res.ok) throw new Error('Error en la API de importación')
            
            const data = await res.json()
            if (data.error) throw new Error(data.error)

            const newImports = data
                .filter((item: any) => item.trip_type === 'b2b')
                .map((item: any) => ({
                    _localId: `sheet-${item.trip_number}-${Date.now()}`,
                    _saved: false,
                    _isNew: true,
                    created_by: currentUserId,
                    created_at: new Date().toISOString(),
                    date: item.date,
                    carrier: item.carrier,
                    vehicle_plate: item.vehicle_plate,
                    trip_number: item.trip_number,
                    client: item.client,
                    client_shift: item.client_shift,
                    task_count: item.task_count,
                    port: item.port,
                    pallets: item.pallets,
                    operators: [],
                    documents_printed: false,
                    detail: '',
                    comments: item.comments,
                    bulk_cargo: false,
                    status: '' as const,
                    retira: item.retira
                }))
                // Filter out already existing trip numbers
                .filter((row: any) => !rows.some(r => r.trip_number === row.trip_number))
                // Filter out already imported IDs
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

    // --- Confirm imported row → save to database as "Pendiente" ---
    const confirmImportedRow = useCallback(
        async (localId: string) => {
            const row = importedRows.find((r) => r._localId === localId)
            if (!row) return
            
            try {
                const payload = { ...row, status: 'pending', trip_type: 'b2b', warehouse }
                const { _localId: lId, _saved, _isNew, ...body } = payload as any
                if (!body.task_count) body.task_count = 0; else body.task_count = Number(body.task_count);
                if (!body.pallets) body.pallets = 0; else body.pallets = Number(body.pallets);
                if (!body.status) body.status = 'pending';

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
                return { ...tripData, trip_type: 'b2b', warehouse }
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

    // --- Standard row CRUD ---
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

    const updateImportedRow = useCallback(
        (localId: string, field: keyof B2BRowDraft, value: unknown) => {
            setImportedRows((prev) =>
                prev.map((row) => {
                    if (row._localId !== localId) return row
                    return { ...row, [field]: value }
                })
            )
        },
        []
    )

    const addRow = useCallback(() => {
        const newRow = createEmptyB2BRow()
        newRow.created_by = currentUserId
        setRows((prev) => [newRow, ...prev])
        onUnsavedChange?.(true)
    }, [onUnsavedChange, currentUserId])

    const removeRow = useCallback(
        async (localId: string) => {
            console.log('B2BTable: removeRow called for localId:', localId)
            const row = rows.find(r => r._localId === localId)
            console.log('B2BTable: Found row:', row)
            
            if (row?._saved) {
                const confirmed = window.confirm('¿Deseás enviar este viaje al módulo de Borrado? Podrá ser eliminado definitivamente por un administrador.')
                if (!confirmed) return
                try {
                    console.log('B2BTable: Calling onDelete for:', localId)
                    await onDelete(localId)
                    alert("Viaje enviado al módulo de Borrado")
                } catch (e) {
                    console.error('B2BTable: Deletion failed:', e)
                    alert("Error al eliminar el viaje: " + (e instanceof Error ? e.message : String(e)))
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
                if (!payload.task_count) payload.task_count = 0; else payload.task_count = Number(payload.task_count);
                if (!payload.pallets) payload.pallets = 0; else payload.pallets = Number(payload.pallets);
                if (!payload.status) payload.status = 'pending';

                await onSave({ ...payload, trip_type: 'b2b', warehouse }, row._isNew)
                
                setRows((prev) => {
                    const next = prev.map((r) => {
                        if (r._localId !== localId) return r
                        return { ...r, _saved: true, _isNew: false }
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
            await Promise.all(rowsToSave.map(row => {
                const { _localId, _saved, _isNew, ...payload } = row as any
                if (!payload.task_count) payload.task_count = 0; else payload.task_count = Number(payload.task_count);
                if (!payload.pallets) payload.pallets = 0; else payload.pallets = Number(payload.pallets);
                if (!payload.status) payload.status = 'pending';

                return onSave({ ...payload, trip_type: 'b2b', warehouse }, row._isNew)
            }))
            
            setRows((prev) => {
                const next = prev.map((row) => {
                    if (row._saved) return row
                    return { ...row, _saved: true, _isNew: false }
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
            const setter = isImported ? setImportedRows : setRows
            setter((prev) => {
                const next = prev.map((row) => {
                    if (row._localId !== localId) return row
                    const hasOp = row.operators.includes(operator)
                    // Selección única: si ya estaba se quita, si no se reemplaza
                    const newOps = hasOp ? [] : [operator]
                    return { ...row, operators: newOps, ...(isImported ? {} : { _saved: false }) }
                })
                if (!isImported) onUnsavedChange?.(next.some((r) => !r._saved) || importedRows.length > 0)
                return next
            })
        },
        [onUnsavedChange, importedRows]
    )

    return (
        <div className="flex flex-col gap-6">
            {/* Toolbar */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <button
                        onClick={addRow}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Fila
                    </button>
                    <button
                        onClick={handleRefreshFromSheet}
                        disabled={isRefreshing}
                        className="inline-flex items-center gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm font-medium shadow-sm hover:bg-muted transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                        {isRefreshing ? 'Consultando...' : 'Refrescar desde Sheet'}
                    </button>
                    {hasUnsaved && unsavedRows.length > 0 && (
                        <button
                            onClick={saveAll}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            Guardar Todo ({unsavedRows.length})
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {lastRefresh && (
                        <span className="text-xs text-muted-foreground">
                            Último refresh: {lastRefresh}
                        </span>
                    )}
                    {hasUnsaved && (
                        <span className="text-sm text-amber-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            Cambios pendientes
                        </span>
                    )}
                </div>
            </div>

            {/* Imported from Sheet — Preview/Confirm Zone */}
            {importedRows.length > 0 && (
                <div className="rounded-lg border-2 border-dashed border-blue-500/40 bg-blue-500/5 p-4">
                    <div className="flex items-center gap-2 mb-4">
                        <FileSpreadsheet className="h-5 w-5 text-blue-400" />
                        <h3 className="text-sm font-semibold text-blue-400">
                            Viajes importados desde Sheet — Revisá y confirmá
                        </h3>
                        <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs font-medium text-blue-400">
                            {importedRows.length} nuevo(s)
                        </span>
                        <div className="ml-auto flex gap-2">
                            <button 
                                onClick={confirmAllImported}
                                disabled={isRefreshing}
                                className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                            >
                                <Check className="h-3.5 w-3.5" />
                                Confirmar Todos
                            </button>
                            <button 
                                onClick={() => { if(window.confirm('¿Borrar todos los importados?')) setImportedRows([]); }}
                                className="inline-flex items-center gap-2 rounded-md bg-red-600/10 px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-600/20 transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                                Descartar Todos
                            </button>
                        </div>
                    </div>

                    <div className="relative w-full overflow-auto rounded-lg border border-blue-500/20">
                        <table className="w-full min-w-max caption-bottom text-sm">
                            <thead className="bg-blue-500/10">
                                <tr className="border-b border-blue-500/20">
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Fecha</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Transporte</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Retira</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Dominio</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Viaje</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Depósito</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Cliente</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Turno</th>
                                    <th className="h-10 px-3 text-center text-xs font-semibold text-blue-300 whitespace-nowrap">Tareas</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Puerto</th>
                                    <th className="h-10 px-3 text-center text-xs font-semibold text-blue-300 whitespace-nowrap">Pallets</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Operarios</th>
                                    <th className="h-10 px-3 text-left text-xs font-semibold text-blue-300 whitespace-nowrap">Detalle</th>
                                    <th className="h-10 px-3 text-center text-xs font-semibold text-blue-300 whitespace-nowrap w-[100px]">Confirmar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {importedRows.map((row) => (
                                    <tr key={row._localId} className="border-b border-blue-500/10 hover:bg-blue-500/5">
                                        <td className="p-2 text-sm">{formatDate(row.date)}</td>
                                        <td className="p-2 text-sm font-medium">{row.carrier}</td>
                                        <td className="p-2 text-sm text-blue-300 font-medium truncate max-w-[100px]" title={row.retira}>{row.retira || '—'}</td>
                                        <td className="p-2 text-sm font-mono">{row.vehicle_plate}</td>
                                        <td className="p-2 text-sm font-mono">{row.trip_number}</td>
                                        <td className="p-2 text-sm font-bold text-blue-400">{row.warehouse || warehouse}</td>
                                        <td className="p-2 text-sm font-medium">{row.client}</td>
                                        <td className="p-2 text-sm">{row.client_shift}</td>
                                        <td className="p-2 text-sm text-center">{row.task_count}</td>
                                        <td className="p-2 text-sm font-mono">{row.port}</td>
                                        <td className="p-2 text-sm text-center font-semibold">{row.pallets}</td>
                                        <td className="p-2 text-sm">
                                            <div className="flex flex-wrap gap-1">
                                                {row.operators.map((op) => (
                                                    <span key={op} className="rounded-md bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-300">
                                                        {op.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="p-2 text-sm truncate max-w-[140px]" title={row.detail}>{row.detail || '—'}</td>
                                        <td className="p-2">
                                            <div className="flex items-center justify-center gap-1">
                                                <button
                                                    onClick={() => confirmImportedRow(row._localId)}
                                                    className="rounded-md p-1.5 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                                                    title="Confirmar y guardar como Pendiente"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => discardImportedRow(row._localId)}
                                                    className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                                                    title="Descartar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="relative w-full overflow-auto rounded-lg border">
                <table className="w-full min-w-max caption-bottom text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Fecha</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Transporte</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Retira</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Dominio</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Viaje</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Cliente</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Turno</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Tareas</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Puerto</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Pallets</th>
                            <th className="h-11 px-3 text-left font-semibold text-muted-foreground whitespace-nowrap">Operarios</th>
                            <th className="h-11 px-3 text-center font-semibold text-muted-foreground whitespace-nowrap">Papeles</th>
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
                            const rowBorder = !row._saved
                                ? complete ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-amber-500'
                                : !editable ? 'border-l-2 border-l-muted-foreground/30' : ''

                            return (
                                <tr key={row._localId} className={`border-b transition-colors hover:bg-muted/20 ${rowBorder} ${!editable ? 'opacity-75' : ''}`}>
                                    <td className="p-2">{editable && row._isNew ? <input type="date" value={row.date} onChange={(e) => updateRow(row._localId, 'date', e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm px-2">{formatDate(row.date)}</span>}</td>
                                    <td className="p-2">{editable ? <select value={row.carrier} onChange={(e) => updateRow(row._localId, 'carrier', e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Seleccionar</option>{MOCK_CARRIERS_B2B.map((c) => <option key={c} value={c}>{c}</option>)}</select> : <span className="text-sm font-medium px-2">{row.carrier}</span>}</td>
                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <input
                                                type="text"
                                                value={row.retira || ''}
                                                onChange={(e) => updateRow(row._localId, 'retira', e.target.value)}
                                                placeholder="Retira"
                                                className="w-[120px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        ) : (
                                            <div className="text-xs font-medium px-2 text-muted-foreground truncate max-w-[120px]" title={row.retira}>
                                                {row.retira || '—'}
                                            </div>
                                        )}
                                    </td>
                                    <td className="p-2">{editable ? <input type="text" value={row.vehicle_plate} onChange={(e) => updateRow(row._localId, 'vehicle_plate', e.target.value.toUpperCase())} placeholder="AB 123 CD" className="w-[100px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm font-mono px-2">{row.vehicle_plate}</span>}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.trip_number} onChange={(e) => updateRow(row._localId, 'trip_number', e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="Nro" maxLength={6} className="w-[80px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm font-mono px-2">{row.trip_number}</span>}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.client} onChange={(e) => updateRow(row._localId, 'client', e.target.value)} placeholder="Nombre" className="w-[120px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm font-medium px-2">{row.client}</span>}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.client_shift} onChange={(e) => updateRow(row._localId, 'client_shift', e.target.value)} placeholder="Turno" className="w-[100px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm px-2">{row.client_shift}</span>}</td>
                                    <td className="p-2 text-center">{editable ? <input type="text" value={row.task_count} onChange={(e) => updateRow(row._localId, 'task_count', e.target.value.replace(/\D/g, '').slice(0, 4))} maxLength={4} className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring mx-auto block" /> : <span className="text-sm">{row.task_count}</span>}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.port} onChange={(e) => updateRow(row._localId, 'port', e.target.value)} placeholder="Puerto" className="w-[70px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm font-mono px-2">{row.port}</span>}</td>
                                    <td className="p-2 text-center">{editable ? <input type="text" value={row.pallets} onChange={(e) => updateRow(row._localId, 'pallets', e.target.value.replace(/\D/g, '').slice(0, 2))} maxLength={2} className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring mx-auto block" /> : <span className="text-sm font-semibold">{row.pallets}</span>}</td>
                                    <td className="p-2">{editable ? <OperatorMultiSelect selected={row.operators} warehouse={warehouse} onToggle={(op) => toggleOperator(row._localId, op, false)} /> : <div className="flex flex-wrap gap-1">{row.operators.map((op) => <span key={op} className="rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">{op.split(' ')[0]}</span>)}</div>}</td>
                                    <td className="p-2 text-center">{editable ? <button onClick={() => updateRow(row._localId, 'documents_printed', !row.documents_printed)} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${row.documents_printed ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-transparent border-input text-muted-foreground hover:text-foreground'}`}>{row.documents_printed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</button> : row.documents_printed ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-red-400 mx-auto" />}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.detail} onChange={(e) => updateRow(row._localId, 'detail', e.target.value)} placeholder="Detalle..." className="w-[130px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm truncate max-w-[130px] block" title={row.detail}>{row.detail || '—'}</span>}</td>
                                    <td className="p-2">{editable ? <input type="text" value={row.comments} onChange={(e) => updateRow(row._localId, 'comments', e.target.value)} placeholder="Comentarios..." className="w-[130px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring" /> : <span className="text-sm truncate max-w-[130px] block" title={row.comments}>{row.comments || '—'}</span>}</td>
                                    <td className="p-2 text-center">{editable ? <button onClick={() => updateRow(row._localId, 'bulk_cargo', !row.bulk_cargo)} className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${row.bulk_cargo ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400' : 'bg-transparent border-input text-muted-foreground'}`}>{row.bulk_cargo ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}</button> : row.bulk_cargo ? <Check className="h-4 w-4 text-emerald-400 mx-auto" /> : <X className="h-4 w-4 text-muted-foreground mx-auto" />}</td>
                                    <td className="p-2">{editable ? <select value={row.status} onChange={(e) => updateRow(row._localId, 'status', e.target.value)} className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-ring"><option value="">Seleccionar</option>{Object.entries(TRIP_STATUS_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select> : <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold bg-muted/60 text-slate-700">{row.status ? TRIP_STATUS_LABELS[row.status as TripStatus] : '—'}</span>}</td>
                                    <td className="p-2">
                                        <div className="flex items-center justify-center gap-1">
                                             {!editable && <span title="Bloqueada — +48hs"><Lock className="h-4 w-4 text-muted-foreground" /></span>}
                                            {editable && !row._saved && (
                                                <button onClick={() => saveRow(row._localId)} className={`rounded-md p-1.5 transition-colors text-emerald-400 hover:bg-emerald-500/20`} title={"Guardar"}><Save className="h-4 w-4" /></button>
                                            )}
                                            {(editable || currentUserRole === 'operative') && <button onClick={() => removeRow(row._localId)} className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20 transition-colors" title="Eliminar"><Trash2 className="h-4 w-4" /></button>}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={17} className="py-12 text-center text-muted-foreground">
                                    <p className="text-lg font-medium">Sin viajes B2B registrados</p>
                                    <p className="text-sm mt-1">Hacé clic en &quot;Nueva Fila&quot; o &quot;Refrescar desde Sheet&quot;.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

// --- Helpers ---

function OperatorMultiSelect({ 
    selected, 
    warehouse,
    onToggle 
}: { 
    selected: string[]; 
    warehouse: string;
    onToggle: (op: string) => void 
}) {
    const [isOpen, setIsOpen] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const allOperators = getOperatorsForContext(warehouse)
    
    const filteredOperators = allOperators.filter(op => 
        op.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="relative">
            <button 
                type="button" 
                onClick={() => setIsOpen(!isOpen)} 
                className="flex w-full min-w-[120px] items-center justify-between rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
                <div className="flex-1 text-left truncate">
                    {selected.length === 0 ? (
                        <span className="text-muted-foreground">Seleccionar...</span>
                    ) : (
                        <span className="truncate font-medium">{selected[0]}</span>
                    )}
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 opacity-40 ml-1" />
            </button>
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => { setIsOpen(false); setSearchTerm(''); }} />
                    <div className="absolute z-50 mt-1 w-64 rounded-md border bg-popover p-2 shadow-xl animate-in fade-in zoom-in-95 duration-100">
                        {/* Buscador */}
                        <div className="relative mb-2">
                            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                            <input
                                autoFocus
                                type="text"
                                placeholder="Buscar por nombre..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full rounded-md border border-input bg-transparent py-2 pl-7 pr-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        <div className="max-h-48 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                            {filteredOperators.length > 0 ? (
                                filteredOperators.map((op) => (
                                    <button 
                                        key={op} 
                                        type="button" 
                                        onClick={() => {
                                            onToggle(op);
                                            setIsOpen(false);
                                            setSearchTerm('');
                                        }} 
                                        className={`w-full flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-all hover:bg-accent ${
                                            selected.includes(op) ? 'bg-primary/5 text-primary font-medium' : 'text-foreground'
                                        }`}
                                    >
                                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border transition-all ${
                                            selected.includes(op) 
                                                ? 'bg-primary border-primary text-primary-foreground' 
                                                : 'border-input bg-background'
                                        }`}>
                                            {selected.includes(op) && <Check className="h-3 w-3 stroke-[3]" />}
                                        </div>
                                        <span className="truncate">{op}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="py-4 text-center text-xs text-muted-foreground italic">
                                    No se encontraron operarios
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                    {selected.map((op) => <span key={op} className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">{op.split(' ')[0]}</span>)}
                </div>
            )}
        </div>
    )
}
