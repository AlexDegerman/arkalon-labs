'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { startResearch } from '@/app/stores/gameActions'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import {
  getBranchNodesAll,
  isNodeAvailable,
  isNodeCompleted,
  isNodeActive,
  isNodeQueued,
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

  const state = useGameStore.getState()
  const researchPoints = useGameStore((s) => s.researchPoints)
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const activeSlots = useGameStore((s) => s.activeResearchSlots)
  const queue = useGameStore((s) => s.researchQueue)
  const infLevels = useGameStore((s) => s.infiniteResearchLevels)

  const completed = completedNodes.includes(nodeId)
  const active = activeSlots.some((s) => s.nodeId === nodeId)
  const queued = queue.includes(nodeId)
  const available = isNodeAvailable(nodeId, useGameStore.getState())

  const cost = getNodeCost(nodeId, useGameStore.getState())
  const canAffordNode = researchPoints >= cost

  const studyTime = node.isInfinite
    ? 0
    : getEffectiveStudyTime(nodeId, useGameStore.getState())

  const infLevel = node.isInfinite ? (infLevels[nodeId] ?? 0) : 0
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

  let borderClass = 'border-[var(--border-default)]'
  let bgClass = ''
  let statusLabel = ''

  if (completed && !node.isInfinite) {
    borderClass = 'border-[var(--status-success)]'
    bgClass = 'bg-[var(--status-success)]/5'
    statusLabel = 'Complete'
  } else if (active) {
    borderClass = 'border-[var(--border-accent)] border-pulse'
    statusLabel = 'Studying'
  } else if (queued) {
    borderClass = 'border-[var(--status-warning)]'
    statusLabel = 'Queued'
  } else if (!available) {
    borderClass = 'border-[var(--status-locked)]'
    bgClass = 'opacity-50'
  } else if (canAffordNode) {
    borderClass = 'border-[var(--status-success)]'
  }

  return (
    <button
      onClick={handleClick}
      disabled={
        !available || (completed && !node.isInfinite) || active || queued
      }
      className={[
        'card rounded-lg p-2.5 flex flex-col gap-1.5 text-left w-full',
        'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
        'disabled:cursor-default',
        borderClass,
        bgClass,
        available && !completed && !active && !queued
          ? 'hover:border-(--text-secondary) cursor-pointer'
          : ''
      ].join(' ')}
      aria-label={`${node.label}${statusLabel ? ` - ${statusLabel}` : ''}`}
    >
      {/* Header row */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-semibold text-(--text-primary) leading-tight truncate">
          {node.label}
        </span>
        {statusLabel && (
          <span
            className={[
              'chip shrink-0 text-[0.6rem]',
              completed && !node.isInfinite
                ? 'border-(--status-success) text-(--status-success)'
                : active
                  ? 'border-(--border-accent) text-(--border-accent)'
                  : queued
                    ? 'border-(--status-warning) text-(--status-warning)'
                    : ''
            ].join(' ')}
          >
            {statusLabel}
          </span>
        )}
      </div>

      {/* Effect */}
      <p className="text-[0.65rem] text-(--text-secondary) leading-snug line-clamp-2">
        {node.effectDescription}
      </p>

      {/* Cost / time row */}
      <div className="flex items-center justify-between gap-1 mt-auto">
        <span
          className={[
            'text-[0.65rem] font-mono',
            canAffordNode
              ? 'text-(--status-success)'
              : 'text-(--text-secondary)'
          ].join(' ')}
        >
          {node.isInfinite
            ? `Lv${infLevel + 1}: ${formatPoints(infNextCost)} RP`
            : `${formatPoints(cost)} RP`}
        </span>
        {!node.isInfinite && studyTime > 0 && !completed && (
          <span className="text-[0.65rem] font-mono text-(--text-secondary)">
            {formatCountdown(studyTime)}
          </span>
        )}
        {node.isInfinite && (
          <span className="text-[0.65rem] font-mono text-(--text-secondary)">
            Lv{infLevel}
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
  // Only show standard (non-infinite) nodes in the grid
  const standardNodes = getBranchNodes(branch, false)

  return (
    <div className="flex flex-col gap-3">
      {/* Standard nodes 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
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
