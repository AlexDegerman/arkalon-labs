'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  activateMegaproject,
  deactivateMegaproject,
} from '@/app/stores/gameActions'
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
      'card rounded-lg p-3 flex flex-col gap-3',
      isActive ? 'border-(--border-accent)' : '',
      isCompleted ? 'border-(--status-success)' : ''
    ].join(' ')}
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-2">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-xs font-semibold text-(--text-primary) truncate">
          {def.name}
        </span>
        {isCompleted && (
          <span className="text-[0.6rem] font-mono text-(--status-success)">
            COMPLETE
          </span>
        )}
        {isActive && !isCompleted && (
          <span className="text-[0.6rem] font-mono text-(--border-accent) dot-pulse">
            CONSTRUCTING
          </span>
        )}
      </div>
      <div className="flex flex-col items-end shrink-0 gap-0.5">
        <span className="text-[0.65rem] font-mono text-(--text-secondary)">
          {formatPoints(cost)} RP
        </span>
        {etaSeconds !== null && (
          <span className="text-[0.6rem] font-mono text-(--status-warning)">
            ~{Math.ceil(etaSeconds / 3600)}h
          </span>
        )}
      </div>
    </div>

    {/* Description */}
    <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
      {def.description}
    </p>

    {/* Reward */}
    <p className="text-[0.65rem] text-(--text-accent) leading-snug">
      Reward: {def.reward}
    </p>

    {/* Progress bar when active */}
    {isActive && (
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-[0.6rem] font-mono">
          <span className="text-(--text-secondary)">
            {formatPoints(megaprojectRPAbsorbed)} / {formatPoints(cost)}
          </span>
          <span className="text-(--text-accent)">
            {Math.round(progress * 100)}%
          </span>
        </div>
        <ProgressBar progress={progress} height={5} />
      </div>
    )}

    {/* Requirements list when not met */}
    {!isCompleted && !meetsReqs && (
      <div className="flex flex-col gap-0.5">
        <p className="text-[0.6rem] text-(--status-warning) uppercase tracking-wide">
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
          <p className="text-[0.6rem] text-(--text-secondary)">
            Requires:{' '}
            <span
              className={
                store.completedMegaprojects.includes(def.requiresMegaproject)
                  ? 'text-(--status-success)'
                  : 'text-#ef4444'
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
      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={() => activateMegaproject(def.id)}
            disabled={!meetsReqs}
            className={[
              'flex-1 py-1.5 text-xs font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
              meetsReqs
                ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-50'
            ].join(' ')}
          >
            Activate
          </button>
        ) : (
          <button
            onClick={() => deactivateMegaproject()}
            className="flex-1 py-1.5 text-xs font-mono rounded border border-#ef4444 text-#ef4444 hover:bg-#ef4444/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-#ef4444"
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
    <p
      className={[
        'text-[0.6rem] font-mono',
        met ? 'text-(--status-success)' : 'text-(--text-secondary)'
      ].join(' ')}
    >
      {label}: {current.toString()}/{required.toString()}
      {met ? ' (met)' : ''}
    </p>
  )
}

export default memo(MegaprojectCard)
