'use client'

import { ThumbsUp, ThumbsDown, Star } from 'lucide-react'
import { BreadboardData, FatMarkerData, HiFiData, VariantVote } from '@/lib/vf-types'

// ── Generic variant type ─────────────────────────────────────────────────────

type Variant = BreadboardData | FatMarkerData | HiFiData

interface VotingPanelProps {
  variants: Variant[]
  votes: Record<string, VariantVote>
  selectedId: string | null
  round: number
  maxRounds: number
  phaseName: string
  isGenerating: boolean
  onVote: (variantId: string, vote: VariantVote) => void
  onSelect: (variantId: string) => void
  onNextRound: () => void
  onCommit: (variant: Variant) => void
}

export default function VotingPanel({
  variants,
  votes,
  selectedId,
  round,
  maxRounds,
  phaseName,
  isGenerating,
  onVote,
  onSelect,
  onNextRound,
  onCommit,
}: VotingPanelProps) {
  const allVoted = variants.length > 0 && variants.every((v) => votes[v.id] !== undefined)
  const hasStarred = Object.values(votes).includes('star')
  const isLastRound = round >= maxRounds

  if (variants.length === 0 && !isGenerating) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Round header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          {phaseName} — Round {round}/{maxRounds}
        </h3>
        <span className="text-[10px] text-gray-600">
          {Object.keys(votes).length}/{variants.length} voted
        </span>
      </div>

      {/* Variant cards */}
      <div className="space-y-2">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedId
          const vote = votes[variant.id]

          return (
            <div
              key={variant.id}
              onClick={() => onSelect(variant.id)}
              className={`relative rounded-xl p-3 border cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/10'
                  : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
              }`}
            >
              {/* Variant info */}
              <div className="mb-2">
                <h4 className="text-sm font-medium text-gray-200">{variant.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{variant.description}</p>
              </div>

              {/* Vote buttons */}
              <div className="flex items-center gap-2">
                <VoteButton
                  icon={<ThumbsUp size={14} />}
                  active={vote === 'up'}
                  activeColor="text-green-400"
                  onClick={(e) => { e.stopPropagation(); onVote(variant.id, vote === 'up' ? undefined as unknown as VariantVote : 'up') }}
                />
                <VoteButton
                  icon={<ThumbsDown size={14} />}
                  active={vote === 'down'}
                  activeColor="text-red-400"
                  onClick={(e) => { e.stopPropagation(); onVote(variant.id, vote === 'down' ? undefined as unknown as VariantVote : 'down') }}
                />
                <VoteButton
                  icon={<Star size={14} />}
                  active={vote === 'star'}
                  activeColor="text-yellow-400"
                  onClick={(e) => { e.stopPropagation(); onVote(variant.id, vote === 'star' ? undefined as unknown as VariantVote : 'star') }}
                />

                {/* Vote badge */}
                {vote && (
                  <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${
                    vote === 'up' ? 'bg-green-500/20 text-green-400'
                      : vote === 'down' ? 'bg-red-500/20 text-red-400'
                        : 'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {vote === 'up' ? 'Upvoted' : vote === 'down' ? 'Downvoted' : 'Starred'}
                  </span>
                )}
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

      {/* Action buttons */}
      {allVoted && !isGenerating && (
        <div className="flex gap-2">
          {!isLastRound && (
            <button
              onClick={onNextRound}
              className="flex-1 px-3 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-sm text-gray-300 transition-colors"
            >
              Next Round
            </button>
          )}
          {(hasStarred || isLastRound) && (
            <button
              onClick={() => {
                // Commit the starred or first upvoted variant
                const starred = variants.find((v) => votes[v.id] === 'star')
                const upvoted = variants.find((v) => votes[v.id] === 'up')
                const target = starred ?? upvoted ?? variants[0]
                if (target) onCommit(target)
              }}
              className="flex-1 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-sm text-white font-medium transition-colors"
            >
              Commit {phaseName}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// ── Vote Button ──────────────────────────────────────────────────────────────

function VoteButton({
  icon,
  active,
  activeColor,
  onClick,
}: {
  icon: React.ReactNode
  active: boolean
  activeColor: string
  onClick: (e: React.MouseEvent) => void
}) {
  return (
    <button
      onClick={onClick}
      className={`p-1.5 rounded-lg transition-colors ${
        active ? `${activeColor} bg-gray-700` : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700/50'
      }`}
    >
      {icon}
    </button>
  )
}
