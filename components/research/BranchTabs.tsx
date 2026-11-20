'use client'

import { useGameStore } from '@/app/stores/gameStore';
import { RESEARCH_NODE_MAP } from '@/constants/research';
import { playSound } from '@/hooks/useSound'
import type { ResearchBranch } from '@/types/game'

const BRANCH_CONFIG: Record<
  ResearchBranch,
  { label: string; shortLabel: string; activeStyle: string; countStyle: string }
> = {
  computation: {
    label: 'Computation',
    shortLabel: 'C',
    activeStyle:
      'border-cyan-400 bg-cyan-400/10 text-cyan-300 shadow-[0_0_12px_rgba(0,240,255,0.25)]',
    countStyle: 'text-cyan-400'
  },
  energy: {
    label: 'Energy',
    shortLabel: 'E',
    activeStyle:
      'border-amber-400 bg-amber-400/10 text-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.25)]',
    countStyle: 'text-amber-400'
  },
  reality: {
    label: 'Reality',
    shortLabel: 'R',
    activeStyle:
      'border-purple-400 bg-purple-400/10 text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)]',
    countStyle: 'text-purple-400'
  },
  arkalon: {
    label: 'Arkalon',
    shortLabel: 'O',
    activeStyle:
      'border-fuchsia-400 bg-fuchsia-400/10 text-fuchsia-300 shadow-[0_0_12px_rgba(236,72,153,0.25)]',
    countStyle: 'text-fuchsia-400'
  }
}

interface Props {
  activeBranch: ResearchBranch
  onBranchChange: (branch: ResearchBranch) => void
  completedCounts: Record<ResearchBranch, number>
}

export default function BranchTabs({
  activeBranch,
  onBranchChange,
  completedCounts
}: Props) {
  const restrictions = useGameStore((s) => s.activeChallengeRestrictions)
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const activeSlots = useGameStore((s) => s.activeResearchSlots)
  const queue = useGameStore((s) => s.researchQueue)

  const activeSpecializedBranch = restrictions?.singleBranchOnly
    ? completedNodes.map((id) => RESEARCH_NODE_MAP[id]?.branch).find(Boolean) ||
      activeSlots
        .map((s) => (s.nodeId ? RESEARCH_NODE_MAP[s.nodeId]?.branch : null))
        .find(Boolean) ||
      queue.map((id) => RESEARCH_NODE_MAP[id]?.branch).find(Boolean)
    : null

  const branches: ResearchBranch[] = [
    'computation',
    'energy',
    'reality',
    'arkalon'
  ]

  return (
    <div
      className="@container grid grid-cols-4 gap-1 p-1 bg-(--bg-surface) border border-(--border-default) rounded-xl shrink-0"
      role="tablist"
      aria-label="Research branches"
    >
      {branches.map((branch) => {
        const config = BRANCH_CONFIG[branch]
        const isActive = activeBranch === branch
        const count = completedCounts[branch] ?? 0

        const isLockedByChallenge =
          (branch === 'energy' && restrictions?.energyBranchLocked) ||
          (branch === 'arkalon' && restrictions?.arkalonBranchLocked) ||
          (Boolean(activeSpecializedBranch) &&
            branch !== activeSpecializedBranch)

        return (
          <button
            key={branch}
            role="tab"
            aria-selected={isActive}
            onClick={() => {
              playSound('click')
              onBranchChange(branch)
            }}
            className={[
              'min-w-0 px-1 overflow-hidden flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg border font-mono transition-all cursor-pointer select-none relative',
              isActive
                ? config.activeStyle
                : isLockedByChallenge
                  ? 'border-transparent text-(--text-secondary)/40 opacity-50 hover:bg-(--bg-elevated)/40'
                  : 'border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)'
            ].join(' ')}
          >
            <div className="flex items-center gap-1">
              <span className="font-black text-sm">{config.shortLabel}</span>
              {isLockedByChallenge && (
                <span className="text-[10px]" aria-hidden="true">
                  🔒
                </span>
              )}
            </div>
            <span className="text-[10px] hidden @[290px]:block max-w-full truncate @[380px]:tracking-wider font-bold">
              {config.label}
            </span>
            <span
              className={`text-[9px] ${isActive ? config.countStyle : 'text-(--text-secondary)/70'}`}
            >
              {count}/10
            </span>
          </button>
        )
      })}
    </div>
  )
}
