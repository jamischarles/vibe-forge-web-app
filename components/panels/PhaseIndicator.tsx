'use client'

import { DesignPhase } from '@/lib/vf-types'

const PHASES: { key: DesignPhase; label: string; icon: string }[] = [
  { key: 'setup', label: 'Setup', icon: '📝' },
  { key: 'breadboard', label: 'Breadboard', icon: '⬡' },
  { key: 'fatMarker', label: 'Fat Marker', icon: '▧' },
  { key: 'hifi', label: 'Hi-Fi', icon: '✦' },
  { key: 'export', label: 'Export', icon: '📦' },
]

interface PhaseIndicatorProps {
  currentPhase: DesignPhase
}

export default function PhaseIndicator({ currentPhase }: PhaseIndicatorProps) {
  const currentIdx = PHASES.findIndex((p) => p.key === currentPhase)

  return (
    <div className="flex items-center gap-1">
      {PHASES.map((phase, idx) => {
        const isActive = phase.key === currentPhase
        const isDone = idx < currentIdx
        const isFuture = idx > currentIdx

        return (
          <div key={phase.key} className="flex items-center">
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-colors ${
                isActive
                  ? 'bg-blue-500/20 text-blue-400 font-semibold'
                  : isDone
                    ? 'text-green-500'
                    : 'text-gray-600'
              }`}
            >
              <span>{phase.icon}</span>
              <span className="hidden sm:inline">{phase.label}</span>
            </div>
            {idx < PHASES.length - 1 && (
              <span className={`mx-0.5 text-xs ${isDone ? 'text-green-600' : 'text-gray-700'}`}>
                {'›'}
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
