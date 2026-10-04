'use client'

import { useGameStore } from '@/app/stores/gameStore'
import ArtifactShop from '@/components/operations/ArtifactShop'
import { getCurrentCycle, OPERATION_CYCLES } from '@/lib/operationDefs'
import ProgressBar from '@/components/ui/ProgressBar'

// Computes cycle progress based on current date
function getCycleProgress(): { daysRemaining: number; progress: number } {
  const CYCLE_DURATION_MS = 90 * 24 * 3600 * 1000
  const elapsed = Date.now() % CYCLE_DURATION_MS
  const progress = elapsed / CYCLE_DURATION_MS
  const daysRemaining = Math.ceil(
    ((1 - progress) * CYCLE_DURATION_MS) / (24 * 3600 * 1000)
  )
  return { daysRemaining, progress }
}

export default function OperationsWorkspace() {
  const cycleNumber = useGameStore((s) => s.currentOperationCycle)
  const operationPoints = useGameStore((s) => s.currentOperationPoints)
  const multiplierLevel = useGameStore((s) => s.operationMultiplierLevel)
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)

  const currentCycle = getCurrentCycle(cycleNumber)
  const { daysRemaining, progress } = getCycleProgress()

  // Operation anomaly preview
  const cycleAnomaly = OPERATION_CYCLES.find(
    (c) => c.anomalyType === currentCycle.anomalyType
  )

  return (
    <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs font-mono text-[var(--text-secondary)] uppercase tracking-wide">
          Anomalous Operations
        </p>
        <p className="text-[0.65rem] text-[var(--text-secondary)]">
          Join global 90-day operation cycles. Stabilize operation anomalies to
          earn Operation Points and permanent cosmic relics.
        </p>
      </div>

      {/* Current cycle card */}
      <div className="card rounded-lg p-3 flex flex-col gap-3 border-[var(--border-accent)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-[var(--text-accent)] font-mono uppercase tracking-wide">
              {currentCycle.name}
            </span>
            <span className="text-[0.65rem] text-[var(--text-secondary)]">
              Cycle {cycleNumber} of {OPERATION_CYCLES.length} (repeating)
            </span>
          </div>
          <span className="chip border-[var(--border-accent)] text-[var(--border-accent)] text-[0.6rem]">
            {daysRemaining}d remaining
          </span>
        </div>

        <ProgressBar
          progress={progress}
          variant="default"
          height={4}
          label="Cycle progress"
          showPercent
        />

        {/* Anomaly preview */}
        <div className="flex flex-col gap-0.5">
          <p className="text-[0.65rem] text-[var(--text-secondary)] uppercase tracking-wide font-mono">
            Operation Anomaly
          </p>
          <p className="text-xs text-[var(--text-primary)]">
            {cycleAnomaly?.name ?? currentCycle.anomalyType}
          </p>
          <p className="text-[0.65rem] text-[var(--text-secondary)]">
            {currentCycle.visual}. Replaces 20% of standard anomaly spawns.
          </p>
        </div>
      </div>

      {/* Points balance */}
      <div className="card rounded-lg p-3 flex items-center justify-between">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Operation Points
          </span>
          <span className="text-lg font-bold font-mono text-[var(--text-accent)]">
            {operationPoints.toLocaleString()}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[0.65rem] font-mono text-[var(--text-secondary)]">
            Artifacts owned
          </span>
          <span className="text-xs font-mono text-[var(--text-primary)]">
            {artifactsUnlocked.length}/4
          </span>
        </div>
      </div>

      {/* Anomaly not yet unlocked hint */}
      {!anomaliesUnlocked && (
        <div className="glass rounded p-3">
          <p className="text-xs text-[var(--status-warning)]">
            Complete a research node (C1, E1, R1, or O1) to unlock anomaly
            events. Operation anomalies will then spawn alongside standard ones.
          </p>
        </div>
      )}

      <div className="section-divider" />

      {/* Artifact shop */}
      <ArtifactShop />
    </div>
  )
}
