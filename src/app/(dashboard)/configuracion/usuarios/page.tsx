import { UsersTable } from '@/components/users/UsersTable'

export default function UsersConfigurationPage() {
    return (
        <div className="p-6 md:p-8 flex-1 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Perfiles y Roles</h2>
                    <p className="text-muted-foreground mt-1">
                        Controla quién tiene acceso a qué módulos del sistema. Asigna roles desde "Operativo" hasta "Administrador".
                    </p>
                </div>
            </div>

            <UsersTable />
        </div>
    )
}
