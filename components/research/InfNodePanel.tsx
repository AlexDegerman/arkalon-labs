'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { RESEARCH_NODES, INF_NODE_COST_SCALING } from '@/constants/research'
import { getNodeCost, isNodeAvailable } from '@/lib/researchNodes'
import { formatPoints, infNodeCostAtLevel } from '@/lib/format'
import type { ResearchBranch } from '@/types/game'
import {
  buyInfiniteResearchBulk,
  startResearch
} from '@/app/stores/actions/researchActions'
import { useCallback } from 'react'

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

  const infLevels = useGameStore((s) => s.infiniteResearchLevels)
  const researchPoints = useGameStore((s) => s.researchPoints)
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const cost = useGameStore(
    useCallback((s) => (nodeId ? getNodeCost(nodeId, s) : 0n), [nodeId])
  )
  const available = useGameStore(
    useCallback((s) => (nodeId ? isNodeAvailable(nodeId, s) : false), [nodeId])
  )

  if (!node || !available) return null

  const level = infLevels[nodeId] ?? 0

  const scaling = INF_NODE_COST_SCALING[nodeId] ?? 1.5
  const maxCap = nodeId === 'R_INF' ? 299 : Number.MAX_SAFE_INTEGER
  const atCap = level >= maxCap
  const canAfford = !atCap && researchPoints >= cost
  const prereqComplete = node.prerequisiteId
    ? completedNodes.includes(node.prerequisiteId)
    : true

  if (!prereqComplete) return null

  function getBulkQuote(maxLevels: number): { levels: number; cost: bigint } {
    if (atCap) return { levels: 0, cost: 0n }
    const limit = Math.min(maxLevels, maxCap - level)
    const scaleNum = BigInt(Math.round(scaling * 1000))
    let rem = researchPoints
    let levels = 0
    let total = 0n
    let stepCost = cost
    for (let i = 0; i < limit; i++) {
      if (rem < stepCost) break
      rem -= stepCost
      total += stepCost
      levels++
      stepCost = (stepCost * scaleNum) / 1000n
    }
    return { levels, cost: total }
  }

  const bulk10 = getBulkQuote(10)
  const bulkMax = getBulkQuote(300)

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
              const rawBaseAtCurrent = infNodeCostAtLevel(
                node.cost,
                scaling,
                level
              )
              const rawPreview = infNodeCostAtLevel(
                node.cost,
                scaling,
                previewLevel
              )
              const previewCost =
                rawBaseAtCurrent > 0n
                  ? (rawPreview * cost) / rawBaseAtCurrent
                  : rawPreview
              return (
                <span key={offset} className="whitespace-nowrap">
                  Lv{previewLevel}: {formatPoints(previewCost)} RP
                </span>
              )
            })}
          </div>
        )}

        {atCap ? (
          <div className="w-full py-2 text-center text-xs font-mono font-bold uppercase tracking-wider rounded-lg border border-(--status-success)/40 bg-(--status-success)/10 text-(--status-success)">
            95% Cap Reached (Lv{level})
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => startResearch(nodeId)}
              disabled={!canAfford}
              className={[
                'flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer',
                canAfford
                  ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
              ].join(' ')}
            >
              {canAfford
                ? `+1 Lv${level + 1} (${formatPoints(cost)} RP)`
                : `Requires ${formatPoints(cost)} RP`}
            </button>
            <button
              onClick={() => buyInfiniteResearchBulk(nodeId, 10)}
              disabled={bulk10.levels <= 0}
              title={
                bulk10.levels > 0
                  ? `Buy +${bulk10.levels} levels for ${formatPoints(bulk10.cost)} RP`
                  : 'Not enough RP'
              }
              className={[
                'px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer shrink-0',
                bulk10.levels > 0
                  ? 'border-(--border-accent)/70 bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              +10
            </button>
            <button
              onClick={() => buyInfiniteResearchBulk(nodeId, 'max')}
              disabled={bulkMax.levels <= 0}
              title={
                bulkMax.levels > 0
                  ? `Buy +${bulkMax.levels} levels for ${formatPoints(bulkMax.cost)} RP`
                  : 'Not enough RP'
              }
              className={[
                'px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer shrink-0',
                bulkMax.levels > 0
                  ? 'border-(--border-accent)/70 bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              ].join(' ')}
            >
              MAX{bulkMax.levels > 0 ? ` (${bulkMax.levels})` : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
