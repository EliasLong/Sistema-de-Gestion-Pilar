import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { Truck, Calendar, Package } from 'lucide-react'

// Placeholder implementations for UI components
const Card = ({ children, className }: any) => <div className={`card ${className || ''}`}>{children}</div>
const CardHeader = ({ children }: any) => <div className="card-header">{children}</div>
const CardTitle = ({ children, className }: any) => <h3 className={`card-title ${className || ''}`}>{children}</h3>
const CardContent = ({ children }: any) => <div className="card-content">{children}</div>
const Badge = ({ children }: any) => <span>{children}</span>
const StatusBadge = ({ status }: any) => <span>{status}</span>

import type { Trip } from '@/types/database'

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}

interface TripCardProps {
  trip: Trip
  onStatusChange?: (tripId: string, newStatus: string) => void
  className?: string
}

export function TripCard({ trip, onStatusChange, className }: TripCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    setIsLoading(true)
    try {
      await onStatusChange?.(trip.id, newStatus)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Viaje #{trip.trip_number}</span>
          <StatusBadge status={trip.status} />
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Placeholder para contenido del componente */}
        <p>Destino: {trip.destination_city}</p>
        <p>Bultos: {trip.total_packages}</p>
      </CardContent>
    </Card>
  )
}
