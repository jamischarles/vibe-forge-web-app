'use client'

import { FatMarkerData } from '@/lib/vf-types'
import PannableCanvas from './PannableCanvas'

interface FatMarkerRendererProps {
  data: FatMarkerData | null
  className?: string
}

const REGION_COLORS: Record<string, string> = {
  header: '#3b82f6',
  hero: '#8b5cf6',
  content: '#10b981',
  sidebar: '#f59e0b',
  footer: '#6b7280',
  cta: '#ef4444',
  nav: '#06b6d4',
  form: '#ec4899',
  list: '#14b8a6',
  media: '#a855f7',
}

export default function FatMarkerRenderer({ data, className }: FatMarkerRendererProps) {
  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className ?? ''}`}>
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-50">▧</div>
          <p className="text-sm">No layout to display</p>
        </div>
      </div>
    )
  }

  return (
    <PannableCanvas className={className}>
      <svg viewBox="0 0 800 600" className="w-full h-full" style={{ maxHeight: '100%' }}>
        {data.regions.map((region) => {
          const color = REGION_COLORS[region.type] ?? '#6b7280'

          return (
            <g key={region.id}>
              <rect
                x={region.x}
                y={region.y}
                width={region.width}
                height={region.height}
                rx="6"
                ry="6"
                fill={color}
                fillOpacity="0.15"
                stroke={color}
                strokeWidth="2"
                strokeDasharray="8 4"
              />
              <text
                x={region.x + region.width / 2}
                y={region.y + region.height / 2 - 8}
                textAnchor="middle"
                className="text-sm font-semibold"
                fill={color}
              >
                {region.label}
              </text>
              <text
                x={region.x + region.width / 2}
                y={region.y + region.height / 2 + 10}
                textAnchor="middle"
                className="text-[10px]"
                fill={color}
                fillOpacity="0.6"
              >
                {region.type}
              </text>
            </g>
          )
        })}

        {/* Palette swatches at bottom */}
        {data.palette.length > 0 && (
          <g>
            {data.palette.map((color, i) => (
              <rect
                key={i}
                x={800 - (data.palette.length - i) * 28 - 8}
                y={564}
                width={24}
                height={24}
                rx="4"
                fill={color}
                stroke="#374151"
                strokeWidth="1"
              />
            ))}
          </g>
        )}
      </svg>
    </PannableCanvas>
  )
}
