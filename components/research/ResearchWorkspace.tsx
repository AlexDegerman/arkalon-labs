'use client'

import { useState, useMemo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import BranchTabs from '@/components/research/BranchTabs'
import NodeGrid from '@/components/research/NodeGrid'
import ActiveNodeDisplay from '@/components/research/ActiveNodeDisplay'
import QueueStrip from '@/components/research/QueueStrip'
import type { ResearchBranch } from '@/types/game'

export default function ResearchWorkspace() {
  const [activeBranch, setActiveBranch] =
    useState<ResearchBranch>('computation')

  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const activeSlots = useGameStore((s) => s.activeResearchSlots)
  // Slot count derived from the actual slot array length (updated on R3 / CF unlock)
  const slotCount = activeSlots.length

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
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Active research slots */}
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Active Research
        </p>
        {Array.from({ length: slotCount }, (_, i) => (
          <ActiveNodeDisplay key={i} slotIndex={i} />
        ))}
      </div>

      <div className="section-divider" />

      {/* Queue */}
      <QueueStrip />

      <div className="section-divider" />

      {/* Branch tabs and node grid */}
      <div className="flex flex-col gap-2">
        <BranchTabs
          activeBranch={activeBranch}
          onBranchChange={setActiveBranch}
          completedCounts={completedCounts}
        />
        <NodeGrid branch={activeBranch} />
      </div>
    </div>
  )
}
