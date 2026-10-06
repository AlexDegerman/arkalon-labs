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
    <div className="flex flex-col gap-4 p-3 sm:p-4 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Dust balance */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Relics & Artifacts
        </p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">
            Dust:
          </span>
          <span className="text-xs font-mono font-black text-amber-400">
            {formatPoints(BigInt(artifactDust))}
          </span>
        </div>
      </div>

      {/* Active relic slots */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest px-0.5">
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
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest px-0.5">
          Collection ({unlockedRelics.length}/20)
        </p>
        <RelicGrid />
      </div>
    </div>
  )
}
