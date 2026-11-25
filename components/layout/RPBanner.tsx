'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useAnimatedBigInt } from '@/hooks/useAnimatedBigInt'
import {
  formatCountdown,
  formatPoints,
  formatPointsShort,
  formatRate,
  getAmountColor
} from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'
import {
  useProgressionTier,
} from '@/hooks/useProgressionTier'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'
import { calculateARGain } from '@/lib/prestigeCalc'
import {
  getARCap,
  getCountedAR,
  getProductionBreakdown
} from '@/lib/productionEngine'
import { useState, useEffect } from 'react'
import { useUIStore } from '@/app/stores/uiStore'
import { exitChallenge } from '@/app/stores/actions/challengeActions'
import { startCalibrationStudy } from '@/app/stores/actions/researchActions'
import { CHALLENGE_MAP } from '@/constants/challenges'
import {
  getEffectiveTarget,
  isChallengeAccelerantActive
} from '@/lib/challengeDefs'
import {
  getAnomalyTheme,
  getCompactAnomalyReward
} from '@/components/ui/AnomalyOverlay'
import { getAnomalyBuffScale } from '@/lib/anomalyDefs'
function ChallengeTargetHUD({
  challengeId,
  completedTiers,
  hasAccelerant
}: {
  challengeId: string
  completedTiers: number
  hasAccelerant: boolean
}) {
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const currentRunSeconds = useGameStore((s) => s.stats.currentRunSeconds ?? 0)
  const autoCollapseSecs = useGameStore(
    (s) => s.activeChallengeRestrictions?.autoPrestigeIntervalSeconds
  )
  const sandboxTargetRP = useGameStore((s) => s.sandboxTargetRP ?? 0n)

  const target =
    challengeId === 'SANDBOX'
      ? sandboxTargetRP
      : getEffectiveTarget(challengeId, completedTiers + 1, hasAccelerant)
  const pct =
    target > 0n
      ? Math.min(100, Math.round(Number((lifetimePoints * 100n) / target)))
      : 0

  let collapseStr = ''
  if (autoCollapseSecs) {
    const remaining = Math.max(0, autoCollapseSecs - currentRunSeconds)
    collapseStr = ` [Resets & Collapses in: ${formatCountdown(remaining)}]`
  }

  return (
    <span className="text-[11px] text-(--text-secondary) truncate">
      Goal: <span className="sm:hidden">{formatPointsShort(target)}</span>
      <span className="hidden sm:inline">{formatPoints(target)}</span> RP ({pct}
      %)
      {collapseStr && (
        <strong className="text-red-400 ml-1.5">{collapseStr}</strong>
      )}
    </span>
  )
}

function useIsCompactViewport(): boolean {
  const [compact, setCompact] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 639px)')
    const sync = () => setCompact(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return compact
}

function AnimatedRPValue({
  value,
  compact
}: {
  value: bigint
  compact: boolean
}) {
  const displayRef = useAnimatedBigInt(value, { compact })
  return (
    <span
      ref={displayRef}
      aria-live="off"
      aria-label="Research Points"
      className="select-all"
    />
  )
}

