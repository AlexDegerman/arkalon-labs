'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { formatPoints } from '@/lib/format'
import { getEffectiveTarget } from '@/lib/challengeDefs'
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
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const hasAccelerant = useGameStore(
    (s) => s.arUpgrades.challenge_accelerant > 0
  )
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)

  const isActive = activeChallengeId === challengeId
  const nextTier = currentTiers + 1
  const target = getEffectiveTarget(challengeId, nextTier, hasAccelerant)

  if (currentTiers >= maxTiers) {
    return (
      <span className="text-[10px] font-mono font-bold text-(--status-success)">
        ALL TIERS COMPLETE
      </span>
    )
  }

  const progress =
    target > 0n && isActive
      ? Math.min(1, Number(lifetimePoints) / Number(target))
      : 0

  return (
    <div className="flex flex-col gap-1 font-mono text-[10px]">
      <div className="flex items-center justify-between">
        <span className="text-(--text-secondary)">Target Goal:</span>
        <span
          className={
            isActive
              ? 'text-(--text-accent) font-bold'
              : 'text-(--text-secondary)'
          }
        >
          {formatPoints(target)} RP{' '}
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
              {formatPoints(lifetimePoints)} / {formatPoints(target)}
            </span>
            <span className="text-(--text-accent) font-bold">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
