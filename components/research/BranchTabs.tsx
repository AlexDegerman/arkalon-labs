'use client'

import type { ResearchBranch } from '@/types/game'

const BRANCHES: { id: ResearchBranch; label: string; shortLabel: string }[] = [
  { id: 'computation', label: 'Computation', shortLabel: 'C' },
  { id: 'energy', label: 'Energy', shortLabel: 'E' },
  { id: 'reality', label: 'Reality', shortLabel: 'R' },
  { id: 'arkalon', label: 'Arkalon', shortLabel: 'O' }
]

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
  return (
    <div
      className="grid grid-cols-4 gap-1 p-1 bg-(--bg-surface) border border-(--border-default) rounded-xl shrink-0"
      role="tablist"
      aria-label="Research branches"
    >
      {BRANCHES.map((branch) => {
        const isActive = activeBranch === branch.id
        const count = completedCounts[branch.id] ?? 0

        return (
          <button
            key={branch.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onBranchChange(branch.id)}
            className={[
              'flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-lg border font-mono transition-all cursor-pointer select-none',
              isActive
                ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent) shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-elevated)'
            ].join(' ')}
          >
            <span className="font-black text-sm">{branch.shortLabel}</span>
            <span className="text-[10px] hidden sm:inline tracking-wider font-bold">
              {branch.label}
            </span>
            <span className="text-[9px] text-(--text-secondary)/70">
              {count}/10
            </span>
          </button>
        )
      })}
    </div>
  )
}
