'use client'

import { ReactNode, useState } from 'react'
import { HelpCircle } from 'lucide-react'

interface ColumnTooltipProps {
    children: ReactNode
    tooltip: string
}

export function ColumnTooltip({
    children,
    tooltip,
}: ColumnTooltipProps) {
    const [isHovered, setIsHovered] = useState(false)

    return (
        <div
            className="flex items-center gap-1.5 cursor-help relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <span>{children}</span>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 transition-colors" />

            {isHovered && (
                <div
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-50 pointer-events-none"
                    style={{
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                    }}
                >
                    {tooltip}
                    <div
                        className="absolute top-full left-1/2 -translate-x-1/2"
                        style={{
                            width: 0,
                            height: 0,
                            borderLeft: '4px solid transparent',
                            borderRight: '4px solid transparent',
                            borderTop: '4px solid rgb(15, 23, 42)'
                        }}
                    />
                </div>
            )}
        </div>
    )
}