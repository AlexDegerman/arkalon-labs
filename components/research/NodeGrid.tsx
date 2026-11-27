'use client'

import { memo, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import {
  isNodeAvailable,
  isNodeCompleted,
  isNodeActive,
  isNodeQueued,
  getNodeCost,
  getEffectiveStudyTime,
  getBranchNodes
} from '@/lib/researchNodes'
import {
  formatPoints,
  formatPointsShort,
  formatCountdown,
  infNodeCostAtLevel,
  getAmountColor
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import { INF_NODE_COST_SCALING } from '@/constants/research'
import type { ResearchBranch } from '@/types/game'
import InfNodePanel from './InfNodePanel'
import { startResearch } from '@/app/stores/actions/researchActions'

interface NodeCardProps {
  nodeId: string
}

const NodeCard = memo(function NodeCard({ nodeId }: NodeCardProps) {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const node = RESEARCH_NODE_MAP[nodeId]

  const researchPoints = useGameStore((s) => s.researchPoints)
  const completed = useGameStore((s) =>
    s.completedResearchNodes.includes(nodeId)
  )
  const available = useGameStore(
    useCallback((s) => isNodeAvailable(nodeId, s), [nodeId])
  )
  const prereqCompleted = useGameStore((s) =>
    !node?.prerequisiteId
      ? true
      : s.completedResearchNodes.includes(node.prerequisiteId)
  )
  const isO6Bypass = available && !completed && !prereqCompleted
  const active = useGameStore((s) =>
    s.activeResearchSlots.some((sl) => sl.nodeId === nodeId)
  )
  const activeTimer = useGameStore((s) => {
    const sl = s.activeResearchSlots.find((s2) => s2.nodeId === nodeId)
    return sl && sl.timerRemaining > 0 ? sl.timerRemaining : -1
  })
  const queued = useGameStore((s) => s.researchQueue.includes(nodeId))
  const infLevel = useGameStore((s) => s.infiniteResearchLevels[nodeId] ?? 0)
  const cost = useGameStore(
    useCallback((s) => getNodeCost(nodeId, s), [nodeId])
  )
  const studyTime = useGameStore(
    useCallback(
      (s) => (node?.isInfinite ? 0 : getEffectiveStudyTime(nodeId, s)),
      [nodeId, node?.isInfinite]
    )
  )
  const canAffordNode = researchPoints >= cost

  if (!node) return null

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
    borderClass = 'border-slate-700/50'
    bgClass = 'bg-slate-900/20'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-slate-400 px-1.5 py-0.2 rounded border border-slate-700/60 bg-slate-800/50">
        ✓ DONE
      </span>
    )
  } else if (active) {
    borderClass = 'border-(--border-accent)'
    bgClass = 'bg-(--border-accent)/10 shadow-[0_0_12px_rgba(0,240,255,0.15)]'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-(--border-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/30 bg-(--border-accent)/10">
        {activeTimer >= 0 ? `${formatCountdown(activeTimer)}` : 'ACTIVE'}
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
    borderClass =
      'border-(--status-success)/70 hover:border-(--status-success) shadow-[0_0_14px_rgba(57,255,138,0.22)]'
    bgClass = 'bg-(--status-success)/5'
    statusBadge = (
      <span className="text-[9px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded border border-(--status-success)/40 bg-(--status-success)/10 shrink-0">
        READY
      </span>
    )
  }

  return (
    <button
      onClick={handleClick}
      disabled={
        !available || (completed && !node.isInfinite) || active || queued
      }
      className={[
        'card rounded-xl p-2 sm:p-2.5 flex flex-col justify-between gap-1 text-left w-full border transition-all duration-150',
        available && !completed && !active && !queued ? 'cursor-pointer' : '',
        borderClass,
        bgClass
      ].join(' ')}
      aria-label={node.label}
    >
      <div className="flex items-start justify-between gap-1.5 w-full">
        <span className="text-xs sm:text-sm font-bold text-(--text-primary) leading-snug">
          {node.label}
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {isO6Bypass && (
            <span className="text-[8px] font-mono font-black px-1 py-0.2 rounded border border-fuchsia-400/50 bg-fuchsia-400/15 text-fuchsia-300">
              O6 BYPASS
            </span>
          )}
          {statusBadge}
        </div>
      </div>

      <p
        title={node.effectDescription}
        className="text-[11px] text-(--text-secondary) leading-snug my-auto"
      >
        {node.effectDescription}
      </p>

      {!available && !completed && node.prerequisiteId && (
        <span className="text-[10px] font-mono text-amber-400/80">
          Requires:{' '}
          {RESEARCH_NODE_MAP[node.prerequisiteId]?.label ?? node.prerequisiteId}
        </span>
      )}

      <div className="flex items-center justify-between gap-x-2 gap-y-1 flex-wrap text-[11px] font-mono pt-1 border-t border-(--border-default)/50 w-full">
        <span
          className={[
            'font-bold',
            getAmountColor(cost) || 'text-(--text-primary)',
            !available || !canAffordNode ? 'opacity-55' : ''
          ].join(' ')}
        >
          {node.isInfinite
            ? `Lv${infLevel + 1}: ${fmt(infNextCost)} RP`
            : `${fmt(cost)} RP`}
        </span>
        {!node.isInfinite && studyTime > 0 && !completed && (
          <span className="text-(--text-secondary) whitespace-nowrap shrink-0">
            ⏱ {formatCountdown(studyTime)}
          </span>
        )}
      </div>
    </button>
  )
})

interface Props {
  branch: ResearchBranch
  viewMode?: 'grid' | 'tree'
}

function NodeTreeItem({
  nodeId,
  isLast
}: {
  nodeId: string
  isLast: boolean
}) {
  const isCompleted = useGameStore((s) =>
    s.completedResearchNodes.includes(nodeId)
  )

  return (
    <div className="flex flex-col items-center w-full">
      <div className="w-full">
        <NodeCard nodeId={nodeId} />
      </div>
      {!isLast && (
        <div className="flex flex-col items-center my-0.5" aria-hidden="true">
          <div
            className={[
              'w-0.5 h-4 transition-all duration-300',
              isCompleted
                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]'
                : 'bg-(--border-default)/50'
            ].join(' ')}
          />
          <div
            className={[
              'w-2 h-2 rotate-45 border-r border-b -mt-1',
              isCompleted
                ? 'border-cyan-400 bg-cyan-400/40 shadow-[0_0_6px_rgba(0,240,255,0.8)]'
                : 'border-(--border-default)/50'
            ].join(' ')}
          />
        </div>
      )}
    </div>
  )
}

