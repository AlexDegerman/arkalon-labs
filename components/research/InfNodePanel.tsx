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
    <div className="flex flex-col gap-2 mt-2">
      <div className="section-divider" />
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Infinite Node
        </p>
        <span className="text-[10px] font-mono text-(--text-accent) font-bold">
          x{scaling.toFixed(1)}/Level
        </span>
      </div>

      <div
        className={[
          'card rounded-xl p-3 flex flex-col gap-2.5 border transition-all',
          canAfford
            ? 'border-(--border-accent)/60 bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface)'
            : 'border-(--border-default) bg-(--bg-surface)'
        ].join(' ')}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
              {node.label}
            </span>
            <span className="text-[11px] text-(--text-secondary) mt-0.5">
              {node.effectDescription}
            </span>
          </div>
          <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded border border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent) shrink-0">
            Lv{level}
          </span>
        </div>

        {level < 5 && (
          <div className="flex gap-2 text-[10px] font-mono text-(--text-secondary)/60 pt-1 border-t border-(--border-default)/50 overflow-x-auto scrollbar-none">
            {[1, 2, 3].map((offset) => {
              const previewLevel = level + offset
              const previewCost = infNodeCostAtLevel(
                node.cost,
                scaling,
                previewLevel
              )
              return (
                <span key={offset} className="whitespace-nowrap">
                  Lv{previewLevel}: {formatPoints(previewCost)} RP
                </span>
              )
            })}
          </div>
        )}

        <button
          onClick={() => startResearch(nodeId)}
          disabled={!canAfford}
          className={[
            'w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer',
            canAfford
              ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
              : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          {canAfford
            ? `Upgrade to Lv${level + 1} (${formatPoints(cost)} RP)`
            : `Requires ${formatPoints(cost)} RP`}
        </button>
      </div>
    </div>
  )
}
