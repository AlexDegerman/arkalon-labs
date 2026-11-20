'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import BranchTabs from '@/components/research/BranchTabs'
import NodeGrid from '@/components/research/NodeGrid'
import ActiveNodeDisplay from '@/components/research/ActiveNodeDisplay'
import QueueStrip from '@/components/research/QueueStrip'
import type { ResearchBranch } from '@/types/game'
import { useShallow } from 'zustand/react/shallow'
import { getActiveSlotCount, getO6BypassStatus } from '@/lib/researchNodes'

export default function ResearchWorkspace() {
  const [activeBranch, setActiveBranch] =
    useState<ResearchBranch>('computation')
  const [viewMode, setViewMode] = useState<'grid' | 'tree'>('grid')

  const techMatrixDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.techMatrixDisabled ?? false
  )
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const activeSlots = useGameStore((s) => s.activeResearchSlots)
  const slotCount = useGameStore(getActiveSlotCount)
  const o6Bypass = useGameStore(useShallow(getO6BypassStatus))
  const visibleSlots = activeSlots.slice(0, slotCount)
  const queueUnlocked = useGameStore(
    (s) =>
      s.arUpgrades.auto_research_queue > 0 &&
      !s.activeChallengeRestrictions?.prestigeUpgradesDisabled
  )

  // Count completions per branch for tab badges
  const completedCounts = useMemo(() => {
    const counts: Record<ResearchBranch, number> = {
      computation: 0,
      energy: 0,
      reality: 0,
      arkalon: 0
    }
    for (const id of completedNodes) {
      if (id.startsWith('C') && !id.includes('_INF')) counts.computation++
      else if (id.startsWith('E') && !id.includes('_INF')) counts.energy++
      else if (id.startsWith('R') && !id.includes('_INF')) counts.reality++
      else if (id.startsWith('O') && !id.includes('_INF')) counts.arkalon++
    }
    return counts
  }, [completedNodes])

  return (
    <div className="flex flex-col gap-2 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {techMatrixDisabled && (
        <div className="p-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 font-mono text-xs text-amber-300">
          ⚠️ Research Matrix Offline. Disabled by active challenge constraints.
        </div>
      )}
      {/* Active Processing Slots */}
      <div className="flex flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            Active Processing Slots (
            {visibleSlots.filter((s) => s.nodeId !== null).length}/{slotCount})
          </p>
          {slotCount > 1 && (
            <span className="text-[9px] font-mono text-(--text-secondary)/70">
              Parallel slots require different branches
            </span>
          )}
        </div>
        <div className="flex flex-col gap-1">
          {visibleSlots.map((_, i) => (
            <ActiveNodeDisplay key={i} slotIndex={i} />
          ))}
        </div>
      </div>

      {/* Queue Strip - hidden until Auto-Research Queue is unlocked */}
      {queueUnlocked && (
        <div className="pt-2 border-t border-(--border-default)/60">
          <QueueStrip />
        </div>
      )}

      {/* Branch Navigation & Nodes View */}
      <div className="pt-2 border-t border-(--border-default)/60">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
                Research Branches
              </span>
              {o6Bypass.unlocked && (
                <span
                  className={[
                    'text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border',
                    o6Bypass.remaining > 0
                      ? 'border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300'
                      : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)/70'
                  ].join(' ')}
                >
                  O6 Bypass: {o6Bypass.remaining > 0 ? '1 Ready' : 'Used'}
                </span>
              )}
            </div>
            <div className="flex items-center p-0.5 rounded-lg border border-(--border-default) bg-(--bg-surface) shrink-0 font-mono text-[10px]">
              <button
                onClick={() => setViewMode('grid')}
                className={[
                  'px-2 py-1 rounded font-bold transition-all cursor-pointer',
                  viewMode === 'grid'
                    ? 'bg-(--border-accent) text-[#080c14] shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                    : 'text-(--text-secondary) hover:text-(--text-primary)'
                ].join(' ')}
              >
                ⊞ Grid
              </button>
              <button
                onClick={() => setViewMode('tree')}
                className={[
                  'px-2 py-1 rounded font-bold transition-all cursor-pointer',
                  viewMode === 'tree'
                    ? 'bg-(--border-accent) text-[#080c14] shadow-[0_0_8px_rgba(0,240,255,0.4)]'
                    : 'text-(--text-secondary) hover:text-(--text-primary)'
                ].join(' ')}
              >
                ☊ Tree
              </button>
            </div>
          </div>
          <BranchTabs
            activeBranch={activeBranch}
            onBranchChange={setActiveBranch}
            completedCounts={completedCounts}
          />
          <NodeGrid branch={activeBranch} viewMode={viewMode} />
        </div>
      </div>
    </div>
  )
}
