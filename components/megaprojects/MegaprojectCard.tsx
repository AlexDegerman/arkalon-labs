'use client'

import { memo, useCallback, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  meetsMegaprojectRequirements,
  getEffectiveConstructionCost,
  getMegaprojectPhase,
  MEGAPROJECT_PHASE_PERKS
} from '@/lib/megaprojectDefs'
import type { MegaprojectDefinition } from '@/lib/megaprojectDefs'
import { formatPoints, formatDuration, getAmountColor } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import AllocationSlider from '@/components/megaprojects/AllocationSlider'
import {
  activateMegaproject,
  deactivateMegaproject
} from '@/app/stores/actions/megaprojectActions'
import { GENERATORS } from '@/constants/generators'

interface Props {
  def: MegaprojectDefinition
}

function MegaprojectCard({ def }: Props) {
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const completedMegaprojects = useGameStore((s) => s.completedMegaprojects)
  const activeMegaprojectId = useGameStore((s) => s.activeMegaprojectId)
  const megaprojectRPAbsorbed = useGameStore((s) => s.megaprojectRPAbsorbed)
  const megaprojectAllocationPercent = useGameStore(
    (s) => s.megaprojectAllocationPercent
  )
  const pps = useGameStore((s) => s.cachedPointsPerSecond)
  const swarmLevel = useGameStore((s) => s.dysonSwarmLevel ?? 0)

  const meetsReqs = useGameStore(
    useCallback((s) => meetsMegaprojectRequirements(def.id, s), [def.id])
  )
  const cost = useGameStore(
    useCallback((s) => getEffectiveConstructionCost(def.id, s), [def.id])
  )
  const currentPhase = useGameStore(
    useCallback((s) => getMegaprojectPhase(def.id, s), [def.id])
  )
  const absorptionMult = useGameStore((s) =>
    getMegaprojectPhase('chronos_array', s) >= 3 ? 120n : 100n
  )

  const reqGen1Qty = useGameStore((s) =>
    def.requiresGeneratorIndex !== undefined
      ? (s.generators[def.requiresGeneratorIndex]?.quantity ?? 0n)
      : 0n
  )
  const reqGen2Qty = useGameStore((s) =>
    def.requiresGeneratorIndex2 !== undefined
      ? (s.generators[def.requiresGeneratorIndex2]?.quantity ?? 0n)
      : 0n
  )
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const currentAR = useGameStore((s) => s.arkalonResonance)
  const hasPrereqMega = useGameStore((s) =>
    def.requiresMegaproject
      ? s.completedMegaprojects.includes(def.requiresMegaproject)
      : true
  )

  const isCompleted =
    completedMegaprojects.includes(def.id) && def.id !== 'dyson_swarm'
  const isActive = activeMegaprojectId === def.id
  const isAnotherActive = Boolean(
    activeMegaprojectId && activeMegaprojectId !== def.id
  )
  const phasePerks = MEGAPROJECT_PHASE_PERKS[def.id] ?? []

  const progress =
    isActive && cost > 0n
      ? Math.min(1, Number((megaprojectRPAbsorbed * 10000n) / cost) / 10000)
      : 0

  // Estimate time to completion
  const allocatedPPS =
    pps > 0n && megaprojectAllocationPercent > 0
      ? (pps * BigInt(megaprojectAllocationPercent)) / 100n
      : 0n

  const remaining = isActive ? cost - megaprojectRPAbsorbed : cost
  let etaText: string | null = null
  const effectiveAllocatedPPS = (allocatedPPS * absorptionMult) / 100n
  if (effectiveAllocatedPPS > 0n && isActive && remaining > 0n) {
    const etaSecondsBn = remaining / effectiveAllocatedPPS
    if (etaSecondsBn > BigInt(86400 * 365)) {
      etaText = '> 1y'
    } else {
      etaText = `~${formatDuration(Number(etaSecondsBn))}`
    }
  }

  return (
    <div
      className={[
        '@container card rounded-xl p-2.5 sm:p-3 flex flex-col gap-2 border transition-all',
        isCompleted
          ? 'border-(--status-success)/40 bg-(--status-success)/5'
          : isActive
            ? 'border-(--border-accent) bg-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.08)]'
            : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={[
                'text-xs sm:text-sm font-bold wrap-break-word',
                def.id === 'chronos_array'
                  ? 'g-sp'
                  : def.id === 'arkalon_matrix_mirror'
                    ? 'g-dc'
                    : 'g-tqgs'
              ].join(' ')}
            >
              {def.name}
            </span>
            {def.id === 'dyson_swarm' && (
              <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300">
                SWARM LV{swarmLevel}
              </span>
            )}
          </div>
          {isCompleted && (
            <span className="text-[9px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10 w-fit">
              COMPLETE
            </span>
          )}
          {isActive && !isCompleted && (
            <span className="text-[9px] font-mono font-bold text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/10 w-fit">
              PHASE {currentPhase}/4 ACTIVE
            </span>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0 gap-0.5 font-mono">
          <span
            className={[
              'text-xs font-bold',
              getAmountColor(cost) || 'text-(--text-primary)'
            ].join(' ')}
          >
            {formatPoints(cost)} RP
          </span>
          {etaText !== null && (
            <span className="text-[10px] text-amber-400">{etaText}</span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-[11px] text-(--text-secondary) leading-snug">
        {def.description}
      </p>

      {/* Reward */}
      <p className="text-[11px] font-mono text-(--text-accent) font-bold leading-snug">
        Reward: {def.reward}
      </p>

      {/* Phased Construction Milestones */}
      <div className="flex flex-col gap-1.5 p-2 rounded-lg bg-(--bg-elevated) border border-(--border-default)/70 font-mono text-[10px]">
        <div className="flex items-center justify-between text-(--text-secondary) font-bold uppercase tracking-wider text-[9px]">
          <span>Phased Milestones:</span>
          {currentPhase > 0 && (
            <span className="text-cyan-300">
              Phase {currentPhase} Perks Synchronized
            </span>
          )}
        </div>
        <div className="grid grid-cols-2 @[420px]:grid-cols-4 gap-1">
          {phasePerks.map((p) => {
            const unlocked = currentPhase >= p.phase
            return (
              <div
                key={p.phase}
                title={`${p.title}: ${p.description}`}
                className={[
                  'p-1.5 rounded border flex flex-col gap-0.5 transition-colors',
                  unlocked
                    ? 'border-cyan-400/60 bg-cyan-950/30 text-cyan-200'
                    : 'border-(--border-default)/40 bg-(--bg-surface)/40 text-(--text-secondary)/60'
                ].join(' ')}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[9px]">
                    {p.percentThreshold}%
                  </span>
                  <span>{unlocked ? '✓' : '○'}</span>
                </div>
                <span className="font-semibold text-[9px] leading-tight wrap-break-word">
                  {p.title}
                </span>
                <span className="text-[8px] opacity-80 leading-tight">
                  {p.description}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Progress bar when active */}
      {isActive && (
        <div className="flex flex-col gap-1 font-mono text-[10px]">
          <div className="flex items-center justify-between text-(--text-secondary)">
            <span>
              {formatPoints(megaprojectRPAbsorbed)} / {formatPoints(cost)}
            </span>
            <span className="text-(--text-accent) font-bold">
              {Math.round(progress * 100)}%
            </span>
          </div>
          <ProgressBar progress={progress} height={4} />
        </div>
      )}

      {/* Requirements list when not met */}
      {!isCompleted && !meetsReqs && (
        <div className="flex flex-col gap-1 p-2.5 rounded-lg bg-(--bg-elevated) border border-amber-500/30 text-[11px] font-mono">
          <p className="text-[10px] text-amber-400 uppercase tracking-widest font-bold">
            Requirements:
          </p>
          {def.requiresGeneratorIndex !== undefined &&
            def.requiresGeneratorCount !== undefined && (
              <RequirementRow
                label={
                  GENERATORS[def.requiresGeneratorIndex]?.name ??
                  `Generator ${def.requiresGeneratorIndex + 1}`
                }
                required={def.requiresGeneratorCount}
                current={reqGen1Qty}
              />
            )}
          {def.requiresGeneratorIndex2 !== undefined &&
            def.requiresGeneratorCount2 !== undefined && (
              <RequirementRow
                label={
                  GENERATORS[def.requiresGeneratorIndex2]?.name ??
                  `Generator ${def.requiresGeneratorIndex2 + 1}`
                }
                required={def.requiresGeneratorCount2}
                current={reqGen2Qty}
              />
            )}
          {def.requiresLifetimeRP !== undefined && (
            <div className="flex items-center justify-between text-[11px] font-mono gap-2 flex-wrap">
              <span className="text-(--text-secondary)">Lifetime RP:</span>
              <span
                className={
                  lifetimePoints >= def.requiresLifetimeRP
                    ? 'text-(--status-success) font-bold'
                    : 'text-(--text-secondary)'
                }
              >
                {formatPoints(lifetimePoints)} /{' '}
                {formatPoints(def.requiresLifetimeRP)}{' '}
                {lifetimePoints >= def.requiresLifetimeRP ? '(met)' : ''}
              </span>
            </div>
          )}
          {def.requiresAR !== undefined && (
            <RequirementRow
              label="Arkalon Resonance"
              required={BigInt(def.requiresAR)}
              current={BigInt(currentAR)}
            />
          )}
          {def.requiresMegaproject && (
            <p className="text-[10px] text-(--text-secondary)">
              Requires:{' '}
              <span
                className={
                  hasPrereqMega
                    ? 'text-(--status-success) font-bold'
                    : 'text-red-400 font-bold'
                }
              >
                {def.requiresMegaproject.replace(/_/g, ' ')}
              </span>
            </p>
          )}
        </div>
      )}

      {/* Allocation slider when active */}
      {isActive && <AllocationSlider effectivePPS={pps} />}

      {/* Action buttons */}
      {!isCompleted && (
        <div className="flex gap-2 pt-1">
          {!isActive ? (
            <button
              onClick={() => activateMegaproject(def.id)}
              disabled={!meetsReqs}
              className={[
                'flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer',
                meetsReqs
                  ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              {isAnotherActive
                ? 'Another Structure Active'
                : 'Activate Construction'}
            </button>
          ) : confirmDeactivate ? (
            <div className="flex gap-2 w-full">
              <button
                onClick={() => {
                  setConfirmDeactivate(false)
                  deactivateMegaproject()
                }}
                className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-red-500 bg-red-500 text-black cursor-pointer hover:brightness-110"
              >
                Confirm Deactivate (Lose Progress)
              </button>
              <button
                onClick={() => setConfirmDeactivate(false)}
                className="px-3 py-2 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDeactivate(true)}
              className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
            >
              Deactivate (loses progress)
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function RequirementRow({
  label,
  required,
  current
}: {
  label: string
  required: bigint
  current: bigint
}) {
  const met = current >= required
  return (
    <div className="flex items-center justify-between text-[11px] font-mono">
      <span className="text-(--text-secondary)">{label}:</span>
      <span
        className={
          met ? 'text-(--status-success) font-bold' : 'text-(--text-secondary)'
        }
      >
        {current.toString()} / {required.toString()} {met ? '(met)' : ''}
      </span>
    </div>
  )
}

export default memo(MegaprojectCard)
