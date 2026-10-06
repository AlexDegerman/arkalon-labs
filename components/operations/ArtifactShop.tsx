'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyOperationArtifact } from '@/app/stores/actions'
import { OPERATION_ARTIFACTS } from '@/lib/operationDefs'
import type { OperationArtifactId } from '@/types/game'

export default function ArtifactShop() {
  const operationPoints = useGameStore((s) => s.currentOperationPoints)
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)

  return (
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
                'card rounded-xl p-3 flex items-center justify-between gap-3 border transition-colors',
                owned
                  ? 'border-(--status-success)/40 bg-(--status-success)/5'
                  : 'border-(--border-default) bg-(--bg-surface)'
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-(--text-primary) truncate">
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
                  className={[
                    'shrink-0 px-3 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer',
                    canAfford
                      ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_10px_rgba(0,240,255,0.25)]'
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
  )
}
