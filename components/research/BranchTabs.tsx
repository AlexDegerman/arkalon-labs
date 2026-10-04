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
      className="flex border-b border-(--border-default)"
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
              'flex-1 flex flex-col items-center gap-0.5 py-2 px-1 text-xs font-mono border-b-2 transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-(--border-accent)',
              isActive
                ? 'border-(--border-accent) text-(--text-accent)'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
          >
            <span className="font-bold text-sm">{branch.shortLabel}</span>
            <span className="hidden sm:inline text-[0.65rem] opacity-80">
              {branch.label}
            </span>
            {count > 0 && (
              <span className="text-[0.6rem] opacity-60">{count}/10</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
