'use client'

import { RECIPE_CATEGORIES, BUILDING_BLOCKS } from '@/lib/recipes'

interface RecipeSetupPanelProps {
  recipeCategoryId: string | null
  selectedBlockIds: string[]
  onSelectCategory: (id: string) => void
  onToggleBlock: (id: string) => void
}

export default function RecipeSetupPanel({
  recipeCategoryId,
  selectedBlockIds,
  onSelectCategory,
  onToggleBlock,
}: RecipeSetupPanelProps) {
  return (
    <div className="space-y-3">
      {/* Section: Recipe Category */}
      <div>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Recipe Type
        </h3>
        <div className="grid grid-cols-3 gap-1.5">
          {RECIPE_CATEGORIES.map((cat) => {
            const isSelected = cat.id === recipeCategoryId
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                    : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="text-[10px] font-medium text-gray-300 leading-tight">{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Section: Building Blocks */}
      <div>
        <h3 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Building Blocks
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {BUILDING_BLOCKS.map((block) => {
            const isSelected = selectedBlockIds.includes(block.id)
            return (
              <button
                key={block.id}
                onClick={() => onToggleBlock(block.id)}
                title={block.description}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-medium border transition-all ${
                  isSelected
                    ? 'border-blue-500/60 bg-blue-500/15 text-blue-300'
                    : 'border-gray-700 bg-gray-800/40 text-gray-500 hover:text-gray-400 hover:border-gray-600'
                }`}
              >
                <span className="text-xs">{block.icon}</span>
                {block.name}
              </button>
            )
          })}
        </div>
        {selectedBlockIds.length > 0 && (
          <p className="text-[10px] text-gray-600 mt-1.5">
            {selectedBlockIds.length} block{selectedBlockIds.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>
    </div>
  )
}
