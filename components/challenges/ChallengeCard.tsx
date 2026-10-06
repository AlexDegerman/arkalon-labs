'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { enterChallenge, exitChallenge } from '@/app/stores/actions'
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
        'card rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 border transition-all',
        isActive
          ? 'border-(--border-accent) bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.08)]'
          : atMaxTiers
            ? 'border-(--status-success)/40 bg-(--status-success)/5'
            : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
              {def.name}
            </span>
            {isActive && (
              <span className="text-[9px] font-mono font-black text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/10 animate-pulse">
                ENGAGED
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            {Array.from({ length: def.maxTiers }, (_, i) => (
              <div
                key={i}
                className={[
                  'w-2 h-2 rounded-full',
                  i < completedTiers
                    ? 'bg-(--status-success)'
                    : 'bg-(--border-default)'
                ].join(' ')}
                aria-hidden="true"
              />
            ))}
            <span className="text-[10px] font-mono text-(--text-secondary)">
              Tier {completedTiers}/{def.maxTiers}
            </span>
          </div>
        </div>

        {bestRP > 0n && (
          <div className="flex flex-col items-end shrink-0 font-mono text-[10px]">
            <span className="text-(--text-secondary)">Best Result:</span>
            <span className="font-bold text-(--text-primary)">
              {formatPoints(bestRP)}
            </span>
          </div>
        )}
      </div>

      {/* Constraints & Rewards */}
      <div className="flex flex-col gap-1 text-[11px] font-mono">
        <p className="text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg leading-snug">
          ⚠️ {def.restrictionSummary}
        </p>
        <p className="text-(--text-accent) bg-(--border-accent)/10 border border-(--border-accent)/30 p-2 rounded-lg leading-snug font-bold">
          ✦ Reward: {def.rewardDescription}
        </p>
      </div>

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
        <div className="flex gap-2 pt-1">
          {!isActive ? (
            <button
              onClick={() => enterChallenge(challengeId)}
              disabled={!canEnter}
              className={[
                'flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer',
                canEnter
                  ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              Enter Tier {completedTiers + 1} Run
            </button>
          ) : (
            <button
              onClick={() => exitChallenge(false)}
              className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              Abandon Challenge Run
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(ChallengeCard)
