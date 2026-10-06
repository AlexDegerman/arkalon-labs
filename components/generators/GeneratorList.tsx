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
  max: 'MAX'
}

export default function GeneratorList() {
  const [bulkAmount, setBulkAmount] = useState<BulkBuyAmount>(1)

  // Determine which generators are visible
  function isGeneratorVisible(index: number): boolean {
    if (index < 5) return true

    const gen = useGameStore.getState().generators[index]
    if (gen.quantity > 0n) return true

    const highestOwned = GENERATORS.reduce((max, _, i) => {
      const q = useGameStore.getState().generators[i].quantity
      return q > 0n ? i : max
    }, 0)

    return index <= highestOwned + 2
  }

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)/40">
      {/* Bulk buy selector bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0">
        <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-(--text-secondary)">
          PURCHASE MODE
        </span>
        <div className="flex items-center gap-1 p-0.5 rounded-lg border border-(--border-default) bg-(--bg-elevated)">
          {([...BULK_BUY_OPTIONS, 'max'] as BulkBuyAmount[]).map((opt) => (
            <button
              key={String(opt)}
              onClick={() => setBulkAmount(opt)}
              className={[
                'px-2.5 py-1 text-xs font-mono font-bold rounded transition-all cursor-pointer select-none',
                bulkAmount === opt
                  ? 'bg-(--border-accent) text-[#080c14] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
              aria-pressed={bulkAmount === opt}
            >
              {BULK_LABELS[String(opt)]}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable generator list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-2 sm:p-2.5 flex flex-col gap-2">
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
