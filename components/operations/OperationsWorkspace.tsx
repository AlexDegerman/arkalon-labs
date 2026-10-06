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
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)

  const currentCycle = getCurrentCycle(cycleNumber)
  const { daysRemaining, progress } = getCycleProgress()

  const cycleAnomaly = OPERATION_CYCLES.find(
    (c) => c.anomalyType === currentCycle.anomalyType
  )

  return (
    <div className="flex flex-col gap-4 p-3 sm:p-4 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Header */}
      <div className="flex flex-col gap-0.5 px-1">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Anomalous Operations
        </p>
        <p className="text-[0.65rem] text-(--text-secondary)">
          Join global 90-day operation cycles. Stabilize operation anomalies to
          earn Operation Points and permanent cosmic relics.
        </p>
      </div>

      {/* Cycle Banner Card */}
      <div className="card rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 border border-(--border-accent)/60 bg-linear-to-b from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface)">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs sm:text-sm font-bold text-(--text-accent) font-mono uppercase tracking-wide">
              {currentCycle.name}
            </span>
            <span className="text-[10px] font-mono text-(--text-secondary)">
              Iteration {cycleNumber} of {OPERATION_CYCLES.length}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)">
            {daysRemaining} Days Left
          </span>
        </div>

        <ProgressBar
          progress={progress}
          variant="default"
          height={4}
          label="Cycle progress"
          showPercent
        />

        <div className="p-2.5 rounded-lg bg-(--bg-elevated) border border-(--border-default) text-[11px] font-mono">
          <span className="text-(--text-secondary) text-[10px] uppercase tracking-wider block mb-0.5">
            Operation Anomaly
          </span>
          <span className="font-bold text-(--text-primary)">
            {cycleAnomaly?.name ?? currentCycle.anomalyType}
          </span>
          <p className="text-[10px] text-(--text-secondary)/80 mt-0.5">
            {currentCycle.visual} · Replaces 20% of standard spawns.
          </p>
        </div>
      </div>

      {/* Points Telemetry */}
      <div className="card rounded-xl p-3 flex items-center justify-between border border-(--border-default) bg-(--bg-surface)">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-(--text-secondary) uppercase tracking-wider">
            Operations Points
          </span>
          <span className="text-lg font-black font-mono text-(--text-accent)">
            {operationPoints.toLocaleString()} PTS
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
          {artifactsUnlocked.length}/4 Artifacts
        </span>
      </div>
      
      {/* Anomaly not yet unlocked hint */}
      {!anomaliesUnlocked && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
          Complete a research node (C1, E1, R1, or O1) to unlock anomaly events.
          Operation anomalies will then spawn alongside standard ones.
        </div>
      )}

      <div className="section-divider" />

      {/* Artifact Shop */}
      <ArtifactShop />
    </div>
  )
}
