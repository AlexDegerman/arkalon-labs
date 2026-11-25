'use client'

import { useGameStore } from '@/app/stores/gameStore'
import ProgressBar from '@/components/ui/ProgressBar'
import { formatCountdown } from '@/lib/format'
import {
  ANOMALY_DEFINITIONS,
  getAnomalyBuffScale,
  getEffectiveDuration,
  OPERATION_ANOMALY_DEFINITIONS,
  FUSED_ANOMALY_DEFINITIONS
} from '@/lib/anomalyDefs'
import { useMemo, useState } from 'react'

interface AnomalyTheme {
  textClass: string
  borderColor: string
  glowColor: string
  accentBg: string
  pingColor: string
}

export function getAnomalyTheme(type: string): AnomalyTheme {
  switch (type) {
    case 'quantum_surge':
      return {
        textClass: 'g-dc',
        borderColor: 'border-cyan-400/60',
        glowColor: '0 0 25px rgba(0, 240, 255, 0.25)',
        accentBg: 'bg-cyan-950/40',
        pingColor: 'bg-cyan-400'
      }
    case 'temporal_distortion':
      return {
        textClass: 'g-dd',
        borderColor: 'border-purple-400/60',
        glowColor: '0 0 25px rgba(168, 85, 247, 0.25)',
        accentBg: 'bg-purple-950/40',
        pingColor: 'bg-purple-400'
      }
    case 'containment_breach':
      return {
        textClass: 'g-oc',
        borderColor: 'border-orange-500/60',
        glowColor: '0 0 25px rgba(249, 115, 22, 0.25)',
        accentBg: 'bg-orange-950/40',
        pingColor: 'bg-orange-500'
      }
    case 'arkalon_resonance':
      return {
        textClass: 'g-sp',
        borderColor: 'border-(--border-accent)/70',
        glowColor: '0 0 25px rgba(0, 240, 255, 0.3)',
        accentBg: 'bg-cyan-950/30',
        pingColor: 'bg-(--border-accent)'
      }
    case 'operation_chrono_freeze':
      return {
        textClass: 'g-sp',
        borderColor: 'border-sky-400/60',
        glowColor: '0 0 25px rgba(56, 189, 248, 0.25)',
        accentBg: 'bg-sky-950/40',
        pingColor: 'bg-sky-400'
      }
    case 'operation_solar_flare':
      return {
        textClass: 'g-ttr',
        borderColor: 'border-amber-400/60',
        glowColor: '0 0 25px rgba(251, 191, 36, 0.25)',
        accentBg: 'bg-amber-950/40',
        pingColor: 'bg-amber-400'
      }
    case 'operation_gravity_sink':
      return {
        textClass: 'g-sx',
        borderColor: 'border-fuchsia-500/60',
        glowColor: '0 0 25px rgba(217, 70, 239, 0.25)',
        accentBg: 'bg-fuchsia-950/40',
        pingColor: 'bg-fuchsia-400'
      }
    case 'operation_matrix_inversion':
      return {
        textClass: 'g-uqgs',
        borderColor: 'border-emerald-400/60',
        glowColor: '0 0 25px rgba(52, 211, 153, 0.25)',
        accentBg: 'bg-emerald-950/40',
        pingColor: 'bg-emerald-400'
      }
    case 'fused_singularity_surge':
      return {
        textClass: 'g-tqgs',
        borderColor: 'border-amber-400/80',
        glowColor: '0 0 30px rgba(251, 191, 36, 0.35)',
        accentBg:
          'bg-linear-to-r from-amber-950/40 via-cyan-950/30 to-amber-950/40',
        pingColor: 'bg-amber-400'
      }
    case 'fused_chronal_breach':
      return {
        textClass: 'g-sp',
        borderColor: 'border-fuchsia-400/80',
        glowColor: '0 0 30px rgba(217, 70, 239, 0.35)',
        accentBg:
          'bg-linear-to-r from-purple-950/40 via-fuchsia-950/30 to-purple-950/40',
        pingColor: 'bg-fuchsia-400'
      }
    default:
      return {
        textClass: 'text-red-400',
        borderColor: 'border-red-500/60',
        glowColor: '0 0 25px rgba(239, 68, 68, 0.25)',
        accentBg: 'bg-red-950/40',
        pingColor: 'bg-red-500'
      }
  }
}

const ALL_ANOMALY_DEFINITIONS = [
  ...ANOMALY_DEFINITIONS,
  ...OPERATION_ANOMALY_DEFINITIONS,
  ...FUSED_ANOMALY_DEFINITIONS
]
function formatMult(val: number): string {
  return Number.isInteger(val)
    ? `${val}x`
    : `${val.toFixed(2).replace(/\.?0+$/, '')}x`
}

function getScaledAnomalyReward(type: string, buffScale: number): string {
  switch (type) {
    case 'quantum_surge':
      return `${formatMult(3 * buffScale)} Global RP Production`
    case 'temporal_distortion':
      return `${formatMult(5 * buffScale)} Research Speed`
    case 'containment_breach':
      return `${formatMult(2.5 * buffScale)} Global RP Production`
    case 'arkalon_resonance':
      return `${formatMult(2 * buffScale)} Global RP Production`
    case 'operation_chrono_freeze':
      return `${formatMult(2 * buffScale)} RP Production & ${formatMult(3 * buffScale)} Research Speed`
    case 'operation_solar_flare':
      return `${formatMult(3 * buffScale)} Output to Energy Generators`
    case 'operation_gravity_sink':
      return `${formatMult(2.5 * buffScale)} Global RP Production`
    case 'operation_matrix_inversion':
      return `${formatMult(2 * buffScale)} Arkalon Resonance Output`
    case 'fused_singularity_surge':
      return `${formatMult(4 * buffScale)} Global RP Production`
    case 'fused_chronal_breach':
      return `${formatMult(5 * buffScale)} Research Speed & ${formatMult(2 * buffScale)} RP`
    default: {
      const def = ALL_ANOMALY_DEFINITIONS.find((d) => d.type === type)
      return def?.rewardDescription ?? 'Booster Active'
    }
  }
}

