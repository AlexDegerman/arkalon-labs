'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ArkalonSphere, {
  CORE_STAGE_LABELS,
  getArkalonCoreStage
} from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import { formatCountdown } from '@/lib/format'
import type { ArkalonState } from '@/components/arkalon/ArkalonSphere'
import { useUIStore } from '@/app/stores/uiStore'
import { pulseArkalonCore } from '@/app/stores/actions/researchActions'
import { synthesizeAnomaly } from '@/app/stores/actions/anomalyActions'
import { getColliderCost } from '@/lib/synthesizerDefs'
import AnomalyOverlay from '../ui/AnomalyOverlay'

function AnomalyStatusPip() {
  const initialized = useGameStore((s) => s._initialized)
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const anomalyTimeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const timeToNextCheck = useGameStore((s) => s.timeToNextAnomalyCheck)
  const o3Complete = useGameStore((s) =>
    s.completedResearchNodes.includes('O3')
  )

  let anomalyStatusLabel: string
  if (!initialized) {
    anomalyStatusLabel = 'Anomaly: Syncing...'
  } else if (activeAnomaly) {
    anomalyStatusLabel = `Anomaly: ${formatCountdown(anomalyTimeRemaining)}`
  } else if (o3Complete) {
    anomalyStatusLabel = `Next anomaly: ${formatCountdown(timeToNextCheck)}`
  } else {
    anomalyStatusLabel = 'Anomaly: Standby'
  }

  return (
    <div className="flex items-center gap-1.5 truncate w-full">
      <span
        className={[
          'w-2 h-2 rounded-full shrink-0',
          activeAnomaly
            ? 'bg-red-500'
            : o3Complete
              ? 'bg-(--border-accent)'
              : 'bg-(--status-locked)'
        ].join(' ')}
      />
      <span className="truncate text-(--text-secondary) text-[11px]">
        {anomalyStatusLabel}
      </span>
    </div>
  )
}

export function ParticleColliderButton() {
  const [confirmFire, setConfirmFire] = useState(false)
  const dust = useGameStore((s) => s.artifactDust)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const anomaliesDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.anomaliesDisabled ?? false
  )
  const colliderCost = useGameStore(getColliderCost)

  const canSynthesize = !activeAnomaly && dust >= colliderCost

  useEffect(() => {
    if (!confirmFire) return
    if (!canSynthesize) {
      setConfirmFire(false)
      return
    }
    const timer = setTimeout(() => setConfirmFire(false), 4000)
    return () => clearTimeout(timer)
  }, [confirmFire, canSynthesize])

  if (!anomaliesUnlocked || anomaliesDisabled) return null

  if (confirmFire && canSynthesize) {
    return (
      <div className="col-span-2 w-full flex items-center gap-1.5 font-mono">
        <button
          onClick={() => {
            setConfirmFire(false)
            synthesizeAnomaly()
          }}
          className="flex-1 py-1.5 px-2.5 text-[11px] font-bold rounded-lg border border-cyan-400 bg-cyan-400 text-[#080c14] hover:brightness-110 uppercase tracking-wider cursor-pointer"
        >
          Confirm Ignition (-{colliderCost.toLocaleString()} Dust)
        </button>
        <button
          onClick={() => setConfirmFire(false)}
          className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
          aria-label="Cancel ignition"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirmFire(true)}
      disabled={!canSynthesize}
      title={`Synthesize an immediate anomaly event using ${colliderCost.toLocaleString()} Artifact Dust`}
      className={[
        'col-span-2 w-full py-1.5 px-2.5 text-[11px] font-mono font-bold rounded-lg border transition-all uppercase tracking-wider flex items-center justify-center gap-1.5',
        canSynthesize
          ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300 hover:bg-cyan-400 hover:text-[#080c14] shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer'
          : 'border-(--border-default) bg-(--bg-elevated)/50 text-(--text-secondary)/50 cursor-not-allowed opacity-65'
      ].join(' ')}
    >
      <span>
        {activeAnomaly
          ? '⚡ Particle Collider // Surge Active'
          : `⚡ Particle Collider (${colliderCost.toLocaleString()} Dust)`}
      </span>
    </button>
  )
}

export default function CenterColumn() {
  const initialized = useGameStore((s) => s._initialized)
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const probeCount = useGameStore((s) => s.probes.length)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const coreStage = useGameStore((s) =>
    getArkalonCoreStage(
      s.stats.peakLifetimePoints ?? s.lifetimePoints,
      s.stats.totalPrestigesTier1 +
        s.stats.totalPrestigesTier2 +
        s.stats.totalPrestigesTier3
    )
  )
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)

  const lines = useUIStore((s) => s.terminalLines)

  // Determine sphere visual state
  // prestige animation takes priority over anomaly
  const sphereState: ArkalonState = prestigeAnimating
    ? 'prestige'
    : activeAnomaly
      ? 'anomaly'
      : 'idle'

  function handleSphereClick() {
    pulseArkalonCore()
  }

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col items-center gap-2 p-2.5 sm:p-3 overflow-y-auto scrollbar-dark">
        {/* Animated vector sphere */}
        <div className="shrink-0 flex-1 min-h-28 flex flex-col items-center justify-center gap-1 py-0.5">
          <ArkalonSphere
            state={sphereState}
            interactive={true}
            onClick={handleSphereClick}
            size={112}
            stage={coreStage}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary)/80">
            Core Lattice {coreStage}/5 · {CORE_STAGE_LABELS[coreStage]}
          </span>
        </div>

        {/* Docked Active Anomaly Card */}
        <div className="w-full shrink-0">
          <AnomalyOverlay />
        </div>

        {/* Live Typewriter Terminal Console */}
        <div className="w-full shrink-0">
          <ArkalonTerminal lines={lines} maxLines={3} />
        </div>

        {/* Diagnostic Status Pips */}
        <div className="w-full grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-(--bg-surface) border border-(--border-default) shrink-0 text-xs font-mono">
          <AnomalyStatusPip />

          <div className="flex items-center gap-1.5 truncate justify-end">
            <span
              className={[
                'w-2 h-2 rounded-full shrink-0',
                initialized && probeCount > 0
                  ? 'bg-amber-400'
                  : 'bg-(--status-locked)'
              ].join(' ')}
            />
            <span className="text-(--text-secondary) text-[11px]">
              Probes: {initialized ? probeCount : '...'}
            </span>
          </div>

          <ParticleColliderButton />
        </div>
      </div>
    </div>
  )
}
