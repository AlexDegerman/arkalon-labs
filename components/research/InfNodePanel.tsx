'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { startResearch } from '@/app/stores/actions'
import { RESEARCH_NODES, INF_NODE_COST_SCALING } from '@/constants/research'
import { getNodeCost, isNodeAvailable } from '@/lib/researchNodes'
import { formatPoints, infNodeCostAtLevel } from '@/lib/format'
import type { ResearchBranch } from '@/types/game'

interface Props {
  branch: ResearchBranch
}

const INF_NODE_IDS: Record<ResearchBranch, string> = {
  computation: 'C_INF',
  energy: 'E_INF',
  reality: 'R_INF',
  arkalon: 'O_INF'
}

export default function InfNodePanel({ branch }: Props) {
  const nodeId = INF_NODE_IDS[branch]
  const node = RESEARCH_NODES.find((n) => n.id === nodeId)
  if (!node) return null

  const state = useGameStore.getState()
  const infLevels = useGameStore((s) => s.infiniteResearchLevels)
  const researchPoints = useGameStore((s) => s.researchPoints)
  const completedNodes = useGameStore((s) => s.completedResearchNodes)

  const level = infLevels[nodeId] ?? 0
  const available = isNodeAvailable(nodeId, useGameStore.getState())

  if (!available) return null

  const scaling = INF_NODE_COST_SCALING[nodeId] ?? 1.5
  const cost = getNodeCost(nodeId, state)
  const canAfford = researchPoints >= cost
  const prereqComplete = node.prerequisiteId
    ? completedNodes.includes(node.prerequisiteId)
    : true

  if (!prereqComplete) return null

  return (
    <div className="flex flex-col gap-2">
      <div className="section-divider" />
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Infinite Node
      </p>
      <div
        className={[
          'card rounded-lg p-3 flex flex-col gap-2',
          canAfford ? 'border-(--text-accent)' : ''
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs font-semibold text-(--text-primary) truncate">
              {node.label}
            </span>
            <span className="text-[0.65rem] text-(--text-secondary)">
              {node.effectDescription}
            </span>
          </div>
          <span className="chip border-(--border-accent) text-(--text-accent) shrink-0 text-[0.6rem]">
            Lv{level}
          </span>
        </div>

        {/* Cost and cost scaling info */}
        <div className="flex items-center justify-between text-[0.65rem] font-mono">
          <span className="text-(--text-secondary)">
            x{scaling.toFixed(1)}/level
          </span>
          <span
            className={
              canAfford ? 'text-(--status-success)' : 'text-(--text-secondary)'
            }
          >
            {formatPoints(cost)} RP
          </span>
        </div>

        {/* Next few level costs preview */}
        {level < 5 && (
          <div className="flex gap-2 text-[0.6rem] font-mono">
            {[1, 2, 3].map((offset) => {
              const previewLevel = level + offset
              const previewCost = infNodeCostAtLevel(
                node.cost,
                scaling,
                previewLevel
              )
              return (
                <span
                  key={offset}
                  className="text-(--text-secondary) opacity-60"
                >
                  Lv{previewLevel}: {formatPoints(previewCost)}
                </span>
              )
            })}
          </div>
        )}

        <button
          onClick={() => startResearch(nodeId)}
          disabled={!canAfford}
          className={[
            'w-full py-1.5 text-xs font-mono rounded border transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
            canAfford
              ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
              : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          Purchase Lv{level + 1}
        </button>
      </div>
    </div>
  )
}
