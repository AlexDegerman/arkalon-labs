'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { formatCountdown, formatCompletionTime } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import { getEffectiveStudyTime } from '@/lib/researchNodes'

interface Props {
  slotIndex: number
}

function ActiveNodeDisplay({ slotIndex }: Props) {
  const slot = useGameStore((s) => s.activeResearchSlots[slotIndex])
  const completedNodes = useGameStore((s) => s.completedResearchNodes)

  if (!slot?.nodeId) {
    return (
      <div className="card rounded-lg p-3 flex items-center justify-center min-h-18 border-dashed">
        <p className="text-xs font-mono text-(--text-secondary)">
          Slot {slotIndex + 1} - idle
        </p>
      </div>
    )
  }

  const node = RESEARCH_NODE_MAP[slot.nodeId]
  if (!node) return null

  // Compute original study time to derive progress
  const state = useGameStore.getState()
  const originalTime = getEffectiveStudyTime(slot.nodeId, {
    ...state,
    completedResearchNodes: completedNodes.filter((id) => id !== slot.nodeId)
  })

  const progress =
    originalTime > 0 ? Math.max(0, 1 - slot.timerRemaining / originalTime) : 1

  const completionTime = formatCompletionTime(Date.now(), slot.timerRemaining)

  return (
    <div className="card rounded-lg p-3 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="status-dot status-dot-active dot-pulse shrink-0" />
          <span className="text-xs font-semibold text-(--text-primary) truncate">
            {node.label}
          </span>
          <span className="chip border-(--border-default) text-(--text-secondary) shrink-0 uppercase">
            {node.branch.slice(0, 1).toUpperCase()}
            {node.tier > 0 ? node.tier : 'inf'}
          </span>
        </div>
        <span className="text-xs font-mono text-(--text-accent) shrink-0">
          {formatCountdown(slot.timerRemaining)}
        </span>
      </div>

      <ProgressBar progress={progress} variant="default" height={4} />

      <div className="flex items-center justify-between">
        <span className="text-xs text-(--text-secondary) truncate">
          {node.effectDescription}
        </span>
        <span className="text-xs font-mono text-(--text-secondary) shrink-0 ml-2">
          {completionTime}
        </span>
      </div>
    </div>
  )
}

export default memo(ActiveNodeDisplay)
