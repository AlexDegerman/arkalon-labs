'use client'

import {
  buyOperationArtifact,
  buyRepeatableCosmicSink
} from '@/app/stores/actions/operationActions'
import { useGameStore } from '@/app/stores/gameStore'
import {
  OPERATION_ARTIFACTS,
  getAttunementCost,
  getTemporalCost,
  getActiveCosmicTitle
} from '@/lib/operationDefs'
import type { OperationArtifactId } from '@/types/game'

export default function ArtifactShop() {
  const operationPoints = useGameStore((s) => s.currentOperationPoints)
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)

  const attunementLevel = useGameStore((s) => s.cosmicAttunementLevel ?? 0)
  const temporalLevel = useGameStore((s) => s.cosmicTemporalLevel ?? 0)
  const attunementCost = getAttunementCost(attunementLevel)
  const temporalCost = getTemporalCost(temporalLevel)

  const totalPointsSpent =
    artifactsUnlocked.reduce((acc, id) => {
      const art = OPERATION_ARTIFACTS.find((a) => a.id === id)
      return acc + (art?.cost ?? 0)
    }, 0) +
    (attunementLevel * 500 + ((attunementLevel * (attunementLevel - 1)) / 2) * 250) +
    (temporalLevel * 1000 + ((temporalLevel * (temporalLevel - 1)) / 2) * 500)

  const activeTitle = getActiveCosmicTitle(totalPointsSpent)

  return (
    <div className="flex flex-col gap-3.5">
      {/* Operational Title Rank */}
      {activeTitle && (
        <div className="p-2.5 rounded-xl border border-cyan-400/40 bg-cyan-950/20 flex items-center justify-between font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 border border-cyan-400/40">
              {activeTitle.badge}
            </span>
            <span className="font-bold text-cyan-200">{activeTitle.title}</span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            {totalPointsSpent.toLocaleString()} Total PTS Invested
          </span>
        </div>
      )}

      {/* Repeatable Cosmic Sinks */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest px-1">
          Repeatable Cosmic Sinks
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="card rounded-xl p-3 flex flex-col justify-between gap-2 border border-(--border-default) bg-(--bg-surface)">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-(--text-primary)">
                  Singularity Attunement
                </span>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-(--bg-elevated) text-cyan-300">
                  Lv{attunementLevel}
                </span>
              </div>
              <p className="text-[11px] text-(--text-secondary) mt-0.5">
                +1% permanent global RP production per level (+
                {attunementLevel}% active).
              </p>
            </div>
            <button
              onClick={() => buyRepeatableCosmicSink('attunement')}
              disabled={operationPoints < attunementCost}
              className={[
                'w-full py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all select-none cursor-pointer',
                operationPoints >= attunementCost
                  ? 'border-cyan-400 bg-cyan-400 text-black hover:brightness-110 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              Upgrade ({attunementCost} PTS)
            </button>
          </div>

          <div className="card rounded-xl p-3 flex flex-col justify-between gap-2 border border-(--border-default) bg-(--bg-surface)">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-(--text-primary)">
                  Temporal Compression
                </span>
                <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-(--bg-elevated) text-purple-300">
                  Lv{Math.min(30, temporalLevel)}/30
                </span>
              </div>
              <p className="text-[11px] text-(--text-secondary) mt-0.5">
                +1s permanent anomaly duration to all events (+
                {Math.min(30, temporalLevel)}s active).
              </p>
            </div>
            <button
              onClick={() => buyRepeatableCosmicSink('temporal')}
              disabled={temporalCost <= 0 || operationPoints < temporalCost}
              className={[
                'w-full py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all select-none',
                temporalCost <= 0
                  ? 'border-(--status-success)/40 bg-(--status-success)/10 text-(--status-success) cursor-default'
                  : operationPoints >= temporalCost
                    ? 'border-purple-400 bg-purple-400 text-black hover:brightness-110 shadow-[0_0_10px_rgba(168,85,247,0.25)] cursor-pointer'
                    : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              {temporalCost <= 0
                ? 'MAX (+30s)'
                : `Upgrade (${temporalCost} PTS)`}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest px-1">
          Permanent Artifacts
        </p>
        <div className="flex flex-col gap-2">
          {OPERATION_ARTIFACTS.map((def) => {
            const owned = artifactsUnlocked.includes(
              def.id as OperationArtifactId
            )
            const canAfford = operationPoints >= def.cost && !owned

            return (
              <div
                key={def.id}
                className={[
                  'card rounded-xl p-2.5 flex items-center justify-between gap-2 border transition-colors',
                  owned
                    ? 'border-(--status-success)/40 bg-(--status-success)/5'
                    : 'border-(--border-default) bg-(--bg-surface)'
                ].join(' ')}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs font-bold text-(--text-primary)">
                      {def.name}
                    </span>
                    {owned && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10 text-(--status-success)">
                        OWNED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-(--text-secondary) leading-snug">
                    {def.effect}
                  </p>
                </div>

                {!owned && (
                  <button
                    onClick={() =>
                      buyOperationArtifact(def.id as OperationArtifactId)
                    }
                    disabled={!canAfford}
                    aria-label={`Acquire ${def.name} for ${def.cost} Operation Points`}
                    className={[
                      'shrink-0 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all select-none',
                      canAfford
                        ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer'
                        : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
                    ].join(' ')}
                  >
                    {def.cost} PTS
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
