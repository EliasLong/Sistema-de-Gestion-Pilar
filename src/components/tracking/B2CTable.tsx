'use client'

import { useState, useCallback, useEffect } from 'react'
import type { B2CTrip, TripStatus } from '@/types/tracking'
import { TRIP_STATUS_LABELS, canEditRow } from '@/types/tracking'
import { Check, X, Plus, Save, Trash2, Lock, Search, ChevronDown } from 'lucide-react'
import { MOCK_CARRIERS_B2C, getOperatorsForContext, MOCK_LABELERS } from '@/lib/mock-tracking'
import { useProfile } from '@/hooks/useProfile'

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
    }
}

function tripToRow(trip: B2CTrip): B2CRowDraft {
    return {
        _localId: trip.id,
        _saved: true,
        _isNew: false,
        created_by: trip.created_by,
        created_at: trip.created_at,
        date: trip.date,
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

    useEffect(() => {
        setRows(prev => {
            const drafts = prev.filter(r => !r._saved)
            const draftIds = drafts.map(d => d._localId)
            const synced = trips.map(tripToRow).filter(s => !draftIds.includes(s._localId))
            return [...drafts, ...synced]
        })
    }, [trips])

    const unsavedRows = rows.filter((r) => !r._saved)
    const hasUnsaved = unsavedRows.length > 0

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

    const removeRow = useCallback(
        async (localId: string) => {
            console.log('B2CTable: removeRow called for localId:', localId)
            const row = rows.find(r => r._localId === localId)
            console.log('B2CTable: Found row:', row)

            if (row?._saved) {
                const confirmed = window.confirm('¿Estás seguro de que deseás eliminar este viaje permanentemente?')
                if (!confirmed) return
                try {
                    console.log('B2CTable: Calling onDelete for:', localId)
                    await onDelete(localId)
                    alert("Viaje eliminado permanentemente")
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
                // Remove local draft properties
                const { _localId, _saved, _isNew, ...payload } = row as any
                if (!payload.task_count) payload.task_count = 0; else payload.task_count = Number(payload.task_count);
                if (!payload.pallet_count) payload.pallet_count = 0; else payload.pallet_count = Number(payload.pallet_count);
                if (!payload.pallets_dispatched) payload.pallets_dispatched = 0; else payload.pallets_dispatched = Number(payload.pallets_dispatched);
                if (!payload.status) payload.status = 'pending';

                await onSave({ ...payload, trip_type: 'b2c', warehouse }, row._isNew)
                
                setRows((prev) => {
                    const next = prev.map((r) => {
                        if (r._localId !== localId) return r
                        return { ...r, _saved: true, _isNew: false }
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

                return onSave({ ...payload, trip_type: 'b2c', warehouse }, row._isNew)
            }))
            
            setRows((prev) => {
                const next = prev.map((row) => {
                    if (row._saved) return row
                    return { ...row, _saved: true, _isNew: false }
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
                    // Selección única: si ya estaba, se quita; si no, reemplaza
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
                {hasUnsaved && (
                    <span className="text-sm text-amber-400 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
                        {unsavedRows.length} fila(s) sin guardar
                    </span>
                )}
            </div>

            {/* Table */}
            <div className="relative w-full overflow-visible rounded-lg border bg-white">
                <table className="w-full min-w-max caption-bottom text-sm">
                    <thead className="bg-muted/50">
                        <tr className="border-b">
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap w-[100px]">Fecha</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Transporte</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Viaje</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Operario/os</th>
                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap">Cant. Pallets</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Puerto</th>
                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap">Cant/Tareas</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Estado</th>
                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap">Pallets Desp.</th>
                            <th className="h-11 px-3 text-left align-middle font-semibold text-muted-foreground whitespace-nowrap">Etiquetador</th>
                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap">Papeles</th>
                            <th className="h-11 px-3 text-center align-middle font-semibold text-muted-foreground whitespace-nowrap w-[80px]">Acciones</th>
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
                                    {/* Fecha */}
                                    <td className="p-2 align-middle">
                                        {editable && row._isNew ? (
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

                                    {/* Transporte */}
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

                                    {/* Viaje */}
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

                                    {/* Operarios */}
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

                                    {/* Cant. Pallets */}
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

                                    {/* Puerto */}
                                    <td className="p-2 align-middle">
                                        {editable ? (
                                            <input
                                                type="text" value={row.port}
                                                onChange={(e) => updateRow(row._localId, 'port', e.target.value)}
                                                placeholder="Ej: A3"
                                                className="w-[70px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                                            />
                                        ) : (
                                            <span className="text-sm font-mono px-2">{row.port}</span>
                                        )}
                                    </td>

                                    {/* Cant/Tareas */}
                                    <td className="p-2 align-middle text-center">
                                        {editable ? (
                                            <input
                                                type="text" value={row.task_count}
                                                onChange={(e) => updateRow(row._localId, 'task_count', e.target.value.replace(/\D/g, '').slice(0, 4))}
                                                maxLength={4}
                                                className="w-[60px] rounded-md border border-input bg-transparent px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-ring mx-auto block"
                                            />
                                        ) : (
                                            <span className="text-sm">{row.task_count}</span>
                                        )}
                                    </td>

                                    {/* Estado */}
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

                                    {/* Pallets Despachados */}
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

                                    {/* Etiquetador */}
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

                                    {/* Papeles */}
                                    <td className="p-2 align-middle text-center">
                                        {editable ? (
                                            <button
                                                onClick={() => updateRow(row._localId, 'documents_printed', !row.documents_printed)}
                                                className={`mx-auto flex h-7 w-7 items-center justify-center rounded-md border transition-colors ${row.documents_printed
                                                        ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                                        : 'bg-transparent border-input text-muted-foreground hover:text-foreground'
                                                    }`}
                                            >
                                                {row.documents_printed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                            </button>
                                        ) : (
                                            row.documents_printed
                                                ? <Check className="h-4 w-4 text-emerald-400 mx-auto" />
                                                : <X className="h-4 w-4 text-red-400 mx-auto" />
                                        )}
                                    </td>

                                    {/* Acciones */}
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

// --- Helpers ---

function formatDate(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00')
    return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

// --- Multi-select de operarios ---

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
                                        className={`w-full flex items-center justify-between rounded-md px-3 py-2 text-sm transition-all hover:bg-accent ${
                                            selected.includes(op) ? 'bg-primary/10 text-primary font-semibold' : 'text-foreground'
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
