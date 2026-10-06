'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { startResearch } from '@/app/stores/actions'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import {
  isNodeAvailable,
  getNodeCost,
  getEffectiveStudyTime,
  getBranchNodes
} from '@/lib/researchNodes'
import { formatPoints, formatCountdown, infNodeCostAtLevel } from '@/lib/format'
import { INF_NODE_COST_SCALING } from '@/constants/research'
import type { ResearchBranch } from '@/types/game'
import InfNodePanel from './InfNodePanel'

interface NodeCardProps {
  nodeId: string
}

const NodeCard = memo(function NodeCard({ nodeId }: NodeCardProps) {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return null

  const researchPoints = useGameStore((s) => s.researchPoints)
  const isCompleted = useGameStore((s) =>
    s.completedResearchNodes.includes(nodeId)
  )
  const isActiveInSlot = useGameStore((s) =>
    s.activeResearchSlots.some((sl) => sl.nodeId === nodeId)
  )
  const isInQueue = useGameStore((s) => s.researchQueue.includes(nodeId))
  const infLevel = useGameStore((s) => s.infiniteResearchLevels[nodeId] ?? 0)
  const state = useGameStore.getState()
  const completed = isCompleted
  const active = isActiveInSlot
  const queued = isInQueue
  const available = isNodeAvailable(nodeId, state)
  const cost = getNodeCost(nodeId, useGameStore.getState())
  const canAffordNode = researchPoints >= cost

  const studyTime = node.isInfinite
    ? 0
    : getEffectiveStudyTime(nodeId, useGameStore.getState())

  const infNextCost = node.isInfinite
    ? infNodeCostAtLevel(
        node.cost,
        INF_NODE_COST_SCALING[nodeId] ?? 1.5,
        infLevel
      )
    : 0n

  function handleClick() {
    if (!available || completed) return
    if (active || queued) return
    startResearch(nodeId)
  }

  let borderClass = 'border-(--border-default)'
  let bgClass = 'bg-(--bg-surface)'
  let statusBadge: React.ReactNode = null

  if (completed && !node.isInfinite) {
    borderClass = 'border-(--status-success)/40'
    bgClass = 'bg-(--status-success)/5'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10">
        DONE
      </span>
    )
  } else if (active) {
    borderClass = 'border-(--border-accent)'
    bgClass = 'bg-(--border-accent)/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/30 bg-(--border-accent)/10 animate-pulse">
        ACTIVE
      </span>
    )
  } else if (queued) {
    borderClass = 'border-amber-400/40'
    bgClass = 'bg-amber-400/5'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-amber-400 px-1.5 py-0.2 rounded border border-amber-400/30 bg-amber-400/10">
        QUEUED
      </span>
    )
  } else if (!available) {
    borderClass = 'border-(--border-default)/50'
    bgClass = 'opacity-50 bg-(--bg-surface)/40 cursor-not-allowed'
  } else if (canAffordNode) {
    borderClass = 'border-(--border-accent)/60 hover:border-(--border-accent)'
  }

  return (
    <button
      onClick={handleClick}
      disabled={
        !available || (completed && !node.isInfinite) || active || queued
      }
      className={[
        'card rounded-xl p-2.5 sm:p-3 flex flex-col justify-between gap-1.5 text-left w-full border transition-all duration-150',
        available && !completed && !active && !queued
          ? 'hover:-translate-y-px cursor-pointer'
          : '',
        borderClass,
        bgClass
      ].join(' ')}
      aria-label={node.label}
    >
      <div className="flex items-start justify-between gap-1 w-full">
        <span className="text-xs sm:text-sm font-bold text-(--text-primary) leading-tight truncate">
          {node.label}
        </span>
        {statusBadge}
      </div>

      <p className="text-[11px] text-(--text-secondary) leading-snug line-clamp-2 my-auto">
        {node.effectDescription}
      </p>

      <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-(--border-default)/50 w-full">
        <span
          className={
            canAffordNode
              ? 'text-(--status-success) font-bold'
              : 'text-(--text-secondary)'
          }
        >
          {node.isInfinite
            ? `Lv${infLevel + 1}: ${formatPoints(infNextCost)} RP`
            : `${formatPoints(cost)} RP`}
        </span>
        {!node.isInfinite && studyTime > 0 && !completed && (
          <span className="text-(--text-secondary)">
            ⏱ {formatCountdown(studyTime)}
          </span>
        )}
      </div>
    </button>
  )
})

interface Props {
  branch: ResearchBranch
}

function NodeGrid({ branch }: Props) {
  const standardNodes = getBranchNodes(branch, false)

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {standardNodes.map((node) => (
          <NodeCard key={node.id} nodeId={node.id} />
        ))}
      </div>

      {/* Infinite node rendered by dedicated panel after tier 8 */}
      <InfNodePanel branch={branch} />
    </div>
  )
}

export default memo(NodeGrid)
