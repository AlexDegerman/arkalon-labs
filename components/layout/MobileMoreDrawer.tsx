'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useActiveTab, WorkspaceTab } from '@/hooks/useActiveTab'
import { getFeatureProgress } from '@/lib/featureProgress'

import type { FeatureKey } from '@/lib/featureRegistry'
import ProgressBar from '../ui/ProgressBar'
import { useActionSignals } from '@/hooks/useActionSignals'
import { useRef, useState, useCallback, useEffect } from 'react'

interface DrawerItem {
  id: WorkspaceTab
  label: string
  icon: string
  blurb: string
  featureKey: FeatureKey
}

const DRAWER_ITEMS: DrawerItem[] = [
  {
    id: 'stats',
    label: 'Statistics',
    icon: '◑',
    blurb: 'Diagnostics & history',
    featureKey: 'statistics'
  },
  {
    id: 'prestige',
    label: 'Prestige',
    icon: '⟳',
    blurb: 'Reset for AR perks',
    featureKey: 'prestige'
  },
  {
    id: 'modules',
    label: 'Modules',
    icon: '⊞',
    blurb: 'Per-generator upgrades',
    featureKey: 'modules'
  },
  {
    id: 'excavation',
    label: 'Excavation',
    icon: '⊙',
    blurb: 'Probe scans for dust',
    featureKey: 'excavation'
  },
  {
    id: 'megaprojects',
    label: 'Megaprojects',
    icon: '⬡',
    blurb: 'Permanent mega-structures',
    featureKey: 'megaprojects'
  },
  {
    id: 'operations',
    label: 'Operations',
    icon: '◉',
    blurb: 'Global 90-day cycles',
    featureKey: 'anomalousOperations'
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: '⊛',
    blurb: 'Restricted reward runs',
    featureKey: 'challenges'
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: '★',
    blurb: 'Tasks & unlockables',
    featureKey: 'achievements'
  }
]

interface Props {
  onClose: () => void
}

