'use client'

import { memo, useCallback, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import { CHALLENGE_MAP } from '@/constants/challenges'
import {
  formatDuration,
  formatPoints,
  formatPointsShort,
  getAmountColor
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import ChallengeProgress from '@/components/challenges/ChallengeProgress'
import {
  enterChallenge,
  exitChallenge
} from '@/app/stores/actions/challengeActions'
import {
  getChallengeReadiness,
  getEffectiveTarget,
  isChallengeAccelerantActive
} from '@/lib/challengeDefs'
import { getModuleLevelCap } from '@/lib/moduleDefs'

interface Props {
  challengeId: string
}

function ChallengeCard({ challengeId }: Props) {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const [confirmAbandon, setConfirmAbandon] = useState(false)
  const def = CHALLENGE_MAP[challengeId]

  const record = useGameStore((s) => s.challengeRecords[challengeId])
  const bestTime = useGameStore(
    (s) => s.stats.bestChallengeTimes?.[challengeId]
  )
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const hasAccelerant = useGameStore((s) =>
    isChallengeAccelerantActive(challengeId, s)
  )

  const completedTiers = record?.completedTiers ?? 0
  const bestRP = record?.bestRP ?? 0n
  const isActive = activeChallengeId === challengeId
  const atMaxTiers = def ? completedTiers >= def.maxTiers : true
  const nextTarget = def
    ? getEffectiveTarget(challengeId, completedTiers + 1, hasAccelerant)
    : 0n

  const readiness = useGameStore(
    useShallow(
      useCallback(
        (s) => getChallengeReadiness(nextTarget, s, challengeId),
        [nextTarget, challengeId]
      )
    )
  )

  const carrySummary = useGameStore(
    useCallback(
      (s) => {
        if (challengeId === 'AC6') {
          const totalRelicLevels = s.relicSlots.reduce(
            (sum, sl) =>
              sum + (sl.relicId ? (s.relicLevels[sl.relicId] ?? 0) : 0),
            0
          )
          return `Your Carry: ${totalRelicLevels} equipped relic levels (${totalRelicLevels * 2}% base output)`
        }
        if (challengeId === 'AC5') {
          const cap = getModuleLevelCap(s)
          return `Your Carry: Module cap Lv${cap} (installed module levels doubled; Lv10 cap in run)`
        }
        if (challengeId === 'EC1') {
          const r8 = s.relicSlots.some((sl) => sl.relicId === 8)
            ? (s.relicLevels[8] ?? 0)
            : 0
          return `Your Carry: ${s.unlockedRelics.length}/20 relics · Relic 8 exp +${(0.02 * r8).toFixed(2)}`
        }
        if (challengeId === 'SC1') {
          const t13Mods = s.generators
            .slice(0, 3)
            .reduce(
              (sum, g) =>
                sum + g.efficiencyLevel + g.costReductionLevel + g.synergyLevel,
              0
            )
          return `Your Carry: ${t13Mods} Tier 1-3 module levels`
        }
        if (challengeId === 'AC4') {
          const t15Mods = s.generators
            .slice(0, 5)
            .reduce(
              (sum, g) =>
                sum + g.efficiencyLevel + g.costReductionLevel + g.synergyLevel,
              0
            )
          return `Your Carry: ${t15Mods} Tier 1-5 module levels`
        }
        return null
      },
      [challengeId]
    )
  )

  // Unlock requirements
  const tier1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const tier2Done = useGameStore((s) => s.stats.totalPrestigesTier2 > 0)
  const tier3Done = useGameStore((s) => s.stats.totalPrestigesTier3 > 0)

  if (!def) return null

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
        'card rounded-xl p-2.5 flex flex-col gap-2 border transition-all',
        isActive
          ? 'border-(--border-accent) bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.08)]'
          : atMaxTiers
            ? 'border-(--status-success)/40 bg-(--status-success)/5'
            : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-(--text-primary)">
              {def.name}
            </span>
            {isActive && (
              <span className="text-[9px] font-mono font-black text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/10">
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
            {!atMaxTiers && !isActive && (
              <span
                title={readiness.hint}
                className={`text-[8px] font-mono font-black px-1.5 py-0.2 rounded border ml-1 ${readiness.cls}`}
              >
                {readiness.label}
              </span>
            )}
          </div>
        </div>

        {(bestRP > 0n || bestTime !== undefined) && (
          <div className="flex flex-col items-end shrink-0 font-mono text-[10px]">
            {bestRP > 0n && (
              <>
                <span className="text-(--text-secondary)">Best Result:</span>
                <span
                  className={[
                    'font-bold',
                    getAmountColor(bestRP) || 'text-(--text-primary)'
                  ].join(' ')}
                >
                  {formatPoints(bestRP)} RP
                </span>
              </>
            )}
            {bestTime !== undefined && (
              <span className="text-cyan-300 font-bold mt-0.5">
                Fastest: {formatDuration(bestTime)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Constraints, Carry & Rewards */}
      <div className="flex flex-col gap-1 text-[11px] font-mono">
        <p className="text-amber-400 bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg leading-snug">
          ⚠️ {def.restrictionSummary}
        </p>
        {carrySummary && (
          <p className="text-cyan-200 bg-cyan-950/30 border border-cyan-400/30 px-2 py-1 rounded-lg leading-snug text-[10px]">
            ◈ {carrySummary}
          </p>
        )}
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
              {activeChallengeId
                ? 'Challenge in Progress'
                : `Enter Tier ${completedTiers + 1}`}
            </button>
          ) : confirmAbandon ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setConfirmAbandon(false)
                  exitChallenge(false)
                }}
                className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-red-500 bg-red-500 text-black hover:brightness-110 cursor-pointer"
              >
                Confirm Abandon (Restores Run)
              </button>
              <button
                onClick={() => setConfirmAbandon(false)}
                className="px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmAbandon(true)}
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
