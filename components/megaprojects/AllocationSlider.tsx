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
    <div className="flex flex-col gap-2 p-2.5 rounded-lg bg-(--bg-elevated)/70 border border-(--border-default)">
      <div className="flex items-center justify-between font-mono text-xs">
        <span className="text-(--text-secondary) font-bold uppercase tracking-wider text-[10px]">
          Allocation
        </span>
        <span className="text-(--text-accent) font-black text-sm">
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
        className="w-full accent-(--border-accent) cursor-pointer h-1.5"
        aria-label="Megaproject allocation percentage"
      />

      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1">
        <div className="flex flex-col">
          <span className="text-(--text-secondary)">To Construction Core:</span>
          <span className="font-bold text-(--text-accent)">
            {formatPoints(allocatedPPS)}/s
          </span>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-(--text-secondary)">Surplus to Balance:</span>
          <span className="font-bold text-(--text-primary)">
            {formatPoints(remainingPPS)}/s
          </span>
        </div>
      </div>
    </div>
  )
}