export default function MobileMoreDrawer({ onClose }: Props) {
  const initialized = useGameStore((s) => s._initialized)
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const setMobileTab = useActiveTab((s) => s.setMobileTab)
  const unseenUnlockedTabs = useUIStore((s) => s.unseenUnlockedTabs)
  const actionSignals = useActionSignals()
  const unlocks = useGameStore((s) => s.unlocks)
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
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const generators = useGameStore((s) => s.generators)
  const completedResearchNodes = useGameStore((s) => s.completedResearchNodes)
  const achievementsCount = useGameStore((s) => s.achievements.length)
  const stats = useGameStore((s) => s.stats)
  const progressState = {
    lifetimePoints,
    generators,
    completedResearchNodes,
    achievementsCount,
    stats
  }

  function handleSelect(tab: WorkspaceTab) {
    setWorkspaceTab(tab)
    setMobileTab('research')
    onClose()
  }

  return (
    <>
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-50 bg-(--bg-elevated) border-t border-(--border-default) rounded-t-2xl shadow-2xl max-h-[90%] flex flex-col animate-[fade-in_0.15s_ease-out_both]"
        role="dialog"
        aria-label="More options"
      >
        {/* Drag handle + header */}
        <div className="flex flex-col items-center gap-1 pt-2 pb-2 border-b border-(--border-default) shrink-0">
          <span
            className="w-10 h-1 rounded-full bg-(--border-default)"
            aria-hidden="true"
          />
          <div className="w-full flex items-center justify-between px-4 pt-1.5">
            <span className="text-xs font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Facility Directory
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose()
                  useUIStore.getState().setSettingsPanelOpen(true)
                }}
                className="text-xs font-mono text-(--text-accent) font-bold hover:underline px-1.5 py-0.5 cursor-pointer"
              >
                Settings
              </button>
              <button
                onClick={onClose}
                className="text-(--text-secondary) hover:text-(--text-primary) p-1 rounded font-mono text-sm leading-none cursor-pointer"
                aria-label="Close drawer"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable grid */}
        <div
          ref={scrollRef}
          onScroll={checkBelowFold}
          className="flex-1 min-h-0 overflow-y-auto scrollbar-dark p-3"
        >
          {!initialized ? (
            <div className="py-10 text-center">
              <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
                Synchronizing Facility Directory...
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-1.5">
                {DRAWER_ITEMS.map((item) => {
                  const isLocked = !unlocks[item.featureKey]
                  const progress = getFeatureProgress(
                    item.featureKey,
                    progressState
                  )

                  if (isLocked) {
                    // Locked: read-only card with live unlock progress
                    return (
                      <div
                        key={item.id}
                        className="flex flex-col gap-1 p-2.5 rounded-xl border border-(--border-default)/50 bg-(--bg-surface)/40 select-none"
                        aria-disabled="true"
                        role="group"
                      >
                        <div className="flex items-center gap-1.5">
                          <span
                            className="text-sm shrink-0 opacity-70"
                            aria-hidden="true"
                          >
                            🔒
                          </span>
                          <span className="text-[11px] font-mono font-bold text-(--text-secondary) truncate">
                            {item.label}
                          </span>
                        </div>
                        <p className="text-[9px] text-(--text-secondary)/70 truncate">
                          {item.blurb}
                        </p>
                        {progress && (
                          <div className="flex flex-col gap-0.5 pt-1.5 mt-auto border-t border-(--border-default)/30">
                            <span className="text-[8px] font-mono uppercase tracking-wider text-(--text-secondary)/60">
                              Unlock
                            </span>
                            <p className="text-[9px] font-mono font-bold text-amber-400/90 leading-tight">
                              {progress.label}
                            </p>
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

                  const isUnseen = unseenUnlockedTabs.includes(item.id)
                  const actionLabel = actionSignals[item.id]
                  const signalType = isUnseen
                    ? 'new'
                    : actionLabel
                      ? 'action'
                      : undefined

                  // Unlocked: interactive card
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.id)}
                      data-signal-type={signalType}
                      className={[
                        'flex flex-col gap-1 p-2.5 rounded-xl border text-left active:bg-(--border-accent)/5 transition-all cursor-pointer select-none',
                        isUnseen
                          ? 'border-(--status-success) bg-(--status-success)/10 shadow-[0_0_14px_rgba(57,255,138,0.28)]'
                          : actionLabel
                            ? 'border-(--border-accent)/75 bg-(--border-accent)/5'
                            : 'border-(--border-default) bg-(--bg-surface)'
                      ].join(' ')}
                      aria-label={item.label}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className={[
                              'text-sm shrink-0',
                              isUnseen
                                ? 'text-(--status-success)'
                                : 'text-(--border-accent)'
                            ].join(' ')}
                            aria-hidden="true"
                          >
                            {item.icon}
                          </span>
                          <span className="text-[11px] font-mono font-bold text-(--text-primary) leading-tight">
                            {item.label}
                          </span>
                        </div>
                      </div>
                      <p className="text-[9px] text-(--text-secondary) leading-snug">
                        {item.blurb}
                      </p>
                      <div className="flex flex-col gap-0.5 mt-auto pt-1.5 border-t border-(--border-default)/30">
                        <span className="text-[8px] font-mono uppercase tracking-wider text-(--text-secondary)/60">
                          Status
                        </span>
                        {isUnseen ? (
                          <p className="text-[9px] font-mono font-black text-(--status-success) leading-tight">
                            ★ NEW UNLOCK
                          </p>
                        ) : actionLabel ? (
                          <p className="text-[9px] font-mono font-bold text-(--text-accent) leading-tight">
                            ● {actionLabel}
                          </p>
                        ) : (
                          <p className="text-[9px] font-mono font-bold text-(--status-success) leading-tight">
                            ✓ Online
                          </p>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>

              {/* Footer hint */}
              <p className="text-center text-[9px] font-mono text-(--text-secondary)/50 mt-2">
                Locked systems show live unlock progress.
              </p>
            </>
          )}
        </div>

        {belowSignal && (
          <button
            onClick={scrollToNextSignal}
            className={[
              'w-full px-3 py-1.5 text-[10px] font-mono font-black uppercase tracking-wider border-t flex items-center justify-center gap-1.5 cursor-pointer shrink-0',
              belowSignal === 'new'
                ? 'border-(--status-success) bg-[#062414] text-(--status-success)'
                : 'border-(--border-accent) bg-[#071c26] text-(--text-accent)'
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
    </>
  )
}
