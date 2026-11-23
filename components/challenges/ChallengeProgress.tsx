'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  formatPoints,
  formatPointsShort,
  formatTimeToAfford,
  getAmountColor
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import {
  getEffectiveTarget,
  isChallengeAccelerantActive
} from '@/lib/challengeDefs'
import ProgressBar from '@/components/ui/ProgressBar'

interface Props {
  challengeId: string
  currentTiers: number
  maxTiers: number
}

export default function ChallengeProgress({
  challengeId,
  currentTiers,
  maxTiers
}: Props) {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const hasAccelerant = useGameStore((s) =>
    isChallengeAccelerantActive(challengeId, s)
  )
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)

  const isActive = activeChallengeId === challengeId
  const nextTier = currentTiers + 1
  const target = getEffectiveTarget(challengeId, nextTier, hasAccelerant)
  const eta = isActive ? formatTimeToAfford(target, lifetimePoints, pps) : ''

  if (currentTiers >= maxTiers) {
    return (
      <span className="text-[10px] font-mono font-bold text-(--status-success)">
        ALL TIERS COMPLETE
      </span>
    )
  }

  const progress =
    target > 0n && isActive
      ? Math.min(1, Number((lifetimePoints * 10000n) / target) / 10000)
      : 0

  return (
    <div className="flex flex-col gap-1 font-mono text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-(--text-secondary)">Target Goal:</span>
        <span
          className={[
            'font-bold',
            getAmountColor(target) ||
              (isActive ? 'text-(--text-accent)' : 'text-(--text-secondary)')
          ].join(' ')}
        >
          {fmt(target)} RP{' '}
          {hasAccelerant && (
            <span className="text-(--status-success)">(-25%)</span>
          )}
        </span>
      </div>

      {isActive && (
        <div className="flex flex-col gap-1 mt-0.5">
          <ProgressBar progress={progress} height={4} />
          <div className="flex items-center justify-between text-(--text-secondary)">
            <span>
              {fmt(lifetimePoints)} / {fmt(target)}
            </span>
            <span className="text-(--text-accent) font-bold">
              {eta && <span className="text-amber-300 mr-2">ETA {eta}</span>}
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
