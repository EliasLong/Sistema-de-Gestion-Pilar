import { cn } from '@/lib/utils'
import type { TripStatus } from '@/types/tracking'
import { TRIP_STATUS_LABELS, TRIP_STATUS_COLORS } from '@/types/tracking'

interface TrackingStatusBadgeProps {
    status: TripStatus
    className?: string
}

export function TrackingStatusBadge({ status, className }: TrackingStatusBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
                TRIP_STATUS_COLORS[status],
                className
            )}
        >
            {TRIP_STATUS_LABELS[status]}
        </span>
    )
}
