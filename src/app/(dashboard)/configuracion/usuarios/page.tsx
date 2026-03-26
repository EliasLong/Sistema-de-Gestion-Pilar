'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { UsersTable } from '@/components/users/UsersTable'
import { CreateUserModal } from '@/components/users/CreateUserModal'
import { ChangeRoleModal } from '@/components/users/ChangeRoleModal'

interface User {
    id: string
    email: string
    full_name: string
    roles: string[]
    created_at: string
    last_sign_in_at: string | null
}

export default function UsersConfigurationPage() {
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [refreshKey, setRefreshKey] = useState(0)

    const handleEditRole = (user: User) => {
        setSelectedUser(user)
        setChangeRoleModalOpen(true)
    }

    const handleResetPassword = async (userId: string, email: string) => {
        const confirmed = window.confirm(
            `¿Estás seguro que querés resetear la contraseña de ${email}?`
        )
        if (!confirmed) return

        try {
            alert('Email de recuperación de contraseña enviado a ' + email)
        } catch (error) {
            alert('Error al enviar email de recuperación')
        }
    }

    const handleDelete = async (userId: string, email: string) => {
        const confirmed = window.confirm(
            `¿Estás seguro que querés eliminar el usuario ${email}? Esta acción no se puede deshacer.`
        )
        if (!confirmed) return

        try {
            const res = await fetch('/api/users', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId }),
            })

            if (!res.ok) throw new Error('Error deleting user')

            setRefreshKey((k) => k + 1)
            alert('Usuario eliminado exitosamente')
        } catch (error) {
            alert('Error al eliminar usuario')
        }
    }

    const handleSuccess = () => {
        setRefreshKey((k) => k + 1)
    }

    return (
        <div className="p-6 md:p-8 flex-1 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Perfiles y Roles</h2>
                    <p className="text-muted-foreground mt-1">
                        Controla quién tiene acceso a qué módulos del sistema. Asigna roles desde "Operativo" hasta "Administrador".
                    </p>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Crear usuario
                    </button>
                </div>
            </div>

            {/* Tabla de usuarios */}
            <UsersTable
                key={refreshKey}
                onEditRole={handleEditRole}
                onResetPassword={handleResetPassword}
                onDelete={handleDelete}
                onRefresh={() => setRefreshKey((k) => k + 1)}
            />

            {/* Modales */}
            <CreateUserModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSuccess={handleSuccess}
            />

            <ChangeRoleModal
                isOpen={changeRoleModalOpen}
                user={selectedUser}
                onClose={() => setChangeRoleModalOpen(false)}
                onSuccess={handleSuccess}
            />
        </div>
    )
}