'use client'

import { useGameStore } from '@/app/stores/gameStore'
import MegaprojectCard from '@/components/megaprojects/MegaprojectCard'
import { MEGAPROJECTS } from '@/lib/megaprojectDefs'
import { formatPoints } from '@/lib/format'

export default function MegaprojectsWorkspace() {
  const activeMegaprojectId = useGameStore((s) => s.activeMegaprojectId)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)
  const allocationPercent = useGameStore((s) => s.megaprojectAllocationPercent)

  const allocatedPPS =
    pps > 0n && allocationPercent > 0
      ? (pps * BigInt(allocationPercent)) / 100n
      : 0n

  const effectivePPS = activeMegaprojectId ? pps - allocatedPPS : pps

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Megaprojects
        </p>
        <p className="text-[0.65rem] text-(--text-secondary)">
          Allocate passive RP to construct permanent simulation structures.
          Prestige resets active megaproject progress.
        </p>
      </div>

      {/* Active project summary */}
      {activeMegaprojectId && (
        <div className="glass rounded px-3 py-2 flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[0.65rem] font-mono text-(--text-secondary)">
              Effective RP/s
            </span>
            <span className="text-xs font-mono text-(--text-primary)">
              {formatPoints(effectivePPS)}/s
            </span>
          </div>
          <div className="flex flex-col gap-0.5 text-right">
            <span className="text-[0.65rem] font-mono text-(--text-secondary)">
              Allocated
            </span>
            <span className="text-xs font-mono text-(--text-accent)">
              {formatPoints(allocatedPPS)}/s ({allocationPercent}%)
            </span>
          </div>
        </div>
      )}

      <div className="section-divider" />

      {/* Megaproject cards */}
      <div className="flex flex-col gap-3">
        {MEGAPROJECTS.map((def) => (
          <MegaprojectCard key={def.id} def={def} />
        ))}
      </div>
    </div>
  )
}
