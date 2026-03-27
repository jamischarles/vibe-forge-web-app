'use client'

import { ChevronLeft, ChevronRight, LayoutGrid } from 'lucide-react'
import type { BreadboardData } from '@/lib/vf-types'

interface FlowNavBarProps {
  data: BreadboardData
  activeScreenId: string
  onNavigate: (placeId: string) => void
  onBackToOverview: () => void
}

export default function FlowNavBar({
  data,
  activeScreenId,
  onNavigate,
  onBackToOverview,
}: FlowNavBarProps) {
  const places = data.places
  const currentIndex = places.findIndex((p) => p.id === activeScreenId)
  const current = places[currentIndex]
  const prev = currentIndex > 0 ? places[currentIndex - 1] : null
  const next = currentIndex < places.length - 1 ? places[currentIndex + 1] : null

  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-gray-900/80 border-b border-gray-800 text-xs">
      {/* Left: back to overview */}
      <button
        onClick={onBackToOverview}
        className="flex items-center gap-1 text-gray-400 hover:text-blue-400 transition-colors"
      >
        <LayoutGrid size={12} />
        <span>Overview</span>
      </button>

      {/* Center: navigation */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => prev && onNavigate(prev.id)}
          disabled={!prev}
          className="p-0.5 rounded text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>

        {/* Dots */}
        <div className="flex items-center gap-1.5">
          {places.map((p, i) => (
            <button
              key={p.id}
              onClick={() => onNavigate(p.id)}
              title={p.label}
              className={`w-2 h-2 rounded-full transition-all ${
                p.id === activeScreenId
                  ? 'bg-blue-500 scale-125'
                  : 'bg-gray-600 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        <button
          onClick={() => next && onNavigate(next.id)}
          disabled={!next}
          className="p-0.5 rounded text-gray-400 hover:text-white disabled:text-gray-700 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Right: screen name + position */}
      <div className="text-gray-500">
        <span className="text-gray-300 font-medium">{current?.label}</span>
        {' '}
        <span>{currentIndex + 1} of {places.length}</span>
      </div>
    </div>
  )
}
