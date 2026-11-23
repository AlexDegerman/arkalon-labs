'use client'

import { memo, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import {
  formatCountdown,
  formatCompletionTime,
  formatPoints,
  formatPointsShort
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import ProgressBar from '@/components/ui/ProgressBar'
import { getEffectiveStudyTime, getOverclockDetails } from '@/lib/researchNodes'
import { getAnomalyBuffScale } from '@/lib/anomalyDefs'
import {
  CALIBRATION_NODE_ID,
  overclockResearch
} from '@/app/stores/actions/researchActions'

interface Props {
  slotIndex: number
}

function ActiveNodeDisplay({ slotIndex }: Props) {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const slot = useGameStore((s) => s.activeResearchSlots[slotIndex])
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const rp = useGameStore((s) => s.researchPoints)
  const activeAnomalyType = useGameStore((s) => s.activeAnomalyType)
  const anomalyTimeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const researchTimersFrozen = useGameStore(
    (s) => s.activeChallengeRestrictions?.noResearchTimerTick ?? false
  )
  const techDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.techMatrixDisabled ?? false
  )
  const buffScale = useGameStore(getAnomalyBuffScale)
  const nodeId = slot?.nodeId ?? null

  const overclockCost = useGameStore(
    useCallback(
      (s) =>
        nodeId
          ? getOverclockDetails(
              nodeId,
              s,
              s.activeResearchSlots[slotIndex]?.timerRemaining
            ).cost
          : 0n,
      [nodeId, slotIndex]
    )
  )

  const secondsReduced = useGameStore(
    useCallback(
      (s) => (nodeId ? getOverclockDetails(nodeId, s).secondsReduced : 0),
      [nodeId]
    )
  )

  const originalTime = useGameStore(
    useCallback(
      (s) =>
        nodeId
          ? getEffectiveStudyTime(nodeId, {
              ...s,
              completedResearchNodes: completedNodes.filter(
                (id) => id !== nodeId
              )
            })
          : 0,
      [nodeId, completedNodes]
    )
  )

  if (!slot?.nodeId) {
    return (
      <div className="card rounded-xl px-3 py-1.5 flex items-center justify-center border-dashed border-(--border-default)/70 bg-(--bg-surface)/40">
        <p className="text-[11px] font-mono text-(--text-secondary)/60 uppercase tracking-wider">
          Slot {slotIndex + 1} // Idle
        </p>
      </div>
    )
  }

  if (slot.nodeId === CALIBRATION_NODE_ID) {
    const calProgress = Math.max(0, 1 - slot.timerRemaining / 30)
    return (
      <div className="card rounded-xl p-2.5 flex flex-col gap-1.5 bg-(--bg-surface) border border-amber-400/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-amber-300">
              Telemetry Calibration
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-300">
            {formatCountdown(slot.timerRemaining)}
          </span>
        </div>
        <ProgressBar
          progress={calProgress}
          variant="warning"
          height={5}
          showPercent
        />
        <span className="text-[11px] font-mono text-(--text-secondary)">
          Emergency zero-cost study keeping generators online during Telemetry
          Starvation.
        </span>
      </div>
    )
  }

  const node = RESEARCH_NODE_MAP[slot.nodeId]
  if (!node) return null

  const progress =
    originalTime > 0 ? Math.max(0, 1 - slot.timerRemaining / originalTime) : 1

  const canOverclock = rp >= overclockCost && slot.timerRemaining > 0
  const actualSecondsReduced = Math.min(
    secondsReduced,
    Math.ceil(slot.timerRemaining)
  )
  const anomalySpeed =
    activeAnomalyType === 'temporal_distortion' ||
    activeAnomalyType === 'fused_chronal_breach'
      ? 10 * buffScale
      : activeAnomalyType === 'operation_chrono_freeze'
        ? 5 * buffScale
        : 1
  const r4Boost =
    !techDisabled && completedNodes.includes('R4') && activeAnomalyType ? 2 : 1
  const activeSpeed = researchTimersFrozen
    ? activeAnomalyType
      ? 5 * anomalySpeed * r4Boost
      : 0
    : anomalySpeed * r4Boost

  let wallSecondsRemaining: number | null = slot.timerRemaining
  if (activeSpeed === 0) {
    wallSecondsRemaining = null
  } else if (activeAnomalyType && anomalyTimeRemaining > 0 && activeSpeed > 1) {
    const workDuringAnomaly = anomalyTimeRemaining * activeSpeed
    if (slot.timerRemaining <= workDuringAnomaly) {
      wallSecondsRemaining = slot.timerRemaining / activeSpeed
    } else if (researchTimersFrozen) {
      wallSecondsRemaining = null
    } else {
      wallSecondsRemaining =
        anomalyTimeRemaining + (slot.timerRemaining - workDuringAnomaly)
    }
  }

  const completionTime =
    wallSecondsRemaining === null
      ? 'Paused (AC3)'
      : formatCompletionTime(Date.now(), wallSecondsRemaining)

  return (
    <div className="card rounded-xl p-2.5 flex flex-col gap-1.5 bg-(--bg-surface) border border-(--border-accent)/40 shadow-[0_0_15px_rgba(0,240,255,0.06)]">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="w-2 h-2 rounded-full bg-(--border-accent) shrink-0" />
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) leading-tight">
            {node.label}
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) shrink-0 uppercase">
            {node.branch.slice(0, 1).toUpperCase()}
            {node.tier > 0 ? node.tier : 'inf'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono font-bold text-(--text-accent)">
            {formatCountdown(slot.timerRemaining)}
          </span>
          <button
            onClick={() => overclockResearch(slotIndex)}
            disabled={!canOverclock}
            title={`Accelerate study by ${actualSecondsReduced}s`}
            className={[
              'px-2 py-0.5 text-[10px] font-mono font-black uppercase rounded border transition-all cursor-pointer select-none',
              canOverclock
                ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400 hover:text-[#080c14] shadow-[0_0_8px_rgba(0,240,255,0.3)]'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
            ].join(' ')}
          >
            ⚡ Overclock (-{actualSecondsReduced}s) · {fmt(overclockCost)} RP
          </button>
        </div>
      </div>

      <ProgressBar
        progress={progress}
        variant="default"
        height={5}
        showPercent
      />

      <div className="flex items-baseline justify-between gap-2 flex-wrap text-[11px] font-mono">
        <span className="text-(--text-secondary) leading-snug">
          {node.effectDescription}
        </span>
        <span className="text-(--text-secondary)/80 shrink-0 ml-auto text-[10px]">
          ETA: {completionTime}
          {activeSpeed > 1 && ` (${activeSpeed.toFixed(0)}x)`}
        </span>
      </div>
    </div>
  )
}

export default memo(ActiveNodeDisplay)
