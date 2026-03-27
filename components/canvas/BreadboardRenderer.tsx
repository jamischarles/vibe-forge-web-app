'use client'

import { BreadboardData, Place, Affordance, Connection } from '@/lib/vf-types'
import PannableCanvas from './PannableCanvas'

interface BreadboardRendererProps {
  data: BreadboardData | null
  className?: string
}

// ── Affordance icon by type ──────────────────────────────────────────────────

const AFFORDANCE_ICONS: Record<string, string> = {
  button: '[ ]',
  field: '[___]',
  link: '→',
  display: '◻',
  toggle: '⊘',
}

// ── Connection path computation ──────────────────────────────────────────────

function computePath(from: Place, to: Place): string {
  const fx = from.x + from.width / 2
  const fy = from.y + from.height
  const tx = to.x + to.width / 2
  const ty = to.y

  // Quadratic bezier with control point midway
  const cx = (fx + tx) / 2
  const cy = (fy + ty) / 2

  return `M ${fx} ${fy} Q ${cx} ${cy} ${tx} ${ty}`
}

// ── Main Renderer ────────────────────────────────────────────────────────────

export default function BreadboardRenderer({ data, className }: BreadboardRendererProps) {
  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className ?? ''}`}>
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-50">⬡</div>
          <p className="text-sm">No breadboard to display</p>
          <p className="text-xs text-gray-600 mt-1">Describe your idea to generate flow variants</p>
        </div>
      </div>
    )
  }

  const placeMap = new Map(data.places.map((p) => [p.id, p]))

  return (
    <PannableCanvas className={className}>
      <svg
        viewBox="0 0 800 600"
        className="w-full h-full"
        style={{ maxHeight: '100%' }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#6b7280" />
          </marker>
        </defs>

        {/* Connections (edges) */}
        <g>
          {data.connections.map((conn) => {
            const from = placeMap.get(conn.fromPlaceId)
            const to = placeMap.get(conn.toPlaceId)
            if (!from || !to) return null

            const path = computePath(from, to)

            return (
              <g key={conn.id}>
                <path
                  d={path}
                  stroke="#6b7280"
                  strokeWidth="2"
                  fill="none"
                  markerEnd="url(#arrowhead)"
                  strokeDasharray="6 3"
                />
                {conn.label && (
                  <text
                    x={(from.x + from.width / 2 + to.x + to.width / 2) / 2}
                    y={(from.y + from.height + to.y) / 2 - 6}
                    textAnchor="middle"
                    className="text-[10px] fill-gray-500"
                  >
                    {conn.label}
                  </text>
                )}
              </g>
            )
          })}
        </g>

        {/* Places (nodes) */}
        <g>
          {data.places.map((place) => {
            const affordances = data.affordances.filter((a) => a.placeId === place.id)

            return (
              <g key={place.id}>
                {/* Place background */}
                <rect
                  x={place.x}
                  y={place.y}
                  width={place.width}
                  height={place.height}
                  rx="8"
                  ry="8"
                  fill="#1f2937"
                  stroke="#4b5563"
                  strokeWidth="2"
                />

                {/* Place label */}
                <text
                  x={place.x + place.width / 2}
                  y={place.y + 20}
                  textAnchor="middle"
                  className="text-xs font-semibold fill-white"
                >
                  {place.label}
                </text>

                {/* Divider line under label */}
                <line
                  x1={place.x + 8}
                  y1={place.y + 28}
                  x2={place.x + place.width - 8}
                  y2={place.y + 28}
                  stroke="#374151"
                  strokeWidth="1"
                />

                {/* Affordances inside place */}
                {affordances.map((aff, i) => (
                  <text
                    key={aff.id}
                    x={place.x + 12}
                    y={place.y + 44 + i * 16}
                    className="text-[10px] fill-gray-400"
                  >
                    <tspan className="fill-gray-600">{AFFORDANCE_ICONS[aff.type] ?? '•'}</tspan>
                    {' '}{aff.label}
                  </text>
                ))}
              </g>
            )
          })}
        </g>
      </svg>
    </PannableCanvas>
  )
}
