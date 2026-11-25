'use client'

import { useGameStore } from '@/app/stores/gameStore'
import ArtifactShop from '@/components/operations/ArtifactShop'
import { getCurrentCycle, OPERATION_CYCLES } from '@/lib/operationDefs'
import { retuneCosmicEpoch } from '@/app/stores/actions/operationActions'
import ProgressBar from '@/components/ui/ProgressBar'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'

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
  const naturalCycle = useGameStore((s) => s.currentOperationCycle)
  const manualCycle = useGameStore((s) => s.manualOperationCycle)
  const operationPoints = useGameStore((s) => s.currentOperationPoints)
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)
  const anomaliesUnlocked = useGameStore((s) => s.unlocks.anomalies)
  const opAnomalyActive = useGameStore((s) =>
    Boolean(s.activeAnomalyType?.startsWith('operation_'))
  )
  const opPerMin = useGameStore((s) => getSynthesizerRates(s).opPerMin)

  const effectiveCycleNumber = manualCycle ?? naturalCycle
  const currentCycle = getCurrentCycle(effectiveCycleNumber)
  const { daysRemaining, progress } = getCycleProgress()

  const cycleAnomaly = OPERATION_CYCLES.find(
    (c) => c.anomalyType === currentCycle.anomalyType
  )

  return (
    <div className="@container flex flex-col gap-2.5 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Header */}
      <div className="flex flex-col gap-1 px-1">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Anomalous Operations
        </p>
        <p className="text-[0.65rem] text-(--text-secondary) leading-relaxed">
          Synthesize Operation Points with Cosmic Telemetry Arrays (Equipment →
          Synthesizers). Operation Anomalies replace 20% of spawns and boost
          Telemetry Arrays 3x while active.
        </p>
        <div className="p-2 rounded-lg bg-(--bg-elevated) border border-(--border-accent)/25 text-[10px] font-mono text-(--text-accent)">
          ✦ <strong>Facility Directive:</strong> All Operation Points and Cosmic
          Artifacts are permanent. They never reset on Prestige and persist
          across all future epoch rotations.
        </div>
      </div>

      {/* Cosmic Retuning Device */}
      <div className="card rounded-xl p-3 bg-(--bg-surface) border border-cyan-400/40 flex flex-col gap-2 font-mono">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
            ⚡ Cosmic Retuning Device
          </span>
          <span className="text-[9px] text-(--text-secondary)">
            {manualCycle !== null
              ? 'Manual Override Active'
              : 'Natural Rotation'}
          </span>
        </div>
        <p className="text-[11px] text-(--text-secondary)">
          Select which operational anomaly phase to align with (switchable
          anytime):
        </p>
        <div className="grid grid-cols-2 @[420px]:grid-cols-4 gap-1.5 pt-1">
          {OPERATION_CYCLES.map((c) => {
            const isSelected = currentCycle.cycleNumber === c.cycleNumber
            const canRetune = !isSelected

            return (
              <button
                key={c.cycleNumber}
                onClick={() => retuneCosmicEpoch(c.cycleNumber)}
                disabled={!canRetune}
                className={[
                  'p-2 rounded-lg border text-left flex flex-col gap-0.5 transition-all select-none',
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 text-cyan-200 font-bold'
                    : canRetune
                      ? 'border-(--border-default) bg-(--bg-elevated)/60 text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent) cursor-pointer'
                      : 'border-(--border-default)/40 bg-(--bg-surface)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
                ].join(' ')}
              >
                <div className="flex items-center justify-between text-[10px]">
                  <span>Phase {c.cycleNumber}</span>
                  <span>{isSelected ? '●' : '○'}</span>
                </div>
                <span className="text-[10px] font-bold leading-tight wrap-break-word">
                  {c.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Cycle Banner Card */}
      <div className="card rounded-xl p-3.5 sm:p-4 flex flex-col gap-3 border border-(--border-accent)/60 bg-linear-to-b from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface)">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span
              className={[
                'text-xs sm:text-sm font-bold font-mono uppercase tracking-wide',
                currentCycle.cycleNumber === 1
                  ? 'g-dc'
                  : currentCycle.cycleNumber === 2
                    ? 'g-ttr'
                    : currentCycle.cycleNumber === 3
                      ? 'g-dd'
                      : 'g-uqgs'
              ].join(' ')}
            >
              {currentCycle.name}
            </span>
            <span className="text-[10px] font-mono text-(--text-secondary)">
              Cycle #{effectiveCycleNumber} · Phase {currentCycle.cycleNumber}{' '}
              of {OPERATION_CYCLES.length}
            </span>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)">
            {manualCycle !== null
              ? 'Manual Override Active'
              : `Epoch Rotation: ~${daysRemaining}d`}
          </span>
        </div>

        <ProgressBar
          progress={progress}
          variant="default"
          height={4}
          label={
            manualCycle !== null
              ? 'Natural cycle timer (manual override active)'
              : 'Cycle progress'
          }
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
            {currentCycle.visual} · Replaces 20% of anomaly spawns & boosts
            Telemetry Arrays 3x.
          </p>
        </div>
      </div>

      {/* Points Telemetry */}
      <div className="card rounded-xl p-3 flex items-center justify-between border border-(--border-default) bg-(--bg-surface)">
        <div className="flex flex-col">
          <span className="text-[10px] font-mono text-(--text-secondary) uppercase tracking-wider">
            Operations Points
          </span>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-lg font-black font-mono text-(--text-accent)">
              {operationPoints.toLocaleString()} PTS
            </span>
            {opPerMin > 0 && (
              <span className="text-[11px] font-mono text-cyan-300/80 font-bold">
                +
                {opPerMin >= 10
                  ? opPerMin.toFixed(1)
                  : opPerMin.toFixed(2).replace(/\.00$/, '')}
                /m
                {opAnomalyActive && ' (3x arrays)'}
              </span>
            )}
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-1 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
          {artifactsUnlocked.length}/4 Artifacts
        </span>
      </div>

      {/* Anomaly not yet unlocked hint */}
      {!anomaliesUnlocked && (
        <div className="p-2.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 text-xs font-mono">
          Complete 2 research nodes to unlock anomaly events. Operation
          anomalies will then spawn alongside standard ones.
        </div>
      )}

      {/* Artifact Shop */}
      <div className="pt-2 border-t border-(--border-default)/60">
        <ArtifactShop />
      </div>
    </div>
  )
}
