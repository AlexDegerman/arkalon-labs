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
    <div className="flex flex-col gap-3 p-3 sm:p-4 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-1">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Megaprojects
        </p>
        <p className="text-[0.65rem] text-(--text-secondary)">
          Allocate passive RP to construct permanent simulation structures.
          Prestige resets active megaproject progress.
        </p>
      </div>

      {/* Active telemetry summary */}
      {activeMegaprojectId && (
        <div className="card rounded-xl p-3 flex items-center justify-between border border-(--border-accent)/40 bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface)">
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-(--text-secondary) uppercase">
              Effective Surplus RP/s
            </span>
            <span className="text-xs sm:text-sm font-mono font-bold text-(--text-primary)">
              {formatPoints(effectivePPS)}/s
            </span>
          </div>
          <div className="flex flex-col text-right">
            <span className="text-[10px] font-mono text-(--text-secondary) uppercase">
              Allocated
            </span>
            <span className="text-xs sm:text-sm font-mono font-black text-(--text-accent)">
              {formatPoints(allocatedPPS)}/s ({allocationPercent}%)
            </span>
          </div>
        </div>
      )}

      <div className="section-divider" />

      {/* Megaprojects list */}
      <div className="flex flex-col gap-3">
        {MEGAPROJECTS.map((def) => (
          <MegaprojectCard key={def.id} def={def} />
        ))}
      </div>
    </div>
  )
}
