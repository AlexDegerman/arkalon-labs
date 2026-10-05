'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { dismissAnomaly } from '@/app/stores/actions'
import QuantumSurge from '@/components/anomalies/QuantumSurge'
import TemporalDistortion from '@/components/anomalies/TemporalDistortion'
import ContainmentBreach from '@/components/anomalies/ContainmentBreach'
import ArkalonResonanceAnomaly from '@/components/anomalies/ArkalonResonance'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatCountdown } from '@/lib/format'
import {
  ANOMALY_DEFINITIONS,
  getEffectiveDuration,
  OPERATION_ANOMALY_DEFINITIONS
} from '@/lib/anomalyDefs'
import {
  ChronoFreezeFlux,
  SolarFlareOverload,
  GravitySinkCollapse,
  MatrixInversion
} from './OperationAnomalies'
import { GameState } from '@/types/game'

// Returns the label for an anomaly type
function getAnomalyLabel(type: string): string {
  const all = [...ANOMALY_DEFINITIONS, ...OPERATION_ANOMALY_DEFINITIONS]
  return all.find((d) => d.type === type)?.label ?? type
}

// Effective duration honors E7, Anomaly Extender, relics and AC7 override
function getBaseDuration(type: string, state: GameState): number {
  const all = [...ANOMALY_DEFINITIONS, ...OPERATION_ANOMALY_DEFINITIONS]
  const def = all.find((d) => d.type === type)
  if (!def) return 45
  return getEffectiveDuration(def, state)
}

function getInteractionComponent(type: string): React.ComponentType | null {
  switch (type) {
    case 'quantum_surge':
      return QuantumSurge
    case 'temporal_distortion':
      return TemporalDistortion
    case 'containment_breach':
      return ContainmentBreach
    case 'arkalon_resonance':
      return ArkalonResonanceAnomaly
    case 'operation_chrono_freeze':
      return ChronoFreezeFlux
    case 'operation_solar_flare':
      return SolarFlareOverload
    case 'operation_gravity_sink':
      return GravitySinkCollapse
    case 'operation_matrix_inversion':
      return MatrixInversion
    default:
      return null
  }
}

// Desktop: centered modal overlay
export default function AnomalyOverlay() {
  const activeType = useGameStore((s) => s.activeAnomalyType)
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)

  if (!activeType) return null

  const label = getAnomalyLabel(activeType)
  const InteractionComponent = getInteractionComponent(activeType)

  return (
    <div
      className="hidden lg:flex fixed inset-0 z-30 items-center justify-center bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-label={`Anomaly: ${label}`}
    >
      <div className="glass rounded-lg border border-[#ef4444] w-full max-w-lg mx-4 flex flex-col overflow-hidden shadow-2xl shadow-red-500/20">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#ef4444]/40">
          <div className="flex items-center gap-2">
            <span className="status-dot bg-[#ef4444] dot-pulse" />
            <span className="text-sm font-bold font-mono text-[#ef4444] uppercase tracking-widest">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-mono text-(--text-accent)">
              {formatCountdown(timeRemaining)}
            </span>
            <button
              onClick={() => dismissAnomaly()}
              className="text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded px-1"
              aria-label="Dismiss anomaly"
            >
              dismiss
            </button>
          </div>
        </div>

        {/* Timer bar */}
        <div className="px-4 pt-3">
          <ProgressBar
            progress={
              timeRemaining > 0
                ? timeRemaining /
                  getBaseDuration(activeType, useGameStore.getState())
                : 0
            }
            variant="warning"
            height={3}
            animated={false}
          />
        </div>

        {/* Interaction content */}
        <div className="p-4">
          {InteractionComponent && <InteractionComponent />}
        </div>
      </div>
    </div>
  )
}

// Mobile anomaly bar - shown in the Lab tab when anomaly is active
export function MobileAnomalyBar() {
  const [expanded, setExpanded] = useState(false)
  const activeType = useGameStore((s) => s.activeAnomalyType)
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)

  if (!activeType) return null

  const label = getAnomalyLabel(activeType)
  const InteractionComponent = getInteractionComponent(activeType)

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between px-3 py-2 bg-[#ef4444]/10 border-y border-[#ef4444]/40 shrink-0"
        aria-label={`Anomaly active: ${label}. Tap to expand.`}
      >
        <div className="flex items-center gap-2">
          <span className="status-dot bg-[#ef4444] dot-pulse" />
          <span className="text-xs font-bold font-mono text-[#ef4444] uppercase">
            {label}
          </span>
        </div>
        <span className="text-xs font-mono text-(--text-accent)">
          {formatCountdown(timeRemaining)} - tap to interact
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-30 flex flex-col bg-(--bg-primary)">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#ef4444]/40 bg-(--bg-surface)">
        <div className="flex items-center gap-2">
          <span className="status-dot bg-[#ef4444] dot-pulse" />
          <span className="text-sm font-bold font-mono text-[#ef4444] uppercase tracking-widest">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-mono text-(--text-accent)">
            {formatCountdown(timeRemaining)}
          </span>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded px-1"
          >
            collapse
          </button>
        </div>
      </div>

      <div className="px-4 pt-3">
        <ProgressBar
          progress={
            timeRemaining > 0
              ? timeRemaining /
                getBaseDuration(activeType, useGameStore.getState())
              : 0
          }
          variant="warning"
          height={3}
          animated={false}
        />
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {InteractionComponent && <InteractionComponent />}
      </div>
    </div>
  )
}
