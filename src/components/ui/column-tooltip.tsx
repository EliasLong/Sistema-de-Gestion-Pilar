'use client'

import { ReactNode } from 'react'
import { HelpCircle } from 'lucide-react'

interface ColumnTooltipProps {
    children: ReactNode
    tooltip: string
}

export function ColumnTooltip({
    children,
    tooltip,
}: ColumnTooltipProps) {
    return (
        <div className="flex items-center gap-1.5 group cursor-help">
            <span>{children}</span>
            <div className="relative inline-block">
                <HelpCircle className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 hidden group-hover:block bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50">
                    {tooltip}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900"></div>
                </div>
            </div>
        </div>
    )
}