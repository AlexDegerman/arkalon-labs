'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import GeneratorCard from '@/components/generators/GeneratorCard'
import type { BulkBuyAmount } from '@/constants/game'
import { BULK_BUY_OPTIONS } from '@/constants/game'
import { GENERATORS } from '@/constants/generators'

const BULK_LABELS: Record<string | number, string> = {
  1: 'x1',
  10: 'x10',
  100: 'x100',
  max: 'Max'
}

export default function GeneratorList() {
  const [bulkAmount, setBulkAmount] = useState<BulkBuyAmount>(1)

  // Determine which generators are visible
  // Generators above the current era threshold are shown as locked placeholders
  function isGeneratorVisible(index: number): boolean {
    // Always show tiers 1-5
    if (index < 5) return true

    // Show if player has ever owned one, or can plausibly reach it
    const gen = useGameStore.getState().generators[index]
    if (gen.quantity > 0n) return true

    // Show next two tiers beyond what's been purchased
    const highestOwned = GENERATORS.reduce((max, _, i) => {
      const q = useGameStore.getState().generators[i].quantity
      return q > 0n ? i : max
    }, 0)

    return index <= highestOwned + 2
  }

  return (
    <div className="flex flex-col h-full">
      {/* Bulk buy selector - sticky sub-header */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-(--border-default) bg-(--bg-surface) shrink-0">
        <span className="text-xs font-mono text-(--text-secondary) mr-2">
          Buy:
        </span>
        {([...BULK_BUY_OPTIONS, 'max'] as BulkBuyAmount[]).map((opt) => (
          <button
            key={String(opt)}
            onClick={() => setBulkAmount(opt)}
            className={[
              'px-2 py-0.5 text-xs font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
              bulkAmount === opt
                ? 'border-(--border-accent) text-(--text-accent) bg-(--bg-elevated)'
                : 'border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary)'
            ].join(' ')}
            aria-pressed={bulkAmount === opt}
          >
            {BULK_LABELS[String(opt)]}
          </button>
        ))}
      </div>

      {/* Scrollable generator list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-2 flex flex-col gap-2">
        {GENERATORS.map((def, index) => {
          if (!isGeneratorVisible(index)) return null
          return (
            <GeneratorCard
              key={def.index}
              generatorIndex={index}
              bulkAmount={bulkAmount}
            />
          )
        })}
      </div>
    </div>
  )
}
