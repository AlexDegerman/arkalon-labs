'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { setMegaprojectAllocation } from '@/app/stores/actions'
import { formatPoints } from '@/lib/format'

interface Props {
  effectivePPS: bigint
}

export default function AllocationSlider({ effectivePPS }: Props) {
  const percent = useGameStore((s) => s.megaprojectAllocationPercent)

  const allocatedPPS =
    effectivePPS > 0n ? (effectivePPS * BigInt(percent)) / 100n : 0n

  const remainingPPS = effectivePPS > 0n ? effectivePPS - allocatedPPS : 0n

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-(--text-secondary)">
          Allocation
        </span>
        <span className="text-xs font-mono text-(--text-accent) font-bold">
          {percent}%
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={percent}
        onChange={(e) => setMegaprojectAllocation(Number(e.target.value))}
        className="w-full accent-(--border-accent) cursor-pointer"
        aria-label="Megaproject allocation percentage"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      />

      <div className="flex items-center justify-between text-[0.65rem] font-mono">
        <div className="flex flex-col gap-0.5">
          <span className="text-(--text-secondary)">To project</span>
          <span className="text-(--text-accent)">
            {formatPoints(allocatedPPS)}/s
          </span>
        </div>
        <div className="flex flex-col gap-0.5 text-right">
          <span className="text-(--text-secondary)">Remaining</span>
          <span className="text-(--text-primary)">
            {formatPoints(remainingPPS)}/s
          </span>
        </div>
      </div>
    </div>
  )
}
