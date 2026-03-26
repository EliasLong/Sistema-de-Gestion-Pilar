'use client'

import { useEffect, useState } from 'react'
import { Edit2, Trash2, RotateCcw } from 'lucide-react'

interface User {
    id: string
    email: string
    full_name: string
    roles: string[]
    created_at: string
    last_sign_in_at: string | null
}

interface UsersTableProps {
    onEditRole: (user: User) => void
    onResetPassword: (userId: string, email: string) => void
    onDelete: (userId: string, email: string) => void
    onRefresh: () => void
}

export function UsersTable({
    onEditRole,
    onResetPassword,
    onDelete,
    onRefresh,
}: UsersTableProps) {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch('/api/users')
            if (!res.ok) throw new Error('Error fetching users')
            const data = await res.json()
            setUsers(data)
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="text-center py-12 text-muted-foreground">Cargando usuarios...</div>
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                Error: {error}
            </div>
        )
    }

    return (
        <div className="relative w-full overflow-x-auto rounded-lg border bg-white">
            <table className="w-full min-w-max caption-bottom text-sm">
                <thead className="bg-muted/50">
                    <tr className="border-b">
                        <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground">
                            Email
                        </th>
                        <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground">
                            Nombre
                        </th>
                        <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground">
                            Rol
                        </th>
                        <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground">
                            Creado
                        </th>
                        <th className="h-11 px-4 text-left align-middle font-semibold text-muted-foreground">
                            Último acceso
                        </th>
                        <th className="h-11 px-4 text-center align-middle font-semibold text-muted-foreground">
                            Acciones
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr
                            key={user.id}
                            className="border-b transition-colors hover:bg-muted/20"
                        >
                            <td className="p-4 align-middle">
                                <span className="text-sm font-medium">{user.email}</span>
                            </td>
                            <td className="p-4 align-middle">
                                <span className="text-sm">{user.full_name || '—'}</span>
                            </td>
                            <td className="p-4 align-middle">
                                <div className="flex flex-wrap gap-1">
                                    {user.roles.map((role) => (
                                        <span
                                            key={role}
                                            className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 capitalize"
                                        >
                                            {role}
                                        </span>
                                    ))}
                                </div>
                            </td>
                            <td className="p-4 align-middle">
                                <span className="text-xs text-muted-foreground">
                                    {new Date(user.created_at).toLocaleDateString('es-AR')}
                                </span>
                            </td>
                            <td className="p-4 align-middle">
                                <span className="text-xs text-muted-foreground">
                                    {user.last_sign_in_at
                                        ? new Date(user.last_sign_in_at).toLocaleDateString('es-AR')
                                        : 'Nunca'}
                                </span>
                            </td>
                            <td className="p-4 align-middle">
                                <div className="flex items-center justify-center gap-2">
                                    <button
                                        onClick={() => onEditRole(user)}
                                        className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
                                        title="Cambiar rol"
                                    >
                                        <Edit2 className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() =>
                                            onResetPassword(user.id, user.email)
                                        }
                                        className="p-1.5 rounded-md text-amber-600 hover:bg-amber-100 transition-colors"
                                        title="Resetear contraseña"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => onDelete(user.id, user.email)}
                                        className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors"
                                        title="Eliminar usuario"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}

                    {users.length === 0 && (
                        <tr>
                            <td colSpan={6} className="py-12 text-center text-muted-foreground">
                                No hay usuarios registrados
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}