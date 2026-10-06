'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { formatPoints } from '@/lib/format'

function MiniStatStrip() {
  // Narrow selector: compute total directly to avoid subscribing to full array
  const totalGenerators = useGameStore((s) =>
    s.generators.reduce((sum, g) => sum + Number(g.quantity), 0)
  )
  const artifactDust = useGameStore((s) => s.artifactDust)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)

  return (
    <div className="flex items-center gap-3 px-3 sm:px-4 py-1.5 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0 overflow-x-auto scrollbar-none">
      <StatItem label="Gen" value={formatPoints(BigInt(totalGenerators))} />
      <StatDivider />
      <StatItem label="Dust" value={formatPoints(BigInt(artifactDust))} />
      {arkalonResonance > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="AR"
            value={formatPoints(BigInt(Math.floor(arkalonResonance)))}
          />
        </>
      )}
      {chronalFractures > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="CF"
            value={formatPoints(BigInt(Math.floor(chronalFractures)))}
          />
        </>
      )}
      {omniSpars > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="OS"
            value={formatPoints(BigInt(Math.floor(omniSpars)))}
          />
        </>
      )}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-xs font-mono text-(--text-secondary)">
        {label}:
      </span>
      <span className="text-xs font-mono font-semibold text-(--text-primary)">
        {value}
      </span>
    </div>
  )
}

function StatDivider() {
  return (
    <span
      className="text-(--border-default) text-xs select-none"
      aria-hidden="true"
    >
      |
    </span>
  )
}
export default memo(MiniStatStrip)
