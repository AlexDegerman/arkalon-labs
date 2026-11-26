'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useActiveTab, type WorkspaceTab } from '@/hooks/useActiveTab'
import type { FeatureKey } from '@/lib/featureRegistry'
import { getFeatureProgress, type ProgressState } from '@/lib/featureProgress'
import ProgressBar from '@/components/ui/ProgressBar'
import TutorialHighlight from '../tutorial/TutorialHighlight'
import { useUIStore } from '@/app/stores/uiStore'
import { useActionSignals } from '@/hooks/useActionSignals'
import { useRef, useState, useCallback, useEffect } from 'react'

interface DirectoryItem {
  tab: WorkspaceTab
  featureKey: FeatureKey
  icon: string
  label: string
  blurb: string
}

const DIRECTORY_ITEMS: DirectoryItem[] = [
  {
    tab: 'research',
    featureKey: 'techMatrix',
    icon: '◈',
    label: 'Research',
    blurb: 'Four-branch node tree with timed studies.'
  },
  {
    tab: 'stats',
    featureKey: 'statistics',
    icon: '◑',
    label: 'Statistics',
    blurb: 'Live diagnostics, yield history and totals.'
  },
  {
    tab: 'modules',
    featureKey: 'modules',
    icon: '⊞',
    label: 'Generator Modules',
    blurb: 'Per-generator efficiency, cost & synergy upgrades.'
  },
  {
    tab: 'achievements',
    featureKey: 'achievements',
    icon: '★',
    label: 'Achievements',
    blurb: 'Milestones granting permanent +1% RP bonuses.'
  },
  {
    tab: 'relics',
    featureKey: 'relics',
    icon: '◆',
    label: 'Relics & Artifacts',
    blurb: 'Equip artifacts for passive global multipliers.'
  },
  {
    tab: 'excavation',
    featureKey: 'excavation',
    icon: '⊙',
    label: 'Excavation',
    blurb: 'Probes scan sectors for dust and relics.'
  },
  {
    tab: 'prestige',
    featureKey: 'prestige',
    icon: '⟳',
    label: 'Prestige',
    blurb: 'Reset runs for permanent AR, CF & OS perks.'
  },
  {
    tab: 'megaprojects',
    featureKey: 'megaprojects',
    icon: '⬡',
    label: 'Megaprojects',
    blurb: 'Bank passive RP into permanent mega-structures.'
  },
  {
    tab: 'operations',
    featureKey: 'anomalousOperations',
    icon: '◉',
    label: 'Anomalous Operations',
    blurb: 'Cosmic anomaly cycles for permanent perks.'
  },
  {
    tab: 'challenges',
    featureKey: 'challenges',
    icon: '⊛',
    label: 'Challenges',
    blurb: 'Restricted runs with permanent rewards.'
  }
]

