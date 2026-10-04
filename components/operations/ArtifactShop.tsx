'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyOperationArtifact } from '@/app/stores/gameActions'
import { OPERATION_ARTIFACTS } from '@/lib/operationDefs'
import type { OperationArtifactId } from '@/types/game'

export default function ArtifactShop() {
  const operationPoints = useGameStore((s) => s.currentOperationPoints)
  const artifactsUnlocked = useGameStore((s) => s.operationArtifactsUnlocked)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
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
                'card rounded-lg p-3 flex items-start gap-3',
                owned ? 'border-(--status-success)' : ''
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-(--text-primary) truncate">
                    {def.name}
                  </span>
                  {owned && (
                    <span className="chip border-(--status-success) text-(--status-success) text-[0.6rem] shrink-0">
                      OWNED
                    </span>
                  )}
                </div>
                <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
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
                    'shrink-0 px-2 py-1 text-[0.65rem] font-mono rounded border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                    canAfford
                      ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                      : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  {def.cost} pts
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