export default function RPBanner() {
  const isCompact = useIsCompactViewport()
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [confirmAbandon, setConfirmAbandon] = useState(false)

  useEffect(() => {
    if (!showBreakdown) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowBreakdown(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showBreakdown])

  const initialized = useGameStore((s) => s._initialized)
  const researchPoints = useGameStore((s) => s.researchPoints)
  const peakLifetimePoints = useGameStore(
    (s) => s.stats.peakLifetimePoints ?? 0n
  )
  const pps = useGameStore((s) => s.cachedPointsPerSecond)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)
  const activeAnomalyType = useGameStore((s) => s.activeAnomalyType)
  const anomalyBuffScale = useGameStore(getAnomalyBuffScale)
  const anomalyTheme = activeAnomalyType
    ? getAnomalyTheme(activeAnomalyType)
    : null
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const hasAccelerant = useGameStore((s) =>
    activeChallengeId
      ? isChallengeAccelerantActive(activeChallengeId, s)
      : false
  )
  const productionOnlyWhileResearching = useGameStore(
    (s) =>
      s.activeChallengeRestrictions?.productionOnlyWhileResearching ?? false
  )
  const noBaseGeneratorOutput = useGameStore(
    (s) => s.activeChallengeRestrictions?.noBaseGeneratorOutput ?? false
  )

  const techMatrixDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.techMatrixDisabled ?? false
  )
  const hasActiveResearchSlot = useGameStore((s) =>
    s.activeResearchSlots.some((sl) => sl.nodeId !== null)
  )

  const autoPrestigePendingTier = useUIStore((s) => s.autoPrestigePendingTier)
  const autoPrestigeCountdown = useUIStore((s) => s.autoPrestigeCountdown)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)

  const zeroPpsReason =
    initialized && pps === 0n && activeChallengeId
      ? productionOnlyWhileResearching
        ? 'Output paused, start a research project'
        : noBaseGeneratorOutput
          ? 'Output offline, equip at least 1 relic'
          : null
      : null

  function cancelAutoPrestige() {
    const tier = useUIStore.getState().autoPrestigePendingTier
    useGameStore.setState((s) => ({
      automation: {
        ...s.automation,
        ...(tier === 1 ? { autoPrestigeTierI: false } : {}),
        ...(tier === 2 ? { autoPrestigeTierII: false } : {}),
        ...(tier === 3 ? { autoPrestigeTierIII: false } : {})
      }
    }))
    useUIStore.getState().setAutoPrestigePending(0, 0)
  }

  const trophyPoints =
    peakLifetimePoints > researchPoints ? peakLifetimePoints : researchPoints

  // Apply data-tier attribute to <html> based on lifetime points
  useProgressionTier(trophyPoints)
  const era = getCurrentEra(trophyPoints)
  const eraColorClass = getAmountColor(trophyPoints)

  // Projected AR & AR cap details
  const projectedAR = useGameStore(calculateARGain)
  const arCounted = useGameStore(getCountedAR)
  const arCap = useGameStore(getARCap)

  const [breakdown, setBreakdown] = useState<ReturnType<
    typeof getProductionBreakdown
  > | null>(null)

  useEffect(() => {
    if (!showBreakdown) {
      setBreakdown(null)
      return
    }

    const update = () => {
      setBreakdown(getProductionBreakdown(useGameStore.getState()))
    }

    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [showBreakdown])

  return (
    <div className="px-3 sm:px-4 py-1.5 sm:py-2.5 border-b border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 relative">
      {/* Main RP display */}
      <TutorialHighlight targetId="rp-banner">
        <div className="flex items-center justify-between sm:justify-start gap-x-3 gap-y-1.5 flex-wrap relative">
          <div
            onClick={() => initialized && setShowBreakdown((prev) => !prev)}
            onKeyDown={(e) => {
              if (initialized && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault()
                setShowBreakdown((prev) => !prev)
              }
            }}
            role="button"
            tabIndex={0}
            title="Click or tap to view production breakdown"
            className="flex items-baseline gap-1.5 min-w-0 cursor-pointer group select-none"
          >
            <span className="text-2xl min-[360px]:text-3xl sm:text-4xl xl:text-5xl font-black font-mono leading-none tracking-tight whitespace-nowrap group-hover:brightness-125 transition-all">
              {initialized ? (
                <AnimatedRPValue value={researchPoints} compact={isCompact} />
              ) : (
                <span className="text-(--text-secondary)">...</span>
              )}
              <span className="text-xs sm:text-sm font-bold text-(--text-secondary) ml-1.5 font-mono">
                RP
              </span>
            </span>
            {initialized && (
              <span className="hidden sm:inline text-[10px] font-mono text-(--text-secondary)/60 opacity-0 group-hover:opacity-100 transition-opacity">
                [Diagnostic]
              </span>
            )}
          </div>

          <div
            className={[
              'flex items-center gap-1.5 px-2 py-0.5 rounded border shrink-0 transition-all duration-300',
              anomalyTheme
                ? `${anomalyTheme.borderColor} ${anomalyTheme.accentBg}`
                : 'border-(--border-accent)/30 bg-(--border-accent)/10'
            ].join(' ')}
            style={
              anomalyTheme ? { boxShadow: anomalyTheme.glowColor } : undefined
            }
          >
            <span
              className={[
                'w-1.5 h-1.5 rounded-full',
                anomalyTheme ? anomalyTheme.pingColor : 'bg-(--border-accent)'
              ].join(' ')}
            />
            <span
              className={[
                'text-xs sm:text-sm font-mono font-bold',
                !initialized
                  ? 'text-(--text-secondary)'
                  : anomalyTheme
                    ? anomalyTheme.textClass
                    : 'text-(--text-accent)'
              ].join(' ')}
            >
              {initialized
                ? `+${isCompact ? `${formatPointsShort(pps)}/s` : formatRate(pps)}`
                : '+--/sec'}
            </span>
            {initialized && activeAnomalyType && anomalyTheme && (
              <span
                className={`text-[9px] font-mono font-black ${anomalyTheme.textClass}`}
              >
                {getCompactAnomalyReward(activeAnomalyType, anomalyBuffScale)}
              </span>
            )}
          </div>
        </div>
      </TutorialHighlight>

      {/* Era badge and secondary telemetry */}
      <div className="flex items-center gap-x-2 gap-y-1 mt-1 sm:mt-1.5 flex-wrap text-xs [@media(max-height:600px)]:hidden">
        {!initialized ? (
          <span className="inline-flex items-center gap-1.5 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider text-(--text-secondary)">
            Synchronizing Telemetry...
          </span>
        ) : (
          <>
            <span
              className={[
                'inline-flex items-center gap-1 bg-(--bg-elevated) border px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all duration-300',
                eraColorClass
                  ? 'border-(--border-accent) shadow-[0_0_12px_rgba(0,240,255,0.25)]'
                  : 'border-(--border-accent)/40 text-(--text-accent)'
              ].join(' ')}
            >
              <span className="text-[10px] opacity-75 text-(--text-secondary)">
                ERA {era.era}:
              </span>
              <span className={eraColorClass || 'text-(--text-accent)'}>
                {era.name}
              </span>
            </span>

            {(arkalonResonance > 0 || arCounted > 0) && (
              <span
                title={`Passive AR Counted: ${arCounted.toLocaleString()} / ${arCap.toLocaleString()} Cap`}
                className="inline-flex items-center gap-1 bg-(--bg-elevated) border border-purple-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_8px_rgba(168,85,247,0.25)]"
              >
                <span className="g-dd">
                  {formatPoints(BigInt(Math.floor(arkalonResonance)))}
                </span>
                <span className="text-purple-300 opacity-75">AR</span>
                <span className="text-[9px] text-purple-300/70">
                  ({formatPoints(BigInt(arCounted))}/
                  {formatPoints(BigInt(arCap))})
                </span>
              </span>
            )}

            {chronalFractures > 0 && (
              <span className="inline-flex items-center gap-1 bg-(--bg-elevated) border border-cyan-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_8px_rgba(34,211,238,0.25)]">
                <span className="g-sp">
                  {formatPoints(BigInt(Math.floor(chronalFractures)))}
                </span>
                <span className="text-cyan-300 opacity-75">CF</span>
              </span>
            )}

            {omniSpars > 0 && (
              <span className="inline-flex items-center gap-1 bg-(--bg-elevated) border border-amber-500/40 px-2 py-0.5 rounded text-[10px] sm:text-xs font-mono font-bold shadow-[0_0_8px_rgba(245,158,11,0.25)]">
                <span className="g-tqgs">
                  {formatPoints(BigInt(Math.floor(omniSpars)))}
                </span>
                <span className="text-amber-300 opacity-75">OS</span>
              </span>
            )}

            {/* Projected prestige gain */}
            {projectedAR > 0 && (
              <span className="text-[11px] font-mono text-(--text-secondary) ml-auto sm:ml-0 whitespace-nowrap">
                <span className="hidden sm:inline">
                  {prestige1Done ? 'Recalibrate:' : 'Prestige:'}{' '}
                </span>
                <strong className="text-(--status-success) font-bold">
                  {isCompact ? '+' : '~'}
                  {isCompact
                    ? formatPointsShort(BigInt(projectedAR))
                    : formatPoints(BigInt(projectedAR))}{' '}
                  AR
                </strong>
              </span>
            )}
          </>
        )}
      </div>

      {/* Auto-Prestige Countdown & Cancel Banner */}
      {initialized && autoPrestigePendingTier > 0 && (
        <div className="mt-2 p-1.5 rounded-lg bg-purple-500/15 border border-purple-400/60 flex items-center justify-between gap-2 font-mono text-xs">
          <span className="font-bold text-purple-200 truncate">
            ⟳ Auto-Prestige Tier {autoPrestigePendingTier} in{' '}
            {autoPrestigeCountdown}s...
          </span>
          <button
            onClick={cancelAutoPrestige}
            className="px-2 py-0.5 rounded bg-purple-500 text-black font-black text-[10px] uppercase cursor-pointer hover:brightness-110 shrink-0"
          >
            Cancel & Pause
          </button>
        </div>
      )}

      {/* Persistent Active Challenge Strip */}
      {initialized && activeChallengeId && (
        <div className="mt-2 p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 flex flex-col gap-1 font-mono text-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 truncate">
                {CHALLENGE_MAP[activeChallengeId]?.name ??
                  (activeChallengeId === 'SANDBOX'
                    ? 'Mutator Sandbox'
                    : activeChallengeId)}
                :
              </span>
              <ChallengeTargetHUD
                challengeId={activeChallengeId}
                completedTiers={
                  challengeRecords[activeChallengeId]?.completedTiers ?? 0
                }
                hasAccelerant={hasAccelerant}
              />
            </div>
            {confirmAbandon ? (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => {
                    setConfirmAbandon(false)
                    exitChallenge(false)
                  }}
                  className="px-2 py-0.5 rounded bg-red-500 text-black font-black text-[10px] cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setConfirmAbandon(false)}
                  className="px-1.5 py-0.5 rounded bg-(--bg-surface) text-(--text-secondary) text-[10px] cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmAbandon(true)}
                className="text-[10px] font-bold text-red-400 hover:text-red-300 underline cursor-pointer shrink-0"
              >
                Abandon
              </button>
            )}
          </div>
          {zeroPpsReason && (
            <div className="flex items-center justify-between gap-2 flex-wrap pl-4">
              <span className="text-[10px] font-bold text-rose-300">
                ⚠ {zeroPpsReason}
              </span>
              {productionOnlyWhileResearching &&
                !techMatrixDisabled &&
                !hasActiveResearchSlot && (
                  <button
                    onClick={() => startCalibrationStudy()}
                    className="px-2 py-0.5 rounded border border-amber-400 bg-amber-400/20 text-amber-300 hover:bg-amber-400 hover:text-black font-black text-[10px] uppercase cursor-pointer transition-colors"
                  >
                    Run Calibration (0 RP · 30s)
                  </button>
                )}
            </div>
          )}
        </div>
      )}

      {showBreakdown && breakdown && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-xs animate-[fade-in_0.15s_ease-out_both]"
          onClick={() => setShowBreakdown(false)}
        >
          <div
            className="card max-w-md w-full bg-(--bg-elevated) border border-(--border-accent)/60 rounded-2xl p-4 flex flex-col gap-3 shadow-2xl backdrop-blur-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-(--border-default) pb-2 font-mono">
              <span className="text-xs font-black uppercase text-(--text-accent) tracking-wider">
                Telemetry Diagnostics // RP Synthesis
              </span>
              <button
                onClick={() => setShowBreakdown(false)}
                className="text-xs text-(--text-secondary) hover:text-white px-2 py-0.5 cursor-pointer font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex items-baseline justify-between font-mono bg-(--bg-surface) p-2.5 rounded-xl border border-(--border-default)">
              <span className="text-[11px] text-(--text-secondary) uppercase">
                Current Net Output
              </span>
              <span className="text-base font-black text-(--text-accent)">
                {formatRate(breakdown.finalPPS)}
              </span>
            </div>

            {breakdown.isSoftcapped && (
              <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/40 text-[10px] font-mono text-amber-300 leading-snug">
                ⚠ Endless Softcap Active (&gt;10^308 RP/s): post-308 log output
                scales at (log10 - 308)^0.88 toward the 10^1000 ceiling.
              </div>
            )}

            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-(--text-secondary) tracking-wider">
                Multipliers & Boosters
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between">
                  <span className="text-(--text-secondary)">Achievements:</span>
                  <span className="font-bold text-(--status-success)">
                    +{breakdown.achievementCount}%
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between gap-1">
                  <span className="text-(--text-secondary)">Arkalon Res:</span>
                  <span className="font-bold text-cyan-300 text-right">
                    {breakdown.arMultiplier.toFixed(2)}x{' '}
                    <span className="text-[10px] text-cyan-300/75">
                      ({breakdown.arCounted}/{breakdown.arCap})
                    </span>
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between">
                  <span className="text-(--text-secondary)">Relics:</span>
                  <span className="font-bold text-amber-300">
                    {breakdown.relicMultiplier > 1
                      ? `${breakdown.relicMultiplier.toFixed(2)}x`
                      : (breakdown.activeRelicCount ?? 0) > 0
                        ? `${breakdown.activeRelicCount} Active`
                        : '1.00x'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between">
                  <span className="text-(--text-secondary)">Challenges:</span>
                  <span className="font-bold text-purple-300">
                    {breakdown.challengeMultiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between">
                  <span className="text-(--text-secondary)">Priming (AR):</span>
                  <span className="font-bold text-white">
                    {breakdown.primingMultiplier.toFixed(2)}x
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-(--bg-surface) border border-(--border-default) flex justify-between">
                  <span className="text-(--text-secondary)">Exponent:</span>
                  <span className="font-bold text-(--text-accent)">
                    ^{(1 + breakdown.exponentBonus).toFixed(2)}
                  </span>
                </div>
              </div>

              {breakdown.activeAnomalyBooster && (
                <div className="p-2 rounded-lg bg-(--border-accent)/10 border border-(--border-accent)/40 flex items-center justify-between text-xs font-mono">
                  <span className="text-(--text-accent) font-bold">
                    ⚡ {breakdown.activeAnomalyBooster.name}:
                  </span>
                  <span className="font-black text-(--text-accent)">
                    {breakdown.activeAnomalyBooster.multiplier}x Active
                  </span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-(--text-secondary) tracking-wider">
                Production Exponent Sources (+
                {breakdown.exponentBonus.toFixed(2)})
              </span>
              {breakdown.exponentSources.length === 0 ? (
                <span className="text-(--text-secondary)/60 text-[11px]">
                  None active yet (Node C5, R10, Relic 8, Megaprojects &
                  Challenges raise this).
                </span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {breakdown.exponentSources.map((src) => (
                    <span
                      key={src.label}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-(--bg-surface) border border-(--border-default) text-(--text-accent)"
                    >
                      {src.label}: +{src.value.toFixed(2)}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1.5 font-mono text-xs">
              <span className="text-[10px] uppercase font-bold text-(--text-secondary) tracking-wider">
                Primary Generator Contributors
              </span>
              <div className="flex flex-col gap-1">
                {breakdown.topGenerators.length === 0 ? (
                  <span className="text-(--text-secondary)/60 text-[11px]">
                    No active generators producing RP.
                  </span>
                ) : (
                  breakdown.topGenerators.map((gen) => (
                    <div
                      key={gen.name}
                      className="flex items-center justify-between p-1.5 rounded-lg bg-(--bg-surface) border border-(--border-default) text-[11px]"
                    >
                      <span className="text-(--text-primary) truncate">
                        {gen.name}
                      </span>
                      <span className="text-(--text-secondary) font-bold shrink-0">
                        {gen.percentOfBase}% yield
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <button
              onClick={() => setShowBreakdown(false)}
              className="w-full py-2 text-xs font-mono font-bold uppercase rounded-xl border border-(--border-accent)/40 bg-(--border-accent)/10 text-(--border-accent) hover:bg-(--border-accent) hover:text-black cursor-pointer transition-all"
            >
              Dismiss Diagnostic
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
