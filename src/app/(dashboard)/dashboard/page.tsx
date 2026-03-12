import { Truck, MapPin, AlertCircle, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* KPIGrid placeholders */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* KPICard */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Estado de Docks</h3>
            <MapPin className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="px-6 pb-6">
            <div className="text-2xl font-bold">12 / 40</div>
            <p className="text-xs text-muted-foreground">Ocupados actualmente</p>
        </div>

        {/* KPICard */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Movimientos Inventario</h3>
            <Truck className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="px-6 pb-6">
            <div className="text-2xl font-bold">+245</div>
            <p className="text-xs text-muted-foreground">En la última hora</p>
        </div>

        {/* KPICard */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">OTIF</h3>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="px-6 pb-6">
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">+2.1% desde ayer</p>
        </div>

        {/* KPICard */}
        <div className="rounded-xl border bg-card text-card-foreground shadow-sm p-6 flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="tracking-tight text-sm font-medium">Reclamos Activos</h3>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="px-6 pb-6">
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">Requieren atención</p>
        </div>

      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 pt-4">
        {/* DockStatusPanel placeholder */}
        <div className="col-span-4 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                <h3 className="font-semibold leading-none tracking-tight">Estado de la Operación</h3>
                <p className="text-sm text-muted-foreground mt-2">Visión general de los viajes activos</p>
            </div>
            <div className="p-6 pt-0">
                {/* Tabla simple placeholder */}
                <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                        <thead className="[&_tr]:border-b">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Viaje</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Estado</th>
                                <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Destino</th>
                            </tr>
                        </thead>
                        <tbody className="[&_tr:last-child]:border-0">
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">#1024</td>
                                <td className="p-4 align-middle"><Badge variant="default">En Tránsito</Badge></td>
                                <td className="p-4 align-middle">Buenos Aires</td>
                            </tr>
                            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                <td className="p-4 align-middle">#1025</td>
                                <td className="p-4 align-middle"><Badge variant="secondary">Preparación</Badge></td>
                                <td className="p-4 align-middle">Córdoba</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

        {/* AlertsPanel placeholder */}
        <div className="col-span-3 rounded-xl border bg-card text-card-foreground shadow-sm">
            <div className="p-6">
                 <h3 className="font-semibold leading-none tracking-tight">Alertas Recientes</h3>
                 <p className="text-sm text-muted-foreground mt-2">Notificaciones operativas</p>
            </div>
            <div className="p-6 pt-0">
                 <div className="space-y-4">
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Dock #12 en mantenimiento</p>
                            <p className="text-sm text-muted-foreground">Hace 15 min</p>
                        </div>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  )
}
