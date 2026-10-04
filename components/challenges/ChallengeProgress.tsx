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
      <div className="flex items-center gap-2">
        <span className="chip border-(--status-success) text-(--status-success) text-[0.6rem]">
          ALL TIERS COMPLETE
        </span>
      </div>
    )
  }

  const progress =
    target > 0n && isActive
      ? Math.min(1, Number(lifetimePoints) / Number(target))
      : 0

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-[0.65rem] font-mono">
        <span className="text-(--text-secondary)">Tier {nextTier} target</span>
        <span
          className={
            isActive ? 'text-(--text-accent)' : 'text-(--text-secondary)'
          }
        >
          {formatPoints(target)} RP
          {hasAccelerant && (
            <span className="text-(--status-success) ml-1">(-25%)</span>
          )}
        </span>
      </div>
      {isActive && (
        <>
          <ProgressBar progress={progress} height={3} />
          <div className="flex items-center justify-between text-[0.6rem] font-mono">
            <span className="text-(--text-secondary)">
              {formatPoints(lifetimePoints)} / {formatPoints(target)}
            </span>
            <span className="text-(--text-accent)">
              {Math.round(progress * 100)}%
            </span>
          </div>
        </>
      )}
    </div>
  )
}
