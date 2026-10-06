'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import { CHALLENGE_DISPLAY } from '@/constants/challenges'
import type { ChallengeCategory } from '@/constants/challenges'

const CATEGORY_TABS: { id: ChallengeCategory; label: string }[] = [
  { id: 'standard', label: 'Standard (T1)' },
  { id: 'advanced', label: 'Advanced (T2)' },
  { id: 'extreme', label: 'Extreme (T3)' }
]

export default function ChallengeWorkspace() {
  const [activeCategory, setActiveCategory] =
    useState<ChallengeCategory>('standard')

  const tier1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const tier2Done = useGameStore((s) => s.stats.totalPrestigesTier2 > 0)
  const tier3Done = useGameStore((s) => s.stats.totalPrestigesTier3 > 0)
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)

  const challenges = CHALLENGE_DISPLAY.filter(
    (c) => c.category === activeCategory
  )

  const categoryUnlocked: Record<ChallengeCategory, boolean> = {
    standard: tier1Done,
    advanced: tier2Done,
    extreme: tier3Done
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--bg-primary)/40">
      {/* Active challenge persistent alert bar */}
      {activeChallengeId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-(--border-accent)/10 border-b border-(--border-accent) shrink-0 font-mono text-xs">
          <span className="w-2 h-2 rounded-full bg-(--border-accent) animate-pulse shrink-0" />
          <span className="text-(--text-accent) truncate">
            Active Constraint:{' '}
            <strong className="text-white">
              {CHALLENGE_DISPLAY.find((c) => c.id === activeChallengeId)
                ?.name ?? activeChallengeId}
            </strong>
          </span>
        </div>
      )}

      {/* Category Selection Tabs */}
      <div
        className="grid grid-cols-3 gap-1 p-1 bg-(--bg-surface) border-b border-(--border-default) shrink-0"
        role="tablist"
      >
        {CATEGORY_TABS.map((tab) => {
          const unlocked = categoryUnlocked[tab.id]
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(tab.id)}
              className={[
                'py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none text-center',
                isActive
                  ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent)'
                  : !unlocked
                    ? 'border-transparent text-(--text-secondary)/40 opacity-40 cursor-not-allowed'
                    : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              {!unlocked && (
                <span className="mr-1 text-[0.6rem]" aria-hidden="true">
                  &#x1F512;
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Challenge List */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-3 sm:p-4 flex flex-col gap-3">
        {!categoryUnlocked[activeCategory] ? (
          <div className="card rounded-xl p-8 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center">
            <p className="text-xs font-mono text-(--text-secondary)">
              {activeCategory === 'advanced'
                ? 'Complete your first Timeline Severance to unlock Advanced Challenges.'
                : 'Complete your first Singular Synthesis to unlock Extreme Challenges.'}
            </p>
          </div>
        ) : (
          challenges.map((c) => <ChallengeCard key={c.id} challengeId={c.id} />)
        )}
      </div>
    </div>
  )
}