function NodeGrid({ branch, viewMode = 'grid' }: Props) {
  const orderedNodeIds = useGameStore(
    useShallow(
      useCallback(
        (s) => {
          const nodes = getBranchNodes(branch, false)
          if (viewMode === 'tree') return nodes.map((n) => n.id)

          const getPriority = (nodeId: string): number => {
            if (isNodeCompleted(nodeId, s)) return 3
            if (isNodeActive(nodeId, s) || isNodeQueued(nodeId, s)) return 1
            if (!isNodeAvailable(nodeId, s)) return 2
            const cost = getNodeCost(nodeId, s)
            return s.researchPoints >= cost ? 0 : 1
          }

          return [...nodes]
            .sort((a, b) => {
              const pa = getPriority(a.id)
              const pb = getPriority(b.id)
              if (pa !== pb) return pa - pb
              return a.tier - b.tier
            })
            .map((n) => n.id)
        },
        [branch, viewMode]
      )
    )
  )

  if (viewMode === 'tree') {
    return (
      <div className="flex flex-col items-center gap-1 w-full max-w-xl mx-auto py-1">
        {orderedNodeIds.map((nodeId, i) => (
          <NodeTreeItem
            key={nodeId}
            nodeId={nodeId}
            isLast={i === orderedNodeIds.length - 1}
          />
        ))}

        <div className="w-full mt-2">
          <InfNodePanel branch={branch} />
        </div>
      </div>
    )
  }

  return (
    <div className="@container flex flex-col gap-2">
      <div className="grid grid-cols-1 @[360px]:grid-cols-2 gap-1.5">
        {orderedNodeIds.map((nodeId) => (
          <NodeCard key={nodeId} nodeId={nodeId} />
        ))}
      </div>

      {/* Infinite node rendered by dedicated panel after tier 8 */}
      <InfNodePanel branch={branch} />
    </div>
  )
}

export default memo(NodeGrid)