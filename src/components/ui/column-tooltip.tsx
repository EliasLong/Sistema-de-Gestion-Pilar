'use client'

import { ReactNode } from 'react'
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface ColumnTooltipProps {
    children: ReactNode
    tooltip: string
    side?: 'top' | 'right' | 'bottom' | 'left'
    showIcon?: boolean
}

export function ColumnTooltip({
    children,
    tooltip,
    side = 'top',
    showIcon = true,
}: ColumnTooltipProps) {
    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 cursor-help w-full">
                        <span className="truncate">{children}</span>
                        {showIcon && (
                            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors flex-shrink-0" />
                        )}
                    </div>
                </TooltipTrigger>
                <TooltipContent side={side} className="max-w-xs bg-slate-900 text-white border-slate-700">
                    <p className="text-xs">{tooltip}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    )
}