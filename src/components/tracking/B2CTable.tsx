'use client'

import { useState, useCallback, useEffect } from 'react'
import type { B2CTrip, TripStatus } from '@/types/tracking'
import { TRIP_STATUS_LABELS, canEditRow } from '@/types/tracking'
import { Check, X, Plus, Save, Trash2, Lock, Search, ChevronDown, RefreshCw, FileSpreadsheet, HelpCircle } from 'lucide-react'
import { MOCK_CARRIERS_B2C, getOperatorsForContext, MOCK_LABELERS } from '@/lib/mock-tracking'
import { useProfile } from '@/hooks/useProfile'
import { useAutoSaveField } from '@/hooks/useAutoSaveField'
import { formatDate } from '@/lib/utils'

// Tooltips centralizados
const TOOLTIPS = {
    fecha: 'Fecha de preparación del viaje',
    viaje: 'Número identificador del viaje',
    transporte: 'Operador logístico que retira',
    retira: 'Solo Flota propia',
    patente: 'Patente del vehículo',
    operarios: 'Operario que preparó el viaje',
    pallets: 'Pallets utilizados en la preparación del viaje',
    bultos: 'Cantidad de bultos/cajas',
    estado: 'Estado actual del viaje',
    pallets_despachados: 'Pallets ya despachados',
    etiquetador: 'Persona que etiqueta los envíos',
    acciones: 'Opciones: editar, eliminar, etc.',
}

// Componente de encabezado con tooltip
function ColumnHeader({ label, tooltipKey }: { label: string; tooltipKey: keyof typeof TOOLTIPS }) {
    const [show, setShow] = useState(false)
    const tooltip = TOOLTIPS[tooltipKey]

    return (
        <div
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'help',
                position: 'relative'
            }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <span>{label}</span>
            <HelpCircle size={14} color="#94a3b8" style={{ flexShrink: 0 }} />
            {show && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: 'calc(100% + 6px)',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        backgroundColor: '#1e293b',
                        color: 'white',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        whiteSpace: 'nowrap',
                        zIndex: 1000,
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
                        pointerEvents: 'none'
                    }}
                >
                    {tooltip}
                </div>
            )}
        </div>
    )
}

export interface B2CRowDraft {
    _localId: string
    _saved: boolean
    _isNew: boolean
    created_by: string
    created_at: string
    date: string
    carrier: string
    trip_number: string
    operators: string[]
    pallet_count: string
    port: string
    task_count: string
    status: TripStatus | ''
    pallets_dispatched: string
    labeler: string
    documents_printed: boolean
    vehicle_plate?: string
    retira?: string
}

function createEmptyB2CRow(userId: string): B2CRowDraft {
    return {
        _localId: crypto.randomUUID(),
        _saved: false,
        _isNew: true,
        created_by: userId,
        created_at: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        carrier: '',
        trip_number: '',
        operators: [],
        pallet_count: '',
        port: '',
        task_count: '',
        status: '',
        pallets_dispatched: '',
        labeler: '',
        documents_printed: false,
        retira: '',
        vehicle_plate: '',
    }
}

function tripToRow(trip: B2CTrip): B2CRowDraft {
    return {
        _localId: trip.id,
        _saved: true,
        _isNew: false,
        created_by: trip.created_by,
        created_at: trip.created_at,
        date: trip.date ? trip.date.split('T')[0] : '',
        carrier: trip.carrier,
        trip_number: trip.trip_number,
        operators: [...trip.operators],
        pallet_count: trip.pallet_count != null ? String(trip.pallet_count) : '',
        port: trip.port,
        task_count: trip.task_count != null ? String(trip.task_count) : '',
        status: trip.status,
        pallets_dispatched: trip.pallets_dispatched != null ? String(trip.pallets_dispatched) : '',
        labeler: trip.labeler,
        documents_printed: trip.documents_printed,
        retira: trip.retira,
        vehicle_plate: trip.vehicle_plate,
    }
}

