'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import RelicCard from '@/components/relics/RelicCard'

function RelicGrid() {
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)

  if (unlockedRelics.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-xs font-mono text-(--text-secondary) text-center">
          No relics discovered yet. Resolve anomalies to find them.
        </p>
      </div>
    )
  }

  // Sort: equipped first, then by ID
  const sorted = [...unlockedRelics].sort((a, b) => a - b)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {sorted.map((id) => (
        <RelicCard key={id} relicId={id} />
      ))}
    </div>
  )
}

export default memo(RelicGrid)
