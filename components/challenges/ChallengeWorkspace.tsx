'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import { CHALLENGE_DISPLAY } from '@/constants/challenges'
import type { ChallengeCategory } from '@/constants/challenges'

const CATEGORY_TABS: { id: ChallengeCategory; label: string }[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'advanced', label: 'Advanced' },
  { id: 'extreme', label: 'Extreme' }
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

  // Category unlock state
  const categoryUnlocked: Record<ChallengeCategory, boolean> = {
    standard: tier1Done,
    advanced: tier2Done,
    extreme: tier3Done
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Active challenge banner */}
      {activeChallengeId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-(--border-accent)/10 border-b border-(--border-accent) shrink-0">
          <span className="status-dot bg-(--border-accent) dot-pulse" />
          <span className="text-xs font-mono text-(--text-accent)">
            Challenge active:{' '}
            <span className="font-bold">
              {CHALLENGE_DISPLAY.find((c) => c.id === activeChallengeId)
                ?.name ?? activeChallengeId}
            </span>
          </span>
        </div>
      )}

      {/* Category tab bar */}
      <div
        className="flex border-b border-(--border-default) shrink-0"
        role="tablist"
        aria-label="Challenge categories"
      >
        {CATEGORY_TABS.map((tab) => {
          const unlocked = categoryUnlocked[tab.id]
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeCategory === tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={[
                'workspace-tab',
                activeCategory === tab.id ? 'workspace-tab-active' : '',
                !unlocked ? 'workspace-tab-locked' : ''
              ].join(' ')}
              title={
                !unlocked
                  ? tab.id === 'advanced'
                    ? 'Complete your first Timeline Severance to unlock'
                    : tab.id === 'extreme'
                      ? 'Complete your first Singular Synthesis to unlock'
                      : undefined
                  : undefined
              }
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

      {/* Challenge list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-3 flex flex-col gap-3">
        {!categoryUnlocked[activeCategory] ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs font-mono text-(--text-secondary) text-center">
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
