'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Trash2, RefreshCcw, ArrowLeft, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTrackingTrips } from '@/hooks/useTrackingTrips'
import { TRIP_STATUS_LABELS } from '@/types/tracking'
import Link from 'next/link'

export default function DeletedTripsPage() {
    const params = useParams()
    const warehouse = params?.warehouse as string | undefined
    const [deletedTrips, setDeletedTrips] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const loadDeleted = async () => {
        setIsLoading(true)
        try {
            const url = warehouse 
                ? `/api/tracking?warehouse=${warehouse}&showDeleted=true`
                : `/api/tracking?showDeleted=true`
            const res = await fetch(url)
            const data = await res.json()
            setDeletedTrips(data)
        } catch (error) {
            console.error('Error loading deleted trips:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        loadDeleted()
    }, [warehouse])

    const handlePermanentDelete = async (id: string) => {
        if (!window.confirm('¿Estás seguro de que deseás eliminar este registro PERMANENTEMENTE? Esta acción no se puede deshacer.')) {
            return
        }

        try {
            // Using a query param 'permanent=true' for our API
            const res = await fetch(`/api/tracking?id=${id}&permanent=true`, { method: 'DELETE' })
            if (res.ok) {
                alert('Registro eliminado definitivamente')
                loadDeleted()
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'No se pudo eliminar'))
            }
        } catch (error) {
            alert('Error de red al intentar eliminar')
        }
    }

    const handleDeleteAll = async () => {
        const msg = warehouse 
            ? `¿Estás seguro de que deseás eliminar TODOS los registros de este depósito (${warehouse}) PERMANENTEMENTE?`
            : '¿Estás seguro de que deseás eliminar TODOS los registros borrados PERMANENTEMENTE?'
        
        if (!window.confirm(msg)) {
            return
        }

        try {
            const url = warehouse 
                ? `/api/tracking?id=all&permanent=true&warehouse=${warehouse}`
                : `/api/tracking?id=all&permanent=true`
            
            const res = await fetch(url, { method: 'DELETE' })
            if (res.ok) {
                alert('Papelera vaciada correctamente')
                loadDeleted()
            } else {
                const err = await res.json()
                alert('Error: ' + (err.error || 'No se pudo vaciar la papelera'))
            }
        } catch (error) {
            alert('Error de red')
        }
    }

    const handleRestore = async (id: string) => {
        try {
            const res = await fetch('/api/tracking', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status: 'pending' })
            })
            if (res.ok) {
                alert('Registro restaurado a "Pendiente"')
                loadDeleted()
            }
        } catch (error) {
            alert('Error al restaurar')
        }
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href={warehouse ? `/tracking/${warehouse}` : '/tracking'}>
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Papelera de Reciclaje</h1>
                        <p className="text-muted-foreground">Administración de viajes borrados {warehouse ? `(${warehouse})` : '(Todos)'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {deletedTrips.length > 0 && (
                        <Button 
                            variant="destructive" 
                            size="sm" 
                            onClick={handleDeleteAll} 
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Vaciar Papelera
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={loadDeleted} disabled={isLoading}>
                        <RefreshCcw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Actualizar
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Trash2 className="h-5 w-5 text-muted-foreground" />
                        Viajes en espera de eliminación definitiva
                    </CardTitle>
                    <CardDescription>
                        Solo los administradores pueden ver esta sección y realizar el borrado final del sistema.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {deletedTrips.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                            <AlertCircle className="h-8 w-8 mb-2 opacity-20" />
                            <p>No hay viajes marcados para borrar en este depósito.</p>
                        </div>
                    ) : (
                        <div className="relative overflow-x-auto rounded-md border">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted text-muted-foreground uppercase text-[10px] font-bold">
                                    <tr>
                                        <th className="px-4 py-3">Fecha</th>
                                        <th className="px-4 py-3">Transporte</th>
                                        <th className="px-4 py-3">Viaje</th>
                                        <th className="px-4 py-3">Cliente</th>
                                        <th className="px-4 py-3">Borrado el</th>
                                        <th className="px-4 py-3">Depósito</th>
                                        <th className="px-4 py-3 text-right">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {deletedTrips.map((trip) => (
                                        <tr key={trip.id} className="hover:bg-muted/50 transition-colors">
                                            <td className="px-4 py-3">{new Date(trip.date).toLocaleDateString()}</td>
                                            <td className="px-4 py-3 font-medium">{trip.carrier}</td>
                                            <td className="px-4 py-3 font-mono text-xs">{trip.trip_number}</td>
                                            <td className="px-4 py-3">{trip.client || '—'}</td>
                                            <td className="px-4 py-3 text-xs text-muted-foreground">
                                                {new Date(trip.updated_at).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3">
                                                <Badge variant="outline">{trip.warehouse}</Badge>
                                            </td>
                                            <td className="px-4 py-3 text-right space-x-2">
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    onClick={() => handleRestore(trip.id)}
                                                >
                                                    Restaurar
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="sm" 
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    onClick={() => handlePermanentDelete(trip.id)}
                                                >
                                                    Eliminar Permanente
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
