'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { ACHIEVEMENTS } from '@/lib/achievementDefs'
import type { AchievementDefinition } from '@/lib/achievementDefs'
import ProgressBar from '@/components/ui/ProgressBar'

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
  progress?: { fraction: number; label: string } | null
}

function AchievementBadge({
  achievement,
  earned,
  progress
}: AchievementBadgeProps) {
  return (
    <div
      className={[
        'card rounded-xl p-2.5 flex flex-col gap-1 border transition-all duration-150',
        earned
          ? 'border-(--border-accent)/50 bg-(--border-accent)/5 shadow-[0_0_12px_rgba(0,240,255,0.08)]'
          : 'border-(--border-default) bg-(--bg-surface)/50 opacity-70'
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={[
              'text-sm font-bold select-none shrink-0',
              earned ? 'text-(--border-accent)' : 'text-(--text-secondary)'
            ].join(' ')}
            aria-hidden="true"
          >
            {earned ? '★' : '☆'}
          </span>
          <span className="text-xs font-bold text-(--text-primary) leading-tight">
            {achievement.name}
          </span>
        </div>
        {!earned && progress && (
          <span className="text-[9px] font-mono text-(--text-secondary) shrink-0">
            {progress.label}
          </span>
        )}
      </div>
      <p className="text-[11px] text-(--text-secondary) leading-snug">
        {achievement.description}
      </p>
      {achievement.perkDescription && (
        <p className="text-[10px] font-mono font-bold text-(--text-accent) mt-0.5 leading-snug">
          ✦ {achievement.perkDescription}
        </p>
      )}
      {!earned && progress && (
        <div className="mt-auto pt-1">
          <ProgressBar
            progress={progress.fraction}
            variant="default"
            height={3}
            animated={false}
          />
        </div>
      )}
    </div>
  )
}

export default function AchievementsWorkspace() {
  const [activeCategory, setActiveCategory] =
    useState<AchievementCategory>('all')
  const [stateSnap, setStateSnap] = useState(() => useGameStore.getState())
  const earnedIds = useGameStore((s) => s.achievements)

  useEffect(() => {
    setStateSnap(useGameStore.getState())
    const timer = setInterval(() => {
      setStateSnap(useGameStore.getState())
    }, 1000)
    return () => clearInterval(timer)
  }, [earnedIds.length])

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
      <div className="flex flex-col gap-2 px-3 py-2 border-b border-(--border-default) shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Facility Achievements
            </p>
            <p className="text-[10px] font-mono text-(--status-success)">
              +{earnedCount}% Global RP Production (+1% per achievement)
            </p>
          </div>
          <span className="chip border-(--border-accent)/50 text-(--text-accent) text-[0.65rem] font-mono">
            {earnedCount}/{ACHIEVEMENTS.length} Unlocked
          </span>
        </div>
        <ProgressBar
          progress={
            ACHIEVEMENTS.length > 0 ? earnedCount / ACHIEVEMENTS.length : 0
          }
          variant="success"
          height={3}
          animated={false}
        />
      </div>

      {/* Category filter */}
      <div className="flex overflow-x-auto scrollbar-dark border-b border-(--border-default) shrink-0">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={[
              'px-3 py-2 text-xs font-mono font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer border-b-2',
              activeCategory === cat.id
                ? 'border-(--border-accent) text-(--border-accent) bg-(--border-accent)/10'
                : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="@container flex-1 overflow-y-auto scrollbar-dark p-2 sm:p-3">
        <div className="grid grid-cols-1 @[380px]:grid-cols-2 gap-1.5">
          {filtered.map((achievement) => {
            const earned = earnedIds.includes(achievement.id)
            const prog =
              !earned && achievement.progress
                ? achievement.progress(stateSnap)
                : null
            return (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                earned={earned}
                progress={prog}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}
