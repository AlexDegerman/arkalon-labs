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
      <div className="flex items-center gap-2 p-2 border border-dashed border-(--border-default) rounded">
        <p className="text-xs font-mono text-(--text-secondary)">
          Queue empty - click a node to queue it ({queueMax} slots)
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Queue ({queue.length}/{queueMax})
        </span>
      </div>
      <div className="flex flex-col gap-1">
        {queue.map((nodeId, idx) => {
          const node = RESEARCH_NODE_MAP[nodeId]
          if (!node) return null
          return (
            <div
              key={nodeId}
              className="flex items-center gap-2 card rounded px-2 py-1.5"
            >
              <span className="text-xs font-mono text-(--text-secondary) w-4 shrink-0">
                {idx + 1}.
              </span>
              <span className="text-xs text-(--text-primary) flex-1 truncate">
                {node.label}
              </span>
              <span className="chip border-(--border-default) text-(--text-secondary) shrink-0 text-[0.6rem]">
                {node.branch.slice(0, 1).toUpperCase()}
                {node.tier > 0 ? node.tier : 'inf'}
              </span>
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  onClick={() => handleMoveUp(nodeId)}
                  disabled={idx === 0}
                  className="w-5 h-5 flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded text-xs"
                  aria-label={`Move ${node.label} up in queue`}
                >
                  ^
                </button>
                <button
                  onClick={() => handleMoveDown(nodeId)}
                  disabled={idx === queue.length - 1}
                  className="w-5 h-5 flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-30 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded text-xs"
                  aria-label={`Move ${node.label} down in queue`}
                  style={{ transform: 'rotate(180deg)' }}
                >
                  ^
                </button>
                <button
                  onClick={() => handleRemove(nodeId)}
                  className="w-5 h-5 flex items-center justify-center text-(--text-secondary) hover:text-[#ef4444] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded text-xs"
                  aria-label={`Remove ${node.label} from queue`}
                >
                  x
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
