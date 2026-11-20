'use client'

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

  const dust = useGameStore((s) => s.artifactDust)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)
  const canSynthesize = anomaliesUnlocked && !activeAnomaly && dust >= 25

  return (
    <div className="flex items-center justify-between gap-1.5 truncate w-full">
      <div className="flex items-center gap-1.5 truncate">
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
      {anomaliesUnlocked && !activeAnomaly && (
        <button
          onClick={() => synthesizeAnomaly()}
          disabled={!canSynthesize}
          title="Synthesize an immediate anomaly event using 25 Artifact Dust"
          className={[
            'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border transition-all cursor-pointer shrink-0 uppercase',
            canSynthesize
              ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 hover:bg-cyan-400 hover:text-black shadow-[0_0_8px_rgba(0,240,255,0.3)]'
              : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)/40 cursor-not-allowed opacity-50'
          ].join(' ')}
        >
          ⚡ Collider (25 Dust)
        </button>
      )}
    </div>
  )
}

export default function CenterColumn() {
  const initialized = useGameStore((s) => s._initialized)
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const probeCount = useGameStore((s) => s.probes.length)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const peakLifetime = useGameStore(
    (s) => s.stats.peakLifetimePoints ?? s.lifetimePoints
  )
  const totalPrestiges = useGameStore(
    (s) =>
      s.stats.totalPrestigesTier1 +
      s.stats.totalPrestigesTier2 +
      s.stats.totalPrestigesTier3
  )
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)

  const coreStage = getArkalonCoreStage(peakLifetime, totalPrestiges)

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

      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto scrollbar-dark">
        {/* Animated vector sphere */}
        <div className="my-auto flex flex-col items-center gap-2.5">
          <ArkalonSphere
            state={sphereState}
            interactive={true}
            onClick={handleSphereClick}
            size={150}
            stage={coreStage}
          />
          <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary)/80">
            Core Lattice {coreStage}/5 · {CORE_STAGE_LABELS[coreStage]}
          </span>
        </div>

        {/* Docked Active Anomaly Card */}
        <AnomalyOverlay />

        {/* Live Typewriter Terminal Console */}
        <div className="w-full my-2">
          <ArkalonTerminal lines={lines} maxLines={3} />
        </div>

        {/* Diagnostic Status Pips */}
        <div className="w-full grid grid-cols-2 gap-2 p-2 rounded-xl bg-(--bg-surface) border border-(--border-default) shrink-0 text-xs font-mono">
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

          {/* Prestige info - shown after first prestige */}
          {prestige1Done && (
            <div className="col-span-2 flex items-center justify-between pt-1 border-t border-(--border-default)/50 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-(--status-success) shrink-0" />
                <span className="text-(--text-secondary)">
                  Operations: Active
                </span>
              </div>
              <span className="text-(--text-accent) font-bold">
                Recalibration Available
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
