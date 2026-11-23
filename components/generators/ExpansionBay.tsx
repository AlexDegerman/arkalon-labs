'use client'

import { memo, useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { GENERATORS } from '@/constants/generators'
import {
  formatPoints,
  formatPointsShort,
  formatTimeToAfford,
  getAmountColor,
  getNetSpendablePPS
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import ProgressBar from '@/components/ui/ProgressBar'
import { nextCost } from '@/lib/generatorCosts'

interface Props {
  nextHiddenIndex: number | null
}

// Absorbs leftover viewport height on tall screens; collapses to zero
// once the generator list overflows so short devices keep full list space
function ExpansionBay({ nextHiddenIndex }: Props) {
  const isCompact = useIsCompactViewport()
  const [researchPoints, setResearchPoints] = useState(0n)
  const [pps, setPps] = useState(0n)
  const [effectiveCost, setEffectiveCost] = useState(0n)
  const [isNet, setIsNet] = useState(false)

  useEffect(() => {
    const update = () => {
      const s = useGameStore.getState()
      const netPPS = getNetSpendablePPS(
        s.cachedPointsPerSecond,
        s.activeMegaprojectId,
        s.megaprojectAllocationPercent
      )
      setResearchPoints(s.researchPoints)
      setPps(netPPS)
      setIsNet(
        Boolean(s.activeMegaprojectId && s.megaprojectAllocationPercent > 0)
      )
      setEffectiveCost(
        nextHiddenIndex !== null ? nextCost(nextHiddenIndex, s) : 0n
      )
    }
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [nextHiddenIndex])

  const maxGeneratorTier = useGameStore(
    (s) => s.activeChallengeRestrictions?.maxGeneratorTier ?? null
  )

  if (nextHiddenIndex === null) return null

  if (maxGeneratorTier !== null && nextHiddenIndex >= maxGeneratorTier) {
    return null
  }

  const def = GENERATORS[nextHiddenIndex]
  if (!def) return null
  const progress =
    effectiveCost > 0n
      ? Math.min(1, Number((researchPoints * 10000n) / effectiveCost) / 10000)
      : 1

  const eta = formatTimeToAfford(effectiveCost, researchPoints, pps)

  return (
    <div className="flex-[1_0_auto] mx-1.5 sm:mx-2.5 mb-1.5 sm:mb-2.5 rounded-xl border border-dashed border-(--border-default)/60 bg-(--bg-surface)/20 stasis-chamber-fluid flex flex-col items-center justify-center gap-1.5 p-2.5 relative overflow-hidden shadow-inner">
      <div
        className="absolute inset-0 bg-linear-to-b from-transparent via-(--border-accent)/5 to-transparent pointer-events-none"
        aria-hidden="true"
      />
      <div className="flex items-center gap-2 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-(--border-accent)" />
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-(--text-secondary)">
          Stasis Chamber // Next Arrival
        </span>
      </div>
      <div className="w-full flex flex-wrap items-center gap-x-2 gap-y-1.5">
        <div className="order-1 flex items-center gap-1.5 min-w-0 flex-1 basis-36">
          <span className="text-sm shrink-0 opacity-70" aria-hidden="true">
            🔒
          </span>
          <span className="text-[10px] font-mono font-bold text-(--text-secondary) truncate">
            {def.name}
          </span>
        </div>
        <div className="order-2 sm:order-3 flex items-center gap-1.5 shrink-0 ml-auto">
          <span
            className={[
              'text-[9px] font-mono font-bold',
              getAmountColor(effectiveCost) || 'text-(--text-secondary)/80'
            ].join(' ')}
          >
            {(isCompact ? formatPointsShort : formatPoints)(effectiveCost)} RP
          </span>
          {pps > 0n && eta && (
            <span className="text-[9px] font-mono text-(--status-warning)">
              {eta}
              {isNet && eta !== '--' ? ' net' : ''}
            </span>
          )}
        </div>
        <div className="order-3 sm:order-2 basis-full sm:basis-40 sm:shrink-0">
          <ProgressBar progress={progress} height={3} animated={false} />
        </div>
      </div>
    </div>
  )
}

export default memo(ExpansionBay)
