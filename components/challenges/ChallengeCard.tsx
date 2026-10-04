'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { enterChallenge, exitChallenge } from '@/app/stores/gameActions'
import { CHALLENGE_MAP } from '@/constants/challenges'
import { formatPoints } from '@/lib/format'
import ChallengeProgress from '@/components/challenges/ChallengeProgress'

interface Props {
  challengeId: string
}

function ChallengeCard({ challengeId }: Props) {
  const def = CHALLENGE_MAP[challengeId]
  if (!def) return null

  const record = useGameStore((s) => s.challengeRecords[challengeId])
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)

  const completedTiers = record?.completedTiers ?? 0
  const bestRP = record?.bestRP ?? 0n
  const isActive = activeChallengeId === challengeId
  const atMaxTiers = completedTiers >= def.maxTiers

  // Unlock requirements
  const tier1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const tier2Done = useGameStore((s) => s.stats.totalPrestigesTier2 > 0)
  const tier3Done = useGameStore((s) => s.stats.totalPrestigesTier3 > 0)

  const canEnter =
    !activeChallengeId &&
    !atMaxTiers &&
    (def.category === 'standard'
      ? tier1Done
      : def.category === 'advanced'
        ? tier2Done
        : tier3Done)

  return (
    <div
      className={[
        'card rounded-lg p-3 flex flex-col gap-2 transition-colors',
        isActive ? 'border-(--border-accent)' : '',
        atMaxTiers ? 'border-(--status-success)' : ''
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-(--text-primary) truncate">
              {def.name}
            </span>
            {isActive && (
              <span className="chip border-(--border-accent) text-(--border-accent) text-[0.6rem] shrink-0 dot-pulse">
                ACTIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: def.maxTiers }, (_, i) => (
              <div
                key={i}
                className={[
                  'size-2 rounded-full',
                  i < completedTiers
                    ? 'bg-(--status-success)'
                    : 'bg-(--border-default)'
                ].join(' ')}
                aria-hidden="true"
              />
            ))}
            <span className="text-[0.6rem] font-mono text-(--text-secondary)">
              {completedTiers}/{def.maxTiers}
            </span>
          </div>
        </div>
        {bestRP > 0n && (
          <div className="flex flex-col items-end shrink-0 gap-0.5">
            <span className="text-[0.6rem] font-mono text-(--text-secondary)">
              Best
            </span>
            <span className="text-[0.65rem] font-mono text-(--text-primary)">
              {formatPoints(bestRP)}
            </span>
          </div>
        )}
      </div>

      {/* Restriction */}
      <p className="text-[0.65rem] text-(--status-warning) leading-snug">
        {def.restrictionSummary}
      </p>

      {/* Reward */}
      <p className="text-[0.65rem] text-(--text-accent) leading-snug">
        Reward: {def.rewardDescription}
      </p>

      {/* Progress */}
      {!atMaxTiers && (
        <ChallengeProgress
          challengeId={challengeId}
          currentTiers={completedTiers}
          maxTiers={def.maxTiers}
        />
      )}

      {/* Action buttons */}
      {!atMaxTiers && (
        <div className="flex gap-2 mt-1">
          {!isActive ? (
            <button
              onClick={() => enterChallenge(challengeId)}
              disabled={!canEnter}
              className={[
                'flex-1 py-1.5 text-xs font-mono rounded border transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                canEnter
                  ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                  : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              {!tier1Done
                ? 'Requires Prestige I'
                : def.category === 'advanced' && !tier2Done
                  ? 'Requires Prestige II'
                  : def.category === 'extreme' && !tier3Done
                    ? 'Requires Prestige III'
                    : activeChallengeId
                      ? 'Challenge in progress'
                      : `Enter Tier ${completedTiers + 1}`}
            </button>
          ) : (
            <button
              onClick={() => exitChallenge(false)}
              className="flex-1 py-1.5 text-xs font-mono rounded border border-#ef4444 text-#ef4444 hover:bg-#ef4444/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-#ef4444"
            >
              Abandon Run
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(ChallengeCard)
