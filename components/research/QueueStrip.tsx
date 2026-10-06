'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { dequeueResearch, reorderQueue } from '@/app/stores/actions'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { RESEARCH_QUEUE_MAX_BASE } from '@/constants/game'

export default function QueueStrip() {
  const queue = useGameStore((s) => s.researchQueue)
  const sc10Tiers = useGameStore(
    (s) => s.challengeRecords['SC10']?.completedTiers ?? 0
  )
  const queueMax = RESEARCH_QUEUE_MAX_BASE + sc10Tiers

  function handleRemove(nodeId: string) {
    dequeueResearch(nodeId)
  }

  function handleMoveUp(nodeId: string) {
    const idx = queue.indexOf(nodeId)
    if (idx > 0) reorderQueue(nodeId, idx - 1)
  }

  function handleMoveDown(nodeId: string) {
    const idx = queue.indexOf(nodeId)
    if (idx < queue.length - 1) reorderQueue(nodeId, idx + 1)
  }

  if (queue.length === 0) {
    return (
      <div className="flex items-center justify-between p-2.5 border border-dashed border-(--border-default) rounded-xl bg-(--bg-surface)/40">
        <p className="text-xs font-mono text-(--text-secondary)/70">
          Research queue empty · Click available nodes to queue
        </p>
        <span className="text-[10px] font-mono text-(--text-secondary)/60 font-bold uppercase">
          0/{queueMax} Slots
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between mb-0.5">
        <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Study Queue ({queue.length}/{queueMax})
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {queue.map((nodeId, idx) => {
          const node = RESEARCH_NODE_MAP[nodeId]
          if (!node) return null
          return (
            <div
              key={nodeId}
              className="flex items-center gap-2 card rounded-lg px-2.5 py-1.5 border border-(--border-default) bg-(--bg-surface) hover:border-(--border-default)/90 transition-colors"
            >
              <span className="text-xs font-mono font-bold text-(--text-secondary) w-4 shrink-0">
                {idx + 1}.
              </span>
              <span className="text-xs text-(--text-primary) font-medium flex-1 truncate">
                {node.label}
              </span>
              <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) shrink-0">
                {node.branch.slice(0, 1).toUpperCase()}
                {node.tier > 0 ? node.tier : 'inf'}
              </span>
              <div className="flex items-center gap-1 shrink-0 font-mono">
                <button
                  onClick={() => handleMoveUp(nodeId)}
                  disabled={idx === 0}
                  className="w-6 h-6 flex items-center justify-center rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-xs"
                  aria-label={`Move ${node.label} up`}
                >
                  ^
                </button>
                <button
                  onClick={() => handleMoveDown(nodeId)}
                  disabled={idx === queue.length - 1}
                  className="w-6 h-6 flex items-center justify-center rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-xs"
                  aria-label={`Move ${node.label} down`}
                >
                  ^
                </button>
                <button
                  onClick={() => handleRemove(nodeId)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer text-xs font-bold"
                  aria-label={`Remove ${node.label}`}
                >
                  X
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
