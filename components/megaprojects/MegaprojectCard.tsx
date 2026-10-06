'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  activateMegaproject,
  deactivateMegaproject
} from '@/app/stores/actions'
import {
  meetsMegaprojectRequirements,
  getEffectiveConstructionCost
} from '@/lib/megaprojectDefs'
import type { MegaprojectDefinition } from '@/lib/megaprojectDefs'
import { formatPoints } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import AllocationSlider from '@/components/megaprojects/AllocationSlider'

interface Props {
  def: MegaprojectDefinition
}

function MegaprojectCard({ def }: Props) {
  const store = useGameStore.getState()
  const completedMegaprojects = useGameStore((s) => s.completedMegaprojects)
  const activeMegaprojectId = useGameStore((s) => s.activeMegaprojectId)
  const megaprojectRPAbsorbed = useGameStore((s) => s.megaprojectRPAbsorbed)
  const megaprojectAllocationPercent = useGameStore(
    (s) => s.megaprojectAllocationPercent
  )
  const pps = useGameStore((s) => s.cachedPointsPerSecond)

  const isCompleted = completedMegaprojects.includes(def.id)
  const isActive = activeMegaprojectId === def.id
  const meetsReqs = meetsMegaprojectRequirements(def.id, store)
  const cost = getEffectiveConstructionCost(def.id, store)

  const progress =
    isActive && cost > 0n
      ? Math.min(1, Number(megaprojectRPAbsorbed) / Number(cost))
      : 0

  // Estimate time to completion
  const allocatedPPS =
    pps > 0n && megaprojectAllocationPercent > 0
      ? (pps * BigInt(megaprojectAllocationPercent)) / 100n
      : 0n

  const remaining = isActive ? cost - megaprojectRPAbsorbed : cost
  const etaSeconds =
    allocatedPPS > 0n && isActive
      ? Number(remaining) / Number(allocatedPPS)
      : null

  return (
    <div
      className={[
        'card rounded-xl p-3 sm:p-4 flex flex-col gap-3 border transition-all',
        isCompleted
          ? 'border-(--status-success)/40 bg-(--status-success)/5'
          : isActive
            ? 'border-(--border-accent) bg-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.08)]'
            : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
            {def.name}
          </span>
          {isCompleted && (
            <span className="text-[9px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10 w-fit">
              COMPLETE
            </span>
          )}
          {isActive && !isCompleted && (
            <span className="text-[9px] font-mono font-bold text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/10 animate-pulse w-fit">
              CONSTRUCTING
            </span>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0 gap-0.5 font-mono">
          <span className="text-xs font-bold text-(--text-primary)">
            {formatPoints(cost)} RP
          </span>
          {etaSeconds !== null && (
            <span className="text-[10px] text-amber-400">
              ~{Math.ceil(etaSeconds / 3600)}h
            </span>
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
                label={`Generator ${def.requiresGeneratorIndex + 1}`}
                required={def.requiresGeneratorCount}
                current={
                  store.generators[def.requiresGeneratorIndex]?.quantity ?? 0n
                }
              />
            )}
          {def.requiresGeneratorIndex2 !== undefined &&
            def.requiresGeneratorCount2 !== undefined && (
              <RequirementRow
                label={`Generator ${def.requiresGeneratorIndex2 + 1}`}
                required={def.requiresGeneratorCount2}
                current={
                  store.generators[def.requiresGeneratorIndex2]?.quantity ?? 0n
                }
              />
            )}
          {def.requiresAR !== undefined && (
            <RequirementRow
              label="Arkalon Resonance"
              required={BigInt(def.requiresAR)}
              current={BigInt(store.arkalonResonance)}
            />
          )}
          {def.requiresMegaproject && (
            <p className="text-[10px] text-(--text-secondary)">
              Requires:{' '}
              <span
                className={
                  store.completedMegaprojects.includes(def.requiresMegaproject)
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
              Activate
            </button>
          ) : (
            <button
              onClick={() => deactivateMegaproject()}
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
