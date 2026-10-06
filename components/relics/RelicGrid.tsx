'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import RelicCard from '@/components/relics/RelicCard'

function RelicGrid() {
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)

  if (unlockedRelics.length === 0) {
    return (
      <div className="card rounded-xl p-8 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center">
        <p className="text-xs font-mono text-(--text-secondary)/70">
          No relics discovered yet. Resolve anomalies to find them.
        </p>
      </div>
    )
  }

  const sorted = [...unlockedRelics].sort((a, b) => a - b)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
      {sorted.map((id) => (
        <RelicCard key={id} relicId={id} />
      ))}
    </div>
  )
}

export default memo(RelicGrid)
