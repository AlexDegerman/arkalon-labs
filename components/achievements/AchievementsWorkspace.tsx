'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { ACHIEVEMENTS } from '@/lib/achievementDefs'
import type { AchievementDefinition } from '@/lib/achievementDefs'

type AchievementCategory =
  | 'all'
  | 'generators'
  | 'research'
  | 'prestige'
  | 'anomalies'
  | 'relics'
  | 'milestones'
  | 'challenges'

const CATEGORIES: { id: AchievementCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'generators', label: 'Generators' },
  { id: 'research', label: 'Research' },
  { id: 'prestige', label: 'Prestige' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'relics', label: 'Relics' },
  { id: 'milestones', label: 'RP' },
  { id: 'challenges', label: 'Challenges' }
]

interface AchievementBadgeProps {
  achievement: AchievementDefinition
  earned: boolean
}

function AchievementBadge({ achievement, earned }: AchievementBadgeProps) {
  return (
    <div
      className={[
        'card rounded-lg p-2.5 flex flex-col gap-1 transition-colors',
        earned ? 'border-(--status-success)' : 'opacity-50'
      ].join(' ')}
    >
      <div className="flex items-center gap-1.5">
        <span
          className={[
            'text-sm',
            earned
              ? 'text-(--status-success)'
              : 'text-(--status-locked)'
          ].join(' ')}
          aria-hidden="true"
        >
          {earned ? '★' : '☆'}
        </span>
        <span className="text-xs font-semibold text-(--text-primary) truncate">
          {achievement.name}
        </span>
      </div>
      <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
        {achievement.description}
      </p>
    </div>
  )
}

export default function AchievementsWorkspace() {
  const [activeCategory, setActiveCategory] =
    useState<AchievementCategory>('all')
  const earnedIds = useGameStore((s) => s.achievements)

  const filtered =
    activeCategory === 'all'
      ? ACHIEVEMENTS
      : ACHIEVEMENTS.filter((a) => a.category === activeCategory)

  const earnedCount = ACHIEVEMENTS.filter((a) =>
    earnedIds.includes(a.id)
  ).length

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Achievements
        </p>
        <span className="chip border-(--border-default) text-(--text-secondary) text-[0.6rem]">
          {earnedCount}/{ACHIEVEMENTS.length}
        </span>
      </div>

      {/* Category filter */}
      <div className="flex overflow-x-auto scrollbar-dark border-b border-(--border-default) shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={[
              'workspace-tab shrink-0',
              activeCategory === cat.id ? 'workspace-tab-active' : ''
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Achievement grid */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {filtered.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              earned={earnedIds.includes(achievement.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
