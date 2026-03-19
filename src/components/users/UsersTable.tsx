'use client'

import { useEffect, useState } from 'react'
import { Check, Edit, ShieldAlert, AlertTriangle } from 'lucide-react'
import type { User, UserRole } from '@/types/database'

export function UsersTable() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [updatingId, setUpdatingId] = useState<string | null>(null)

    const fetchUsers = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/users')
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error fetching users')
            }
            const data = await res.json()
            setUsers(data.users || [])
        } catch (e: any) {
            setError(e.message)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setUpdatingId(userId)
        try {
            const res = await fetch('/api/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: userId, newRole }),
            })
            
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error updating role')
            }

            const { user: updatedUser } = await res.json()
            
            setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u))
            alert('Rol actualizado con éxito.')
        } catch (e: any) {
            alert('Error: ' + e.message)
        } finally {
            setUpdatingId(null)
        }
    }

    if (isLoading) {
        return (
            <div className="flex justify-center p-10">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="flex items-center space-x-2 text-destructive bg-destructive/10 p-4 rounded-md">
                <ShieldAlert className="h-5 w-5" />
                <span>{error}. Asegúrate de ser administrador e iniciar sesión.</span>
            </div>
        )
    }

    return (
        <div className="rounded-md border bg-card text-card-foreground shadow-sm">
            <div className="p-6 pb-4">
                <h3 className="text-lg font-semibold leading-none tracking-tight">Gestión de Usuarios</h3>
                <p className="text-sm text-muted-foreground mt-2">Administra los roles y accesos de tu equipo a nivel global.</p>
            </div>
            
            <div className="relative w-full overflow-auto p-0">
                <table className="w-full caption-bottom text-sm mt-4">
                    <thead className="[&_tr]:border-b bg-muted/50 text-muted-foreground">
                        <tr className="border-b transition-colors">
                            <th className="h-12 px-4 text-left align-middle font-medium">Avatar / Nombre</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Correo Electrónico</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Fecha de Registro</th>
                            <th className="h-12 px-4 text-left align-middle font-medium">Rol del Usuario</th>
                        </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0 bg-background">
                        {users.map((user) => (
                            <tr key={user.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">
                                    <div className="flex items-center gap-3">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="Avatar" className="h-8 w-8 rounded-full" />
                                        ) : (
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary font-bold">
                                                {user.email.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        <span className="font-medium">{user.full_name || 'Sin Nombre'}</span>
                                    </div>
                                </td>
                                <td className="p-4 align-middle text-muted-foreground">{user.email}</td>
                                <td className="p-4 align-middle text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString('es-AR')}
                                </td>
                                <td className="p-4 align-middle">
                                    <select
                                        className="h-9 w-40 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        value={user.role}
                                        disabled={updatingId === user.id}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                                    >
                                        <option value="operative">Operativo</option>
                                        <option value="supervisor">Supervisor</option>
                                        <option value="manager">Mánager</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                    {updatingId === user.id && (
                                        <span className="ml-2 inline-block h-3 w-3 animate-spin rounded-full border-b-2 border-primary" />
                                    )}
                                </td>
                            </tr>
                        ))}

                        {users.length === 0 && (
                            <tr>
                                <td colSpan={4} className="h-24 text-center text-muted-foreground">
                                    No hay usuarios registrados en el sistema.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
