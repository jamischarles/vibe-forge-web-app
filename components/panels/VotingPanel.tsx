'use client'

import { Check, ArrowRight } from 'lucide-react'
import { BreadboardData, FatMarkerData, HiFiData } from '@/lib/vf-types'

// ── Generic variant type ─────────────────────────────────────────────────────

type Variant = BreadboardData | FatMarkerData | HiFiData

interface VotingPanelProps {
  variants: Variant[]
  selectedId: string | null
  phaseName: string
  nextPhaseName?: string
  isGenerating: boolean
  onSelect: (variantId: string) => void
  onCommit: (variant: Variant) => void
}

export default function VotingPanel({
  variants,
  selectedId,
  phaseName,
  nextPhaseName,
  isGenerating,
  onSelect,
  onCommit,
}: VotingPanelProps) {
  const selectedVariant = variants.find((v) => v.id === selectedId) ?? null

  if (variants.length === 0 && !isGenerating) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Choose {phaseName}
        </h3>
        {selectedVariant && (
          <span className="text-[10px] text-blue-400">
            Click to preview, then confirm below
          </span>
        )}
      </div>

      {/* Variant cards */}
      <div className="space-y-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId

          return (
            <div
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              className={`relative rounded-xl p-3 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              <div className="flex items-start gap-2">
                {/* Selection indicator */}
                <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-600'
                }`}>
                  {isSelected && <Check size={10} className="text-white" />}
                </div>

                {/* Variant info */}
                <div className="min-w-0">
                  <h4 className="text-sm font-medium text-gray-200">{variant.name}</h4>
                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{variant.description}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Loading state */}
      {isGenerating && (
        <div className="text-center py-4">
          <div className="inline-flex items-center gap-2 text-sm text-gray-400">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            Generating variants...
          </div>
        </div>
      )}

      {/* Confirm selection button — visible when a variant is selected */}
      {selectedVariant && !isGenerating && (
        <button
          onClick={() => onCommit(selectedVariant)}
          className="w-full px-3 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors flex items-center justify-center gap-2"
        >
          Use "{selectedVariant.name}"
          {nextPhaseName && (
            <>
              <ArrowRight size={14} />
              <span className="text-blue-200 text-xs">{nextPhaseName}</span>
            </>
          )}
        </button>
      )}
    </div>
  )
}