// Desktop hub: scannable feature grid replacing the scrollable tab bar
export default function WorkspaceDirectory() {
  const initialized = useGameStore((s) => s._initialized)
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const unseenUnlockedTabs = useUIStore((s) => s.unseenUnlockedTabs)
  const actionSignals = useActionSignals()
  const unlocks = useGameStore((s) => s.unlocks)
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const restrictions = useGameStore((s) => s.activeChallengeRestrictions)
  const completedResearchCount = useGameStore(
    (s) => s.completedResearchNodes.length
  )
  const keyGenCount = useGameStore(
    (s) =>
      s.generators[0].quantity +
      s.generators[1].quantity +
      s.generators[2].quantity +
      s.generators[4].quantity
  )

  const [progressState, setProgressState] = useState<ProgressState>(() => {
    const s = useGameStore.getState()
    return {
      lifetimePoints: s.lifetimePoints,
      generators: s.generators,
      completedResearchNodes: s.completedResearchNodes,
      achievementsCount: s.achievements.length,
      stats: s.stats
    }
  })

  useEffect(() => {
    const sync = () => {
      const s = useGameStore.getState()
      setProgressState({
        lifetimePoints: s.lifetimePoints,
        generators: s.generators,
        completedResearchNodes: s.completedResearchNodes,
        achievementsCount: s.achievements.length,
        stats: s.stats
      })
    }
    sync()
    const timer = setInterval(sync, 2000)
    return () => clearInterval(timer)
  }, [unlocks, completedResearchCount, keyGenCount])

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const [belowSignal, setBelowSignal] = useState<'new' | 'action' | null>(null)

  const checkBelowFold = useCallback(() => {
    const container = scrollRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    let hasNewBelow = false
    let hasActionBelow = false

    const cards = container.querySelectorAll<HTMLElement>('[data-signal-type]')
    cards.forEach((el) => {
      const rect = el.getBoundingClientRect()
      if (rect.bottom > cRect.bottom + 8) {
        const type = el.dataset.signalType
        if (type === 'new') hasNewBelow = true
        else if (type === 'action') hasActionBelow = true
      }
    })

    setBelowSignal(hasNewBelow ? 'new' : hasActionBelow ? 'action' : null)
  }, [])

  useEffect(() => {
    checkBelowFold()
    window.addEventListener('resize', checkBelowFold)
    return () => window.removeEventListener('resize', checkBelowFold)
  }, [checkBelowFold, unseenUnlockedTabs, actionSignals, unlocks])

  function scrollToNextSignal() {
    const container = scrollRef.current
    if (!container) return
    const cRect = container.getBoundingClientRect()
    const target = Array.from(
      container.querySelectorAll<HTMLElement>('[data-signal-type]')
    ).find((el) => el.getBoundingClientRect().bottom > cRect.bottom + 8)
    target?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }

  if (!initialized) {
    return (
      <div className="flex-1 min-h-0 flex items-center justify-center p-6">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Synchronizing Facility Directory...
        </p>
      </div>
    )
  }

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div
        ref={scrollRef}
        onScroll={checkBelowFold}
        className="@container flex-1 min-h-0 overflow-y-auto scrollbar-dark p-2 flex flex-col gap-1.5"
      >
        <div className="flex items-baseline justify-between gap-2 px-0.5">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            Facility Directory
          </p>
          <p className="text-[10px] text-(--text-secondary)/80">
            Select an online system
          </p>
        </div>

        <div className="grid grid-cols-1 @[420px]:grid-cols-2 gap-1">
          {DIRECTORY_ITEMS.map((item) => {
            const isLocked = !unlocks[item.featureKey]
            const progress = getFeatureProgress(item.featureKey, progressState)

            if (isLocked) {
              return (
                <div
                  key={item.tab}
                  className="card flex flex-col gap-0.5 p-2 rounded-xl border-(--border-default)/60 bg-(--bg-surface)/50 select-none"
                  role="group"
                  aria-disabled="true"
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="text-xs opacity-70 shrink-0"
                      aria-hidden="true"
                    >
                      🔒
                    </span>
                    <span className="text-xs font-mono font-bold text-(--text-secondary) leading-tight wrap-break-word">
                      {item.label}
                    </span>
                  </div>
                  <p className="text-[10.5px] text-(--text-secondary)/80 leading-snug">
                    {item.blurb}
                  </p>
                  {progress && (
                    <div className="flex flex-col gap-0.5 mt-auto pt-1 border-t border-(--border-default)/40">
                      <div className="flex items-baseline justify-between gap-2 flex-wrap">
                        <span className="text-[9px] font-mono uppercase tracking-wider text-(--text-secondary)/60 shrink-0">
                          Unlock
                        </span>
                        <span className="text-[10px] font-mono font-bold text-amber-400/90">
                          {progress.label}
                        </span>
                      </div>
                      <ProgressBar
                        progress={progress.fraction}
                        variant="warning"
                        height={3}
                        animated={false}
                      />
                    </div>
                  )}
                </div>
              )
            }

            const isRestricted =
              (item.tab === 'research' &&
                Boolean(restrictions?.techMatrixDisabled)) ||
              (item.tab === 'modules' &&
                Boolean(restrictions?.modulesDisabled)) ||
              (item.tab === 'relics' &&
                Boolean(restrictions?.relicsDisabled)) ||
              (item.tab === 'excavation' &&
                Boolean(restrictions?.excavationDisabled)) ||
              (item.tab === 'megaprojects' && Boolean(activeChallengeId))
            const isChallengeActive =
              item.tab === 'challenges' && Boolean(activeChallengeId)
            const isUnseen = unseenUnlockedTabs.includes(item.tab)
            const actionLabel = isRestricted
              ? undefined
              : actionSignals[item.tab]
            const signalType = isUnseen
              ? 'new'
              : actionLabel
                ? 'action'
                : undefined

            const buttonElement = (
              <button
                onClick={() => setWorkspaceTab(item.tab)}
                data-signal-type={signalType}
                className={[
                  'card flex flex-col gap-0.5 p-2 rounded-xl text-left transition-all cursor-pointer select-none w-full h-full',
                  isRestricted
                    ? 'border-amber-500/40 bg-(--bg-surface)/70 opacity-75 hover:border-amber-400/60'
                    : isUnseen
                      ? 'border-(--status-success) bg-(--status-success)/10 shadow-[0_0_16px_rgba(57,255,138,0.28)]'
                      : actionLabel
                        ? 'border-(--border-accent)/75 bg-(--border-accent)/5 shadow-[0_0_12px_rgba(0,240,255,0.14)] hover:border-(--border-accent)'
                        : 'border-(--border-default) bg-(--bg-surface) hover:border-(--border-accent)'
                ].join(' ')}
                aria-label={`Open ${item.label}`}
              >
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span
                      className={[
                        'text-sm shrink-0',
                        isRestricted
                          ? 'text-amber-400'
                          : isUnseen
                            ? 'text-(--status-success)'
                            : 'text-(--border-accent)'
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <span className="text-xs font-mono font-bold text-(--text-primary) leading-tight wrap-break-word">
                      {item.label}
                    </span>
                  </div>
                  {isRestricted ? (
                    <span className="text-[9px] font-mono font-bold text-amber-400 shrink-0">
                      OFFLINE
                    </span>
                  ) : isUnseen ? (
                    <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-(--status-success) text-[#080c14] shrink-0">
                      NEW
                    </span>
                  ) : isChallengeActive ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-amber-400/50 bg-amber-400/15 text-amber-300 shrink-0">
                      ACTIVE
                    </span>
                  ) : actionLabel ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-accent)/50 bg-(--border-accent)/15 text-(--text-accent) shrink-0">
                      {actionLabel}
                    </span>
                  ) : (
                    <span className="text-[9px] font-mono font-bold text-(--status-success) shrink-0">
                      ONLINE
                    </span>
                  )}
                </div>
                <p className="text-[10.5px] text-(--text-secondary) leading-snug">
                  {item.blurb}
                </p>
              </button>
            )

            if (item.tab === 'research') {
              return (
                <TutorialHighlight
                  key={item.tab}
                  targetId="workspace-tab-research"
                >
                  {buttonElement}
                </TutorialHighlight>
              )
            }

            return <div key={item.tab}>{buttonElement}</div>
          })}
        </div>
      </div>

      {belowSignal && (
        <button
          onClick={scrollToNextSignal}
          className={[
            'w-full px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider border-t flex items-center justify-center gap-1.5 cursor-pointer shrink-0 transition-all',
            belowSignal === 'new'
              ? 'border-(--status-success) bg-[#062414]/95 text-(--status-success) shadow-[0_-4px_14px_rgba(57,255,138,0.28)]'
              : 'border-(--border-accent) bg-[#071c26]/95 text-(--text-accent) shadow-[0_-4px_14px_rgba(0,240,255,0.2)]'
          ].join(' ')}
        >
          <span>
            {belowSignal === 'new'
              ? '↓ New System Unlocked Below'
              : '↓ Action Available Below'}
          </span>
        </button>
      )}
    </div>
  )
}
