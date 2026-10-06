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

export default function AnomalyOverlay() {
  const activeType = useGameStore((s) => s.activeAnomalyType)
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)

  if (!activeType) return null

  const label = getAnomalyLabel(activeType)
  const InteractionComponent = getInteractionComponent(activeType)

  return (
    <div
      className="hidden lg:flex fixed inset-0 z-40 items-center justify-center bg-black/70 backdrop-blur-xs animate-[fade-in_0.15s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-label={`Anomaly: ${label}`}
    >
      <div className="card rounded-2xl border border-red-500/70 bg-(--bg-surface)/95 w-full max-w-lg mx-4 flex flex-col overflow-hidden shadow-[0_0_50px_rgba(239,68,68,0.25)] backdrop-blur-md">
        {/* Top Highlight Stripe (Red/Magenta Anomaly Flare) */}
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-red-500 via-[#ff00dc] to-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]" />

        <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/30 bg-red-950/20">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="text-xs sm:text-sm font-black font-mono text-red-400 uppercase tracking-widest">
              {label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs sm:text-sm font-mono font-bold text-(--text-accent)">
              {formatCountdown(timeRemaining)}
            </span>
            <button
              onClick={() => dismissAnomaly()}
              className="text-xs font-mono text-(--text-secondary) hover:text-(--text-primary) transition-colors p-1 cursor-pointer"
              aria-label="Dismiss anomaly"
            >
              ✕
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
        className="w-full flex items-center justify-between px-3 py-2 bg-red-950/40 border-y border-red-500/40 shrink-0 font-mono transition-colors active:bg-red-900/40 cursor-pointer"
        aria-label={`Anomaly active: ${label}. Tap to expand.`}
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-black text-red-400 uppercase tracking-wider">
            {label}
          </span>
        </div>
        <span className="text-xs font-bold text-(--text-accent)">
          {formatCountdown(timeRemaining)} · Tap to Stabilize
        </span>
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-(--bg-primary) animate-[fade-in_0.15s_ease-out_both]">
      <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-red-500 via-[#ff00dc] to-red-500" />

      <div className="flex items-center justify-between px-4 py-3 border-b border-red-500/30 bg-(--bg-surface)">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
          <span className="text-xs sm:text-sm font-black font-mono text-red-400 uppercase tracking-widest">
            {label}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-(--text-accent)">
            {formatCountdown(timeRemaining)}
          </span>
          <button
            onClick={() => setExpanded(false)}
            className="text-xs font-mono font-bold text-(--text-secondary) hover:text-(--text-primary) px-2 py-1 rounded bg-(--bg-elevated) border border-(--border-default)"
          >
            Collapse
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