export function getCompactAnomalyReward(
  type: string,
  buffScale: number
): string {
  switch (type) {
    case 'quantum_surge':
      return `${formatMult(3 * buffScale)} RP`
    case 'temporal_distortion':
      return `${formatMult(5 * buffScale)} Research`
    case 'containment_breach':
    case 'operation_gravity_sink':
      return `${formatMult(2.5 * buffScale)} RP`
    case 'arkalon_resonance':
      return `${formatMult(2 * buffScale)} RP`
    case 'operation_chrono_freeze':
      return `${formatMult(2 * buffScale)} RP Â· ${formatMult(3 * buffScale)} Res`
    case 'operation_solar_flare':
      return `${formatMult(3 * buffScale)} Energy`
    case 'operation_matrix_inversion':
      return `${formatMult(2 * buffScale)} Resonance`
    case 'fused_singularity_surge':
      return `${formatMult(4 * buffScale)} RP`
    case 'fused_chronal_breach':
      return `${formatMult(5 * buffScale)} Res Â· ${formatMult(2 * buffScale)} RP`
    default:
      return 'Boost Active'
  }
}

function getAnomalyInfo(type: string, buffScale: number) {
  const def = ALL_ANOMALY_DEFINITIONS.find((d) => d.type === type)
  return {
    label: def?.label ?? type,
    reward: getScaledAnomalyReward(type, buffScale),
    compactReward: getCompactAnomalyReward(type, buffScale)
  }
}

export default function AnomalyOverlay() {
  const activeType = useGameStore((s) => s.activeAnomalyType)
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const buffScale = useGameStore(getAnomalyBuffScale)

  const baseDuration = useMemo(() => {
    if (!activeType) return 60
    const s = useGameStore.getState()
    const def = ALL_ANOMALY_DEFINITIONS.find((d) => d.type === activeType)
    return def ? getEffectiveDuration(def, s) : 60
  }, [activeType])

  if (!activeType) return null

  const { label, reward } = getAnomalyInfo(activeType, buffScale)
  const theme = getAnomalyTheme(activeType)
  const progress = timeRemaining > 0 ? timeRemaining / baseDuration : 0

  return (
    <div className="w-full mb-2" role="status" aria-live="polite">
      <div
        className={`card rounded-xl border ${theme.borderColor} bg-(--bg-surface)/95 w-full p-3 flex flex-col gap-2`}
        style={{ boxShadow: theme.glowColor }}
      >
        <div className="flex items-center justify-between gap-2 border-b border-(--border-default)/50 pb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full ${theme.pingColor} shrink-0`}
            />
            <span className="text-xs font-mono font-black uppercase tracking-wider leading-tight text-(--text-primary)">
              {label}
            </span>
          </div>
          <span className="text-xs font-mono font-bold text-(--text-accent) shrink-0">
            {formatCountdown(timeRemaining)}
          </span>
        </div>

        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary)">
            Active Facility Buffer
          </span>
          <span className={`text-xs font-mono font-bold ${theme.textClass}`}>
            ✦ {reward}
          </span>
        </div>

        <ProgressBar
          progress={progress}
          variant="warning"
          height={3}
          animated={false}
        />

        <span className="text-[10px] font-mono text-(--text-secondary)/75 leading-snug">
          Passive field active · Temporary facility-wide boost
        </span>
      </div>
    </div>
  )
}

export function MobileAnomalyBar() {
  const [expanded, setExpanded] = useState(false)
  const activeType = useGameStore((s) => s.activeAnomalyType)
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const buffScale = useGameStore(getAnomalyBuffScale)
  
  const baseDuration = useMemo(() => {
    if (!activeType) return 60
    const s = useGameStore.getState()
    const def = ALL_ANOMALY_DEFINITIONS.find((d) => d.type === activeType)
    return def ? getEffectiveDuration(def, s) : 60
  }, [activeType])

  if (!activeType) return null

  const { label, reward, compactReward } = getAnomalyInfo(activeType, buffScale)
  const theme = getAnomalyTheme(activeType)
  const progress = timeRemaining > 0 ? timeRemaining / baseDuration : 0

  return (
    <button
      type="button"
      onClick={() => setExpanded((prev) => !prev)}
      className={`w-full text-left flex flex-col ${theme.accentBg} border-y ${theme.borderColor} shrink-0 font-mono cursor-pointer`}
      aria-expanded={expanded}
    >
      <div className="flex flex-col gap-0.5 px-3 py-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${theme.pingColor} shrink-0`}
            />
            <span className="text-[11px] font-black uppercase tracking-normal leading-tight text-(--text-primary) truncate">
              {label}
            </span>
            {!expanded && (
              <span
                className={`text-[10px] font-bold leading-tight shrink-0 ${theme.textClass}`}
              >
                · {compactReward}
              </span>
            )}
          </div>
          <span className="text-[11px] font-bold text-(--text-accent) shrink-0">
            {formatCountdown(timeRemaining)}
          </span>
        </div>
        {expanded && (
          <span
            className={`text-[11px] font-bold leading-tight ${theme.textClass}`}
          >
            ✦ {reward}
          </span>
        )}
      </div>
      <ProgressBar
        progress={progress}
        variant="warning"
        height={2}
        animated={false}
      />
    </button>
  )
}