function isRowComplete(row: B2CRowDraft): boolean {
    return (
        row.date !== '' &&
        row.carrier !== '' &&
        row.trip_number !== '' &&
        row.operators.length > 0 &&
        row.pallet_count !== '' &&
        row.port !== '' &&
        row.task_count !== '' &&
        row.status !== '' &&
        row.pallets_dispatched !== '' &&
        row.labeler !== ''
    )
}

interface B2CTableProps {
    trips: B2CTrip[]
    warehouse: 'PL2' | 'PL3'
    onUnsavedChange?: (hasUnsaved: boolean) => void
    onSave: (data: any, isNew: boolean) => Promise<any>
    onSaveBatch: (data: any[], areNew: boolean) => Promise<any>
    onDelete: (id: string) => Promise<any>
    onRefresh: () => Promise<void>
}

export function B2CTable({ trips, warehouse, onUnsavedChange, onSave, onSaveBatch, onDelete, onRefresh }: B2CTableProps) {
    const { profile } = useProfile()
    const currentUserId = profile?.id || 'unknown'
    const currentUserRole = profile?.role || 'operative'
    const [rows, setRows] = useState<B2CRowDraft[]>(() => trips.map(tripToRow))
    const [importedRows, setImportedRows] = useState<B2CRowDraft[]>([])
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastRefresh, setLastRefresh] = useState<string | null>(null)

    useEffect(() => {
        setRows(prev => {
            const drafts = prev.filter(r => !r._saved)
            const draftIds = drafts.map(d => d._localId)
            const synced = trips.map(tripToRow).filter(s => !draftIds.includes(s._localId))
            return [...drafts, ...synced]
        })
    }, [trips])

    const unsavedRows = rows.filter((r) => !r._saved)
    const hasUnsaved = unsavedRows.length > 0 || importedRows.length > 0

    const updateRow = useCallback(
        (localId: string, field: keyof B2CRowDraft, value: unknown) => {
            setRows((prev) => {
                const next = prev.map((row) => {
                    if (row._localId !== localId) return row
                    return { ...row, [field]: value, _saved: false }
                })
                onUnsavedChange?.(next.some((r) => !r._saved))
                return next
            })
        },
        [onUnsavedChange]
    )

    const addRow = useCallback(() => {
        const newRow = createEmptyB2CRow(currentUserId)
        setRows((prev) => [newRow, ...prev])
        onUnsavedChange?.(true)
    }, [onUnsavedChange, currentUserId])

    const handleRefreshFromSheet = useCallback(async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch(`/api/tracking/import-sheet?warehouse=${warehouse}`)
            if (!res.ok) throw new Error('Error en la API de importación')

            const data = await res.json()
            if (data.error) throw new Error(data.error)

            const newImports = data
                .filter((item: any) => item.trip_type === 'b2c')
                .map((item: any) => ({
                    _localId: `sheet-${item.trip_number}-${Date.now()}`,
                    _saved: false,
                    _isNew: true,
                    created_by: currentUserId,
                    created_at: new Date().toISOString(),
                    date: item.date,
                    carrier: item.carrier,
                    retira: item.retira,
                    vehicle_plate: item.vehicle_plate,
                    trip_number: item.trip_number,
                    operators: [],
                    pallet_count: String(item.pallets || '0'),
                    port: item.port,
                    status: 'pending' as const,
                    task_count: String(item.task_count || '0'),
                    pallets_dispatched: '0',
                    labeler: '',
                    documents_printed: false,
                }))
                .filter((row: any) => !rows.some(r => r.trip_number === row.trip_number))
                .filter((row: any) => !importedRows.some(r => r.trip_number === row.trip_number))

            if (newImports.length > 0) {
                setImportedRows((prev) => [...prev, ...newImports])
                onUnsavedChange?.(true)
                alert(`Se encontraron ${newImports.length} nuevos viajes B2C para ${warehouse}`)
            } else {
                alert(`No se encontraron nuevos viajes B2C para ${warehouse} en el Sheet`)
            }

            setLastRefresh(new Date().toLocaleTimeString('es-AR'))
        } catch (error: any) {
            console.error('B2C Import Error:', error)
            alert('Error al importar B2C: ' + error.message)
        } finally {
            setIsRefreshing(false)
        }
    }, [rows, importedRows, warehouse, currentUserId, onUnsavedChange])

    const confirmImportedRow = useCallback(
        async (localId: string) => {
            const row = importedRows.find((r) => r._localId === localId)
            if (!row) return

            try {
                const { _localId, _saved, _isNew, ...tripData } = row
                await onSave({ ...tripData, trip_type: 'b2c', warehouse }, true)
                setImportedRows((prev) => prev.filter((r) => r._localId !== localId))
                onUnsavedChange?.(unsavedRows.length > 0 || importedRows.length > 1)
            } catch (error) {
                alert('Error al confirmar: ' + (error instanceof Error ? error.message : String(error)))
            }
        },
        [importedRows, onSave, onUnsavedChange, unsavedRows.length]
    )

    const confirmAllImported = useCallback(async () => {
        if (importedRows.length === 0) return
        const confirmed = window.confirm(`¿Deseás confirmar los ${importedRows.length} viajes B2C importados?`)
        if (!confirmed) return

        setIsRefreshing(true)
        try {
            const batch = importedRows.map(row => {
                const { _localId, _saved, _isNew, ...tripData } = row as any
                return {
                    ...tripData,
                    trip_type: 'b2c',
                    warehouse,
                    task_count: Number(tripData.task_count || 0),
                    pallet_count: Number(tripData.pallet_count || 0),
                    status: tripData.status || 'pending'
                }
            })
            await onSaveBatch(batch, true)
            setImportedRows([])
            onUnsavedChange?.(unsavedRows.length > 0)
            await onRefresh()
            alert(`${batch.length} viajes B2C confirmados correctamente`)
        } catch (e) {
            console.error("Error confirming B2C batch", e)
            alert("Error al confirmar lote B2C: " + (e instanceof Error ? e.message : String(e)))
        } finally {
            setIsRefreshing(false)
        }
    }, [importedRows, onSaveBatch, onRefresh, warehouse, unsavedRows.length, onUnsavedChange])

    const discardImportedRow = useCallback(
        (localId: string) => {
            setImportedRows((prev) => prev.filter((r) => r._localId !== localId))
            onUnsavedChange?.(unsavedRows.length > 0 || importedRows.length > 1)
        },
        [importedRows.length, onUnsavedChange, unsavedRows.length]
    )

    const removeRow = useCallback(
        async (localId: string) => {
            console.log('B2CTable: removeRow called for localId:', localId)
            const row = rows.find(r => r._localId === localId)
            console.log('B2CTable: Found row:', row)

            if (row?._saved) {
                const confirmed = window.confirm('¿Deseás enviar este viaje al módulo de Borrado? Podrá ser eliminado definitivamente por un administrador.')
                if (!confirmed) return
                try {
                    console.log('B2CTable: Calling onDelete for:', localId)
                    await onDelete(localId)
                    alert("Viaje enviado al módulo de Borrado")
                } catch (e) {
                    console.error('B2CTable: Deletion failed:', e)
                    alert("Error al eliminar el viaje: " + (e instanceof Error ? e.message : String(e)))
                    return
                }
            }

            setRows((prev) => {
                const next = prev.filter((r) => r._localId !== localId)
                onUnsavedChange?.(next.some((r) => !r._saved))
                return next
            })
        },
        [onUnsavedChange, rows, onDelete]
    )

    const saveRow = useCallback(
        async (localId: string) => {
            const row = rows.find(r => r._localId === localId)
            if (!row) return

            try {
                const { _localId, _saved, _isNew, ...payload } = row as any
                if (!payload.task_count) payload.task_count = 0; else payload.task_count = Number(payload.task_count);
                if (!payload.pallet_count) payload.pallet_count = 0; else payload.pallet_count = Number(payload.pallet_count);
                if (!payload.pallets_dispatched) payload.pallets_dispatched = 0; else payload.pallets_dispatched = Number(payload.pallets_dispatched);
                if (!payload.status) payload.status = 'pending';

                const savedTrip = await onSave({ ...payload, trip_type: 'b2c', warehouse, ...(row._isNew ? {} : { id: localId }) }, row._isNew)

                setRows((prev) => {
                    const next = prev.map((r) => {
                        if (r._localId !== localId) return r
                        return { ...r, _localId: savedTrip.id, _saved: true, _isNew: false }
                    })
                    onUnsavedChange?.(next.some((r) => !r._saved))
                    return next
                })
                await onRefresh()
            } catch (error) {
                console.error("Error saving row", error)
                alert("Error guardando el viaje")
            }
        },
        [rows, onSave, onRefresh, onUnsavedChange, warehouse]
    )

    const saveAll = useCallback(async () => {
        const rowsToSave = rows.filter((row) => !row._saved)
        if (rowsToSave.length === 0) return

        try {
            await Promise.all(rowsToSave.map(row => {
                const { _localId, _saved, _isNew, ...payload } = row as any
                if (!payload.task_count) payload.task_count = 0; else payload.task_count = Number(payload.task_count);
                if (!payload.pallet_count) payload.pallet_count = 0; else payload.pallet_count = Number(payload.pallet_count);
                if (!payload.pallets_dispatched) payload.pallets_dispatched = 0; else payload.pallets_dispatched = Number(payload.pallets_dispatched);
                if (!payload.status) payload.status = 'pending';

                return onSave({ ...payload, trip_type: 'b2c', warehouse, ...(row._isNew ? {} : { id: row._localId }) }, row._isNew)
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
                onUnsavedChange?.(next.some((r) => !r._saved))
                return next
            })
            await onRefresh()
        } catch (error) {
            console.error(error)
            alert("Error guardando los viajes")
        }
    }, [rows, onSave, onRefresh, onUnsavedChange, warehouse])

    const toggleOperator = useCallback(
        (localId: string, operator: string) => {
            setRows((prev) => {
                const next = prev.map((row) => {
                    if (row._localId !== localId) return row
                    const hasOp = row.operators.includes(operator)
                    const newOps = hasOp ? [] : [operator]
                    return { ...row, operators: newOps, _saved: false }
                })
                onUnsavedChange?.(next.some((r) => !r._saved))
                return next
            })
        },
        [onUnsavedChange]
    )

    return (
        <div className="flex flex-col gap-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button
                        onClick={addRow}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nueva Fila
                    </button>
                    {importedRows.length === 0 && (
                        <button
                            onClick={handleRefreshFromSheet}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                            <FileSpreadsheet className={`h-4 w-4 ${isRefreshing ? 'animate-bounce' : ''}`} />
                            {isRefreshing ? 'Sincronizando...' : 'Refresco desde sheet'}
                        </button>
                    )}
                    {hasUnsaved && (
                        <button
                            onClick={saveAll}
                            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-colors"
                        >
                            <Save className="h-4 w-4" />
                            Guardar Todo ({unsavedRows.length})
                        </button>
                    )}
                </div>
                <div className="text-right">
                    {lastRefresh && (
                        <div className="text-[10px] text-muted-foreground italic mb-1">
                            Última sincronización: {lastRefresh}
                        </div>
                    )}
                    {hasUnsaved && (
                        <span className="text-sm text-amber-400 flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                            {unsavedRows.length} fila(s) sin guardar
                        </span>
                    )}
                </div>
            </div>

            {importedRows.length > 0 && (
                <div className="mb-2 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2 text-emerald-700">
                            <FileSpreadsheet className="h-5 w-5" />
                            <h3 className="text-sm font-bold uppercase tracking-tight">Viajes encontrados en Google Sheet (B2C)</h3>
                            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
                                {importedRows.length} por confirmar
                            </span>
                        </div>
                        <button
                            onClick={handleRefreshFromSheet}
                            disabled={isRefreshing}
                            className="text-xs font-semibold text-emerald-600 hover:text-emerald-800 disabled:opacity-50 flex items-center gap-1"
                        >
                            <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                            Actualizar
                        </button>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button
                            onClick={confirmAllImported}
                            disabled={isRefreshing}
                            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition-all disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />
                            Confirmar Todos los Viajes ({importedRows.length})
                        </button>
                        <button
                            onClick={() => { if (window.confirm('¿Descartar todos los viajes encontrados?')) setImportedRows([]); }}
                            className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-red-50 hover:text-red-600 transition-all"
                        >
                            <X className="h-4 w-4" />
                            Descartar Todo
                        </button>
                    </div>

                    <div className="relative overflow-x-auto rounded-xl border border-emerald-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-emerald-500/10 text-emerald-800 uppercase text-[10px] font-bold">
                                <tr>
                                    <th className="px-4 py-3">Fecha</th>
                                    <th className="px-4 py-3">Viaje</th>
                                    <th className="px-4 py-3">Transporte</th>
                                    <th className="px-4 py-3">Retira</th>
                                    <th className="px-4 py-3">Patente</th>
                                    <th className="px-4 py-3">Bultos</th>
                                    <th className="px-4 py-3 text-center">Bultos</th>
                                    <th className="px-4 py-3">Depósito</th>
                                    <th className="px-4 py-3 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-emerald-100 bg-white">
                                {importedRows.map((row) => (
                                    <tr key={row._localId} className="hover:bg-emerald-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">{formatDate(row.date)}</td>
                                        <td className="px-4 py-3 font-mono text-xs font-bold">{row.trip_number}</td>
                                        <td className="px-4 py-3 text-emerald-700 font-semibold">{row.carrier}</td>
                                        <td className="px-4 py-3">{row.retira || '—'}</td>
                                        <td className="px-4 py-3 font-mono text-xs">{row.vehicle_plate || '—'}</td>
                                        <td className="px-4 py-3">{row.task_count}</td>
                                        <td className="px-4 py-3 text-center">{row.pallet_count}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                                                {(row as any).warehouse || warehouse}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => confirmImportedRow(row._localId)}
                                                    className="p-1.5 rounded-md bg-emerald-100 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all"
                                                    title="Confirmar"
                                                >
                                                    <Check className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => discardImportedRow(row._localId)}
                                                    className="p-1.5 rounded-md hover:bg-red-50 text-slate-400 hover:text-red-600 transition-all"
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

            <div className="relative w-full overflow-visible rounded-lg border bg-white">
                <table className="w-full min-w-max caption-bottom text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap w-[100px]">
                                <ColumnHeader label="Fecha" tooltipKey="fecha" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Viaje" tooltipKey="viaje" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Transporte" tooltipKey="transporte" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap w-[120px]">
                                <ColumnHeader label="Retira" tooltipKey="retira" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap w-[100px]">
                                <ColumnHeader label="Patente" tooltipKey="patente" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Operario/os" tooltipKey="operarios" />
                            </th>

                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap text-xs">
                                <ColumnHeader label="Pallets" tooltipKey="pallets" />
                            </th>

                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Bultos" tooltipKey="bultos" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Estado" tooltipKey="estado" />
                            </th>

                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap text-xs leading-tight">
                                <ColumnHeader label="Pallets Desp." tooltipKey="pallets_despachados" />
                            </th>

                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">
                                <ColumnHeader label="Etiquetador" tooltipKey="etiquetador" />
                            </th>

                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap w-[80px]">
                                <ColumnHeader label="Acciones" tooltipKey="acciones" />
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => {
                            const complete = isRowComplete(row)
                            const editable = row._isNew || canEditRow(
                                row.created_at,
                                row.created_by,
                                currentUserId,
                                currentUserRole
                            )
                            const rowBorder = !row._saved
                                ? complete
                                    ? 'border-l-2 border-l-emerald-500'
                                    : 'border-l-2 border-l-amber-500'
                                : !editable
                                    ? 'border-l-2 border-l-muted-foreground/30'
                                    : ''

                            return (
                                <tr
                                    key={row._localId}
                                    className={`border-b transition-colors hover:bg-muted/20 ${rowBorder} ${!editable ? 'opacity-75' : ''}`}
                                >
                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <input
                                                type="date"
                                                value={row.date}
                                                onChange={(e) => updateRow(row._localId, 'date', e.target.value)}
                                                className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        ) : (
                                            <span className="text-sm px-2">{formatDate(row.date)}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <input
                                                type="text"
                                                value={row.trip_number}
                                                onChange={(e) => {
                                                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                                                    updateRow(row._localId, 'trip_number', val)
                                                }}
                                                placeholder="000000"
                                                maxLength={6}
                                                className="w-[80px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono px-2">{row.trip_number}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <select
                                                value={row.carrier}
                                                onChange={(e) => updateRow(row._localId, 'carrier', e.target.value)}
                                                className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            >
                                                <option value="">Seleccionar</option>
                                                {MOCK_CARRIERS_B2C.map((c) => (
                                                    <option key={c} value={c}>{c}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-sm font-medium px-2">{row.carrier}</span>
                                        )}
                                    </td>

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

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <input
                                                type="text"
                                                value={row.vehicle_plate || ''}
                                                onChange={(e) => updateRow(row._localId, 'vehicle_plate', e.target.value.toUpperCase())}
                                                placeholder="AB 123 CD"
                                                className="w-[100px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        ) : (
                                            <div className="text-xs font-mono px-2 text-muted-foreground">
                                                {row.vehicle_plate || '—'}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <OperatorMultiSelect
                                                selected={row.operators}
                                                warehouse={warehouse}
                                                onToggle={(op) => toggleOperator(row._localId, op)}
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-1">
                                                {row.operators.map((op) => (
                                                    <span key={op} className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                                                        {op.split(' ')[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle text-center">
                                        {editable ? (
                                            <input
                                                type="text"
                                                value={row.pallet_count}
                                                onChange={(e) => updateRow(row._localId, 'pallet_count', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                                maxLength={2}
                                                className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring mx-auto block"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold">{row.pallet_count}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle text-center">
                                        {editable ? (
                                            <BultosAutoSaveInput
                                                rowId={row._localId}
                                                value={row.task_count}
                                                onChange={(newValue) => updateRow(row._localId, 'task_count', newValue)}
                                                onAutoSave={async (newValue) => {
                                                    if (row._isNew) {
                                                        throw new Error('Primero guarde la fila completa')
                                                    }

                                                    const { _localId, _saved, _isNew, ...payload } = row as any
                                                    
                                                    const savePayload = {
                                                        ...payload,
                                                        task_count: parseInt(newValue) || 0,
                                                        pallet_count: parseInt(row.pallet_count) || 0,
                                                        pallets_dispatched: parseInt(row.pallets_dispatched) || 0,
                                                        status: payload.status || 'pending',
                                                        trip_type: 'b2c',
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
                                                            onUnsavedChange?.(next.some((r) => !r._saved))
                                                            return next
                                                        })
                                                    } catch (error) {
                                                        console.error('Error auto-guardando bultos:', error)
                                                        throw error
                                                    }
                                                }}
                                            />
                                        ) : (
                                            <span className="text-sm">{row.task_count}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <select
                                                value={row.status}
                                                onChange={(e) => updateRow(row._localId, 'status', e.target.value)}
                                                className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-black focus:outline-none focus:ring-1 focus:ring-ring"
                                            >
                                                <option value="">Seleccionar</option>
                                                {Object.entries(TRIP_STATUS_LABELS).map(([key, label]) => (
                                                    <option key={key} value={key}>{label}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${row.status ? 'bg-muted/50' : ''
                                                }`}>
                                                {row.status ? TRIP_STATUS_LABELS[row.status as TripStatus] : '—'}
                                            </span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle text-center">
                                        {editable ? (
                                            <input
                                                type="text" value={row.pallets_dispatched}
                                                onChange={(e) => updateRow(row._localId, 'pallets_dispatched', e.target.value.replace(/\D/g, '').slice(0, 2))}
                                                maxLength={2}
                                                className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring mx-auto block"
                                            />
                                        ) : (
                                            <span className="text-sm font-semibold">{row.pallets_dispatched}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <select
                                                value={row.labeler}
                                                onChange={(e) => updateRow(row._localId, 'labeler', e.target.value)}
                                                className="w-full rounded-md border border-input bg-transparent px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                                            >
                                                <option value="">Seleccionar</option>
                                                {MOCK_LABELERS.map((l) => (
                                                    <option key={l} value={l}>{l}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-sm px-2">{row.labeler}</span>
                                        )}
                                    </td>

                                    <td className="p-2 align-middle">
                                        <div className="flex items-center justify-center gap-1">
                                            {!editable && (
                                                <span title="Bloqueada — pasaron más de 48hs"><Lock className="h-4 w-4 text-muted-foreground" /></span>
                                            )}
                                            {editable && !row._saved && (
                                                <button
                                                    onClick={() => saveRow(row._localId)}
                                                    className="rounded-md p-1.5 transition-colors text-emerald-400 hover:bg-emerald-500/20"
                                                    title="Guardar fila"
                                                >
                                                    <Save className="h-4 w-4" />
                                                </button>
                                            )}
                                            {(editable || currentUserRole === 'operative') && (
                                                <button
                                                    onClick={() => removeRow(row._localId)}
                                                    className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}

                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={12} className="py-12 text-center text-muted-foreground">
                                    <p className="text-lg font-medium">Sin viajes B2C registrados</p>
                                    <p className="text-sm mt-1">Hacé clic en &quot;Nueva Fila&quot; para comenzar.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

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

                        <div className="max-h-64 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
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
                                        className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all hover:bg-accent ${selected.includes(op) ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
                                            }`}
                                    >
                                        <span className="truncate">{op}</span>
                                        {selected.includes(op) && <Check className="h-4 w-4 shrink-0" />}
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
                    {selected.map((op) => (
                        <span key={op} className="inline-flex items-center rounded-md bg-secondary px-1.5 py-0.5 text-[10px] font-medium">
                            {op.split(' ')[0]}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

function BultosAutoSaveInput({
  rowId,
  value,
  onChange,
  onAutoSave,
}: {
  rowId: string
  value: string
  onChange: (value: string) => void
  onAutoSave: (value: string) => Promise<void>
}) {
  const { status, error } = useAutoSaveField({
    value,
    onSave: async (newValue) => {
      await onAutoSave(newValue)
    },
    debounceMs: 1500,
  })

  return (
    <div className="relative inline-flex items-center gap-2">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          const newVal = e.target.value.replace(/\D/g, '').slice(0, 4)
          onChange(newVal)
        }}
        maxLength={4}
        disabled={status === 'saving'}
        className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50 transition-all"
        title={error ? `Error: ${error}` : 'Autoguardado automático'}
      />
      
      <div className="flex items-center gap-1 min-w-[24px]">
        {status === 'saving' && (
          <div 
            className="h-3 w-3 rounded-full border-2 border-transparent border-t-blue-500 animate-spin"
            title="Guardando..."
          />
        )}
        {status === 'saved' && (
          <span className="text-xs text-green-600 font-bold" title="Guardado">✓</span>
        )}
        {status === 'error' && (
          <span 
            className="text-xs text-red-600 font-bold cursor-help" 
            title={error || 'Error al guardar'}
          >
            !
          </span>
        )}
      </div>
    </div>
  )
}