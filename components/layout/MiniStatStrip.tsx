'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { formatPoints } from '@/lib/format'

function MiniStatStrip() {
  const initialized = useGameStore((s) => s._initialized)
  const totalGenerators = useGameStore((s) =>
    s.generators.reduce((sum, g) => sum + g.quantity, 0n)
  )
  const artifactDust = useGameStore((s) => s.artifactDust)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)

  return (
    <div className="flex items-center gap-2.5 px-3 sm:px-4 py-1.5 border-b border-(--border-default) bg-[#090e18]/90 shrink-0 overflow-x-auto scrollbar-none font-mono">
      <StatItem
        label="EQUIPMENT"
        value={initialized ? formatPoints(totalGenerators) : '...'}
        dotClass="bg-cyan-400"
      />
      <StatDivider />
      <StatItem
        label="DUST"
        value={initialized ? formatPoints(BigInt(artifactDust)) : '...'}
        valueClass="text-amber-400 font-bold"
        dotClass="bg-amber-400"
      />
      {initialized && arkalonResonance > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="AR"
            value={formatPoints(BigInt(Math.floor(arkalonResonance)))}
            valueClass="g-dd font-black"
            dotClass="bg-purple-400"
          />
        </>
      )}
      {initialized && chronalFractures > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="CF"
            value={formatPoints(BigInt(Math.floor(chronalFractures)))}
            valueClass="g-sp font-black"
            dotClass="bg-sky-400"
          />
        </>
      )}
      {initialized && omniSpars > 0 && (
        <>
          <StatDivider />
          <StatItem
            label="OS"
            value={formatPoints(BigInt(Math.floor(omniSpars)))}
            valueClass="g-tqgs font-black"
            dotClass="bg-amber-300"
          />
        </>
      )}
    </div>
  )
}

function StatItem({
  label,
  value,
  valueClass = 'text-(--text-primary)',
  dotClass = 'bg-(--border-accent)'
}: {
  label: string
  value: string
  valueClass?: string
  dotClass?: string
}) {
  return (
    <div className="flex items-center gap-1.5 shrink-0 text-[11px]">
      <span
        className={`w-1.5 h-1.5 rounded-full ${dotClass} shadow-[0_0_6px_currentColor]`}
      />
      <span className="text-(--text-secondary) font-bold text-[10px] tracking-wider">
        {label}:
      </span>
      <span className={`font-semibold ${valueClass}`}>{value}</span>
    </div>
  )
}

function StatDivider() {
  return (
    <span
      className="text-(--border-default)/60 text-[10px] select-none"
      aria-hidden="true"
    >
      •
    </span>
  )
}

export default memo(MiniStatStrip)
