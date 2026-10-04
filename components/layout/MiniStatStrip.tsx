'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { formatPoints } from '@/lib/format'
import { GENERATORS } from '@/constants/generators'

export default function MiniStatStrip() {
  const generators = useGameStore((s) => s.generators)
  const artifactDust = useGameStore((s) => s.artifactDust)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)

  const totalGenerators = generators.reduce(
    (sum, g) => sum + Number(g.quantity),
    0
  )

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 border-b border-(--border-default) bg-(--bg-surface) shrink-0 overflow-x-auto scrollbar-dark">
      <StatItem label="Gen" value={String(totalGenerators)} />
      <StatDivider />
      <StatItem label="Dust" value={String(artifactDust)} />

      {arkalonResonance > 0 && (
        <>
          <StatDivider />
          <StatItem label="AR" value={String(arkalonResonance)} />
        </>
      )}

      {chronalFractures > 0 && (
        <>
          <StatDivider />
          <StatItem label="CF" value={String(chronalFractures)} />
        </>
      )}

      {omniSpars > 0 && (
        <>
          <StatDivider />
          <StatItem label="OS" value={String(omniSpars)} />
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
