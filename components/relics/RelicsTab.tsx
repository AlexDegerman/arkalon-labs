'use client'

import { useGameStore } from '@/app/stores/gameStore'
import RelicSlot from '@/components/relics/RelicSlot'
import RelicGrid from '@/components/relics/RelicGrid'
import { getRelicSlotCount } from '@/lib/relicDefs'
import { formatPoints } from '@/lib/format'

export default function RelicsTab() {
  const store = useGameStore.getState()
  const slotCount = getRelicSlotCount(store)
  const artifactDust = useGameStore((s) => s.artifactDust)
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)

  return (
    <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Dust balance */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Relics & Artifacts
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-(--text-secondary)">
            Dust:
          </span>
          <span className="text-xs font-mono font-bold text-(--text-accent)">
            {formatPoints(BigInt(artifactDust))}
          </span>
        </div>
      </div>

      {/* Active relic slots */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-(--text-secondary)">
          Active Slots ({slotCount})
        </p>
        <div className="flex flex-col gap-2">
          {Array.from({ length: slotCount }, (_, i) => (
            <RelicSlot key={i} slotIndex={i} />
          ))}
        </div>
      </div>

      <div className="section-divider" />

      {/* Relic collection */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-(--text-secondary)">
          Collection ({unlockedRelics.length}/20)
        </p>
        <RelicGrid />
      </div>
    </div>
  )
}
