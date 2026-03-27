'use client'

import { useRef, useCallback, type MouseEvent } from 'react'
import { ArrowLeft } from 'lucide-react'
import { BreadboardData, Place, Affordance, Connection } from '@/lib/vf-types'
import PannableCanvas from './PannableCanvas'

interface BreadboardRendererProps {
  data: BreadboardData | null
  className?: string
  activeScreenId?: string | null
  focusedScreenId?: string | null
  onScreenClick?: (placeId: string) => void
  onScreenDoubleClick?: (placeId: string) => void
  onBackToFlow?: () => void
  onNavigateToScreen?: (placeId: string) => void
}

// ── Affordance icon by type ──────────────────────────────────────────────────

const AFFORDANCE_ICONS: Record<string, string> = {
  button: '[ ]',
  field: '[___]',
  link: '\u2192',
  display: '\u25FB',
  toggle: '\u2298',
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

// ── Flow Overview Mode ───────────────────────────────────────────────────────

function FlowOverview({
  data,
  focusedScreenId,
  onScreenClick,
  onScreenDoubleClick,
}: {
  data: BreadboardData
  focusedScreenId?: string | null
  onScreenClick?: (placeId: string) => void
  onScreenDoubleClick?: (placeId: string) => void
}) {
  const clickTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const placeMap = new Map(data.places.map((p) => [p.id, p]))

  const handlePlaceClick = useCallback((e: MouseEvent, placeId: string) => {
    e.stopPropagation()
    // Distinguish single vs double click
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current)
      clickTimerRef.current = null
      onScreenDoubleClick?.(placeId)
    } else {
      clickTimerRef.current = setTimeout(() => {
        clickTimerRef.current = null
        onScreenClick?.(placeId)
      }, 250)
    }
  }, [onScreenClick, onScreenDoubleClick])

  return (
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
        <filter id="focusGlow">
          <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6" />
        </filter>
      </defs>

      {/* Connections (edges) */}
      <g>
        {data.connections.map((conn) => {
          const from = placeMap.get(conn.fromPlaceId)
          const to = placeMap.get(conn.toPlaceId)
          if (!from || !to) return null

          const path = computePath(from, to)
          const isFocusedEdge = conn.fromPlaceId === focusedScreenId || conn.toPlaceId === focusedScreenId

          return (
            <g key={conn.id}>
              <path
                d={path}
                stroke={isFocusedEdge ? '#3b82f6' : '#6b7280'}
                strokeWidth={isFocusedEdge ? 2.5 : 2}
                fill="none"
                markerEnd="url(#arrowhead)"
                strokeDasharray="6 3"
                className="transition-all duration-200"
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
          const isFocused = place.id === focusedScreenId

          return (
            <g
              key={place.id}
              className="cursor-pointer"
              onClick={(e) => handlePlaceClick(e, place.id)}
            >
              {/* Place background */}
              <rect
                x={place.x}
                y={place.y}
                width={place.width}
                height={place.height}
                rx="8"
                ry="8"
                fill="#1f2937"
                stroke={isFocused ? '#3b82f6' : '#4b5563'}
                strokeWidth={isFocused ? 3 : 2}
                filter={isFocused ? 'url(#focusGlow)' : undefined}
                className="transition-all duration-200 hover:stroke-blue-400/60"
              />

              {/* Place label */}
              <text
                x={place.x + place.width / 2}
                y={place.y + 20}
                textAnchor="middle"
                className="text-xs font-semibold fill-white pointer-events-none"
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
                  className="text-[10px] fill-gray-400 pointer-events-none"
                >
                  <tspan className="fill-gray-600">{AFFORDANCE_ICONS[aff.type] ?? '\u2022'}</tspan>
                  {' '}{aff.label}
                </text>
              ))}
            </g>
          )
        })}
      </g>
    </svg>
  )
}

// ── Screen Detail Mode ───────────────────────────────────────────────────────

