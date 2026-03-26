'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface User {
    id: string
    email: string
    roles: string[]
}

interface ChangeRoleModalProps {
    isOpen: boolean
    user: User | null
    onClose: () => void
    onSuccess: () => void
}

const ROLES = [
    { value: 'operativo', label: 'Operativo' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'gerencial', label: 'Gerencial' },
    { value: 'admin', label: 'Administrador' },
]

export function ChangeRoleModal({
    isOpen,
    user,
    onClose,
    onSuccess,
}: ChangeRoleModalProps) {
    const [newRole, setNewRole] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user && user.roles.length > 0) {
            setNewRole(user.roles[0])
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setError(null)
        setLoading(true)

        try {
            const res = await fetch('/api/users', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    role: newRole,
                }),
            })

            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || 'Error updating role')
            }

            onSuccess()
            onClose()
            alert('Rol actualizado exitosamente')
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen || !user) return null

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-md w-full p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Cambiar rol de usuario</h2>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded p-3 mb-4 text-sm text-red-800">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input
                            type="email"
                            value={user.email}
                            disabled
                            className="w-full px-3 py-2 border rounded-md bg-gray-50 text-gray-500"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Rol actual</label>
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
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Nuevo rol</label>
                        <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                            {ROLES.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {r.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border rounded-md hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Actualizando...' : 'Cambiar rol'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}