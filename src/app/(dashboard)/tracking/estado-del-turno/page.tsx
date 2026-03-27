'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText } from 'lucide-react'

export default function EstadoDelTurnoPage() {
    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Estado del Turno</h1>
                    <p className="text-muted-foreground">
                        Resumen y notas de Pase de Turno
                    </p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        Pase de Turno
                    </CardTitle>
                    <CardDescription>
                        Esta sección contendrá el resumen automatizado y notas manuales del pase de turno.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border-2 border-dashed rounded-lg">
                        <FileText className="h-8 w-8 mb-4 opacity-20" />
                        <p className="max-w-md">
                            Módulo en desarrollo. Próximamente incluirá visualización dividida por turnos y notas manuales.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