function ScreenDetail({
  data,
  placeId,
  onBackToFlow,
  onNavigateToScreen,
}: {
  data: BreadboardData
  placeId: string
  onBackToFlow?: () => void
  onNavigateToScreen?: (placeId: string) => void
}) {
  const place = data.places.find((p) => p.id === placeId)
  if (!place) return null

  const affordances = data.affordances.filter((a) => a.placeId === placeId)

  const outgoing = data.connections
    .filter((c) => c.fromPlaceId === placeId)
    .map((c) => ({ conn: c, target: data.places.find((p) => p.id === c.toPlaceId) }))
    .filter((x) => x.target)

  const incoming = data.connections
    .filter((c) => c.toPlaceId === placeId)
    .map((c) => ({ conn: c, source: data.places.find((p) => p.id === c.fromPlaceId) }))
    .filter((x) => x.source)

  // Layout constants for the detail view
  const cardX = 200
  const cardY = 80
  const cardW = 400
  const affLineHeight = 22
  const cardH = Math.max(160, 70 + affordances.length * affLineHeight + 20)

  return (
    <svg
      viewBox="0 0 800 600"
      className="w-full h-full"
      style={{ maxHeight: '100%' }}
    >
      <defs>
        <marker
          id="arrowhead-detail"
          markerWidth="10"
          markerHeight="7"
          refX="9"
          refY="3.5"
          orient="auto"
        >
          <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6" />
        </marker>
        <marker
          id="arrowhead-incoming"
          markerWidth="10"
          markerHeight="7"
          refX="1"
          refY="3.5"
          orient="auto"
        >
          <polygon points="10 0, 0 3.5, 10 7" fill="#6b7280" />
        </marker>
      </defs>

      {/* Back button */}
      <g
        className="cursor-pointer"
        onClick={() => onBackToFlow?.()}
      >
        <rect x="16" y="16" width="120" height="28" rx="6" fill="#1f2937" stroke="#374151" strokeWidth="1" className="hover:stroke-gray-500 transition-colors" />
        <text x="44" y="34" className="text-[11px] fill-gray-400 pointer-events-none">{'\u2190'} Flow Overview</text>
      </g>

      {/* Screen title */}
      <text x="400" y="55" textAnchor="middle" className="text-sm font-bold fill-white">
        {place.label}
      </text>

      {/* Main card */}
      <rect
        x={cardX}
        y={cardY}
        width={cardW}
        height={cardH}
        rx="12"
        ry="12"
        fill="#1f2937"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {/* Card header */}
      <text
        x={cardX + cardW / 2}
        y={cardY + 28}
        textAnchor="middle"
        className="text-xs font-semibold fill-white"
      >
        {place.label}
      </text>
      <line
        x1={cardX + 16}
        y1={cardY + 40}
        x2={cardX + cardW - 16}
        y2={cardY + 40}
        stroke="#374151"
        strokeWidth="1"
      />

      {/* Affordances */}
      {affordances.map((aff, i) => (
        <g key={aff.id}>
          <text
            x={cardX + 24}
            y={cardY + 62 + i * affLineHeight}
            className="text-[11px] fill-gray-400"
          >
            <tspan className="fill-gray-600 font-mono">{AFFORDANCE_ICONS[aff.type] ?? '\u2022'}</tspan>
            {' '}{aff.label}
          </text>
          <text
            x={cardX + cardW - 24}
            y={cardY + 62 + i * affLineHeight}
            textAnchor="end"
            className="text-[9px] fill-gray-600"
          >
            {aff.type}
          </text>
        </g>
      ))}

      {/* Incoming connections (left side) */}
      {incoming.map(({ conn, source }, i) => {
        const arrowY = cardY + 60 + i * 36
        const labelX = 40
        return (
          <g
            key={conn.id}
            className="cursor-pointer"
            onClick={() => onNavigateToScreen?.(conn.fromPlaceId)}
          >
            <rect
              x={labelX - 4}
              y={arrowY - 14}
              width={130}
              height={24}
              rx="6"
              fill="#1f2937"
              stroke="#374151"
              strokeWidth="1"
              className="hover:stroke-gray-500 transition-colors"
            />
            <text x={labelX + 4} y={arrowY + 1} className="text-[10px] fill-gray-500 pointer-events-none">
              {'\u2190'} {source!.label}
            </text>
            {conn.label && (
              <text x={labelX + 4} y={arrowY + 13} className="text-[8px] fill-gray-600 pointer-events-none">
                {conn.label}
              </text>
            )}
            {/* Arrow line */}
            <line
              x1={labelX + 130}
              y1={arrowY}
              x2={cardX - 4}
              y2={arrowY}
              stroke="#6b7280"
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
          </g>
        )
      })}

      {/* Outgoing connections (right side) */}
      {outgoing.map(({ conn, target }, i) => {
        const arrowY = cardY + 60 + i * 36
        const labelX = cardX + cardW + 40
        return (
          <g
            key={conn.id}
            className="cursor-pointer"
            onClick={() => onNavigateToScreen?.(conn.toPlaceId)}
          >
            {/* Arrow line */}
            <line
              x1={cardX + cardW + 4}
              y1={arrowY}
              x2={labelX - 8}
              y2={arrowY}
              stroke="#3b82f6"
              strokeWidth="1.5"
              strokeDasharray="4 2"
              markerEnd="url(#arrowhead-detail)"
            />
            <rect
              x={labelX - 4}
              y={arrowY - 14}
              width={130}
              height={24}
              rx="6"
              fill="#1f2937"
              stroke="#3b82f6"
              strokeWidth="1"
              className="hover:bg-blue-900 hover:stroke-blue-400 transition-colors"
            />
            <text x={labelX + 4} y={arrowY + 1} className="text-[10px] fill-blue-300 pointer-events-none">
              {target!.label} {'\u2192'}
            </text>
            {conn.label && (
              <text x={labelX + 4} y={arrowY + 13} className="text-[8px] fill-gray-600 pointer-events-none">
                {conn.label}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

// ── Main Renderer ────────────────────────────────────────────────────────────

export default function BreadboardRenderer({
  data,
  className,
  activeScreenId,
  focusedScreenId,
  onScreenClick,
  onScreenDoubleClick,
  onBackToFlow,
  onNavigateToScreen,
}: BreadboardRendererProps) {
  if (!data) {
    return (
      <div className={`flex items-center justify-center h-full text-gray-500 ${className ?? ''}`}>
        <div className="text-center">
          <div className="text-4xl mb-3 opacity-50">{'\u2B21'}</div>
          <p className="text-sm">No breadboard to display</p>
          <p className="text-xs text-gray-600 mt-1">Describe your idea to generate flow variants</p>
        </div>
      </div>
    )
  }

  // Screen Detail mode
  if (activeScreenId) {
    return (
      <PannableCanvas className={className}>
        <ScreenDetail
          data={data}
          placeId={activeScreenId}
          onBackToFlow={onBackToFlow}
          onNavigateToScreen={onNavigateToScreen}
        />
      </PannableCanvas>
    )
  }

  // Flow Overview mode (default)
  return (
    <PannableCanvas className={className}>
      <FlowOverview
        data={data}
        focusedScreenId={focusedScreenId}
        onScreenClick={onScreenClick}
        onScreenDoubleClick={onScreenDoubleClick}
      />
    </PannableCanvas>
  )
}
