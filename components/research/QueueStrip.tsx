'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import {
  dequeueResearch,
  reorderQueue,
  applyQueuePreset,
  startQueuedResearch
} from '@/app/stores/actions/researchActions'
import {
  getResearchQueueMax,
  getActiveSlotCount,
  getNodeCost,
  isNodeAvailable
} from '@/lib/researchNodes'
import { formatPointsShort } from '@/lib/format'

export default function QueueStrip() {
  const queue = useGameStore((s) => s.researchQueue)
  const queueMax = useGameStore(getResearchQueueMax)
  const autoEnabled = useGameStore((s) => s.automation.autoResearchQueue)
  const activeSlots = useGameStore((s) => s.activeResearchSlots)
  const slotCount = useGameStore(getActiveSlotCount)
  const rp = useGameStore((s) => s.researchPoints)

  const visibleSlots = activeSlots.slice(0, slotCount)
  const hasEmptySlot = visibleSlots.some((s) => !s.nodeId)
  const activeBranches = new Set(
    visibleSlots
      .filter((s) => s.nodeId !== null)
      .map((s) => RESEARCH_NODE_MAP[s.nodeId!]?.branch)
      .filter(Boolean)
  )

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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between flex-wrap gap-1.5">
        <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Study Queue ({queue.length}/{queueMax})
        </span>
        <div className="flex items-center gap-1 font-mono text-[9px]">
          <button
            onClick={() => applyQueuePreset('shortest')}
            title="Auto-queue the shortest duration available nodes"
            className="px-2 py-0.5 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer uppercase font-bold"
          >
            ⚡ Shortest
          </button>
          <button
            onClick={() => applyQueuePreset('cheapest')}
            title="Auto-queue the cheapest available nodes"
            className="px-2 py-0.5 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer uppercase font-bold"
          >
            💰 Cheapest
          </button>
          <button
            onClick={() => applyQueuePreset('tier')}
            title="Auto-queue lowest tier prerequisite nodes first"
            className="px-2 py-0.5 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-cyan-300 hover:border-cyan-400 transition-colors cursor-pointer uppercase font-bold"
          >
            🎯 Rush Tier
          </button>
          {queue.length > 0 && (
            <button
              onClick={() => applyQueuePreset('clear')}
              title="Clear all nodes from the queue"
              className="px-2 py-0.5 rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer uppercase font-bold"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {queue.length > 0 && !autoEnabled && (
        <p className="text-[10px] font-mono text-amber-400">
          Auto-start paused in Prestige Automation. Click ▶ to start manually.
        </p>
      )}

      {queue.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {queue.map((nodeId, idx) => {
            const node = RESEARCH_NODE_MAP[nodeId]
            if (!node) return null
            const storeSnap = useGameStore.getState()
            const cost = getNodeCost(nodeId, storeSnap)
            const prereqReady = isNodeAvailable(nodeId, storeSnap)
            const branchBusy = activeBranches.has(node.branch)
            const canStartNow =
              hasEmptySlot && !branchBusy && prereqReady && rp >= cost

            let statusLabel = 'Ready'
            let statusCls =
              'border-(--status-success)/40 bg-(--status-success)/10 text-(--status-success)'
            if (!hasEmptySlot) {
              statusLabel = 'Slot full'
              statusCls =
                'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
            } else if (branchBusy) {
              statusLabel = 'Branch busy'
              statusCls = 'border-amber-400/40 bg-amber-400/10 text-amber-300'
            } else if (!prereqReady) {
              statusLabel = 'Prereq pending'
              statusCls = 'border-amber-400/40 bg-amber-400/10 text-amber-300'
            } else if (rp < cost) {
              statusLabel = `Needs ${formatPointsShort(cost)} RP`
              statusCls = 'border-rose-400/40 bg-rose-400/10 text-rose-300'
            }

            return (
              <div
                key={nodeId}
                className="flex items-center gap-2 card rounded-lg px-2.5 py-1.5 border border-(--border-default) bg-(--bg-surface) hover:border-(--border-default)/90 transition-colors"
              >
                <span className="text-xs font-mono font-bold text-(--text-secondary) w-4 shrink-0">
                  {idx + 1}.
                </span>
                <span className="text-xs text-(--text-primary) font-medium flex-1 leading-tight wrap-break-word">
                  {node.label}
                </span>
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border shrink-0 ${statusCls}`}
                >
                  {statusLabel}
                </span>
                <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) shrink-0">
                  {node.branch.slice(0, 1).toUpperCase()}
                  {node.tier > 0 ? node.tier : 'inf'}
                </span>
                <div className="flex items-center gap-1 shrink-0 font-mono">
                  {hasEmptySlot && (
                    <button
                      onClick={() => startQueuedResearch(nodeId)}
                      disabled={!canStartNow}
                      title="Start study now"
                      className="w-6 h-6 flex items-center justify-center rounded bg-(--status-success)/10 border border-(--status-success)/40 text-(--status-success) hover:bg-(--status-success)/20 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-xs"
                      aria-label={`Start ${node.label}`}
                    >
                      ▶
                    </button>
                  )}
                  <button
                    onClick={() => handleMoveUp(nodeId)}
                    disabled={idx === 0}
                    className="w-6 h-6 flex items-center justify-center rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-xs"
                    aria-label={`Move ${node.label} up`}
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => handleMoveDown(nodeId)}
                    disabled={idx === queue.length - 1}
                    className="w-6 h-6 flex items-center justify-center rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) hover:text-(--text-primary) disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer text-xs"
                    aria-label={`Move ${node.label} down`}
                  >
                    ▼
                  </button>
                  <button
                    onClick={() => handleRemove(nodeId)}
                    className="w-6 h-6 flex items-center justify-center rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 cursor-pointer text-xs font-bold"
                    aria-label={`Remove ${node.label}`}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
