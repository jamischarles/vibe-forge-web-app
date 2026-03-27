'use client'

import { Maximize2, X } from 'lucide-react'
import type { BreadboardData, Place, Affordance, Connection } from '@/lib/vf-types'

const AFFORDANCE_ICONS: Record<string, string> = {
  button: '[ ]',
  field: '[___]',
  link: '\u2192',
  display: '\u25FB',
  toggle: '\u2298',
}

interface ScreenPreviewPanelProps {
  data: BreadboardData
  placeId: string
  onZoomIn: (placeId: string) => void
  onClose: () => void
}

export default function ScreenPreviewPanel({
  data,
  placeId,
  onZoomIn,
  onClose,
}: ScreenPreviewPanelProps) {
  const place = data.places.find((p) => p.id === placeId)
  if (!place) return null

  const affordances = data.affordances.filter((a) => a.placeId === placeId)

  const outgoing = data.connections
    .filter((c) => c.fromPlaceId === placeId)
    .map((c) => ({
      conn: c,
      target: data.places.find((p) => p.id === c.toPlaceId),
    }))
    .filter((x) => x.target)

  const incoming = data.connections
    .filter((c) => c.toPlaceId === placeId)
    .map((c) => ({
      conn: c,
      source: data.places.find((p) => p.id === c.fromPlaceId),
    }))
    .filter((x) => x.source)

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
          Screen Preview
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onZoomIn(placeId)}
            className="p-1 rounded text-gray-500 hover:text-blue-400 hover:bg-gray-800 transition-colors"
            title="Zoom into screen detail"
          >
            <Maximize2 size={12} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Screen name */}
      <div className="rounded-lg border border-gray-700 bg-gray-800/50 p-3">
        <h4 className="text-sm font-medium text-gray-200 mb-2">{place.label}</h4>

        {/* Affordances */}
        {affordances.length > 0 && (
          <div className="space-y-1 mb-3">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Affordances</p>
            {affordances.map((aff) => (
              <div key={aff.id} className="flex items-center gap-2 text-xs">
                <span className="text-gray-600 font-mono text-[10px] w-8 text-right">
                  {AFFORDANCE_ICONS[aff.type] ?? '\u2022'}
                </span>
                <span className="text-gray-400">{aff.label}</span>
                <span className="text-[10px] text-gray-600">{aff.type}</span>
              </div>
            ))}
          </div>
        )}

        {/* Outgoing connections */}
        {outgoing.length > 0 && (
          <div className="space-y-1 mb-2">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Goes to</p>
            {outgoing.map(({ conn, target }) => (
              <div key={conn.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-blue-400">\u2192</span>
                <span className="text-gray-300">{target!.label}</span>
                {conn.label && (
                  <span className="text-[10px] text-gray-600">({conn.label})</span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Incoming connections */}
        {incoming.length > 0 && (
          <div className="space-y-1">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Comes from</p>
            {incoming.map(({ conn, source }) => (
              <div key={conn.id} className="flex items-center gap-1.5 text-xs">
                <span className="text-gray-500">\u2190</span>
                <span className="text-gray-400">{source!.label}</span>
                {conn.label && (
                  <span className="text-[10px] text-gray-600">({conn.label})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
