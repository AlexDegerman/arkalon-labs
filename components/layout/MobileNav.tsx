'use client'

import { useActiveTab, MobileTab, WorkspaceTab } from '@/hooks/useActiveTab'
import { playSound } from '@/hooks/useSound'
import TutorialHighlight from '../tutorial/TutorialHighlight'
import { useUIStore } from '@/app/stores/uiStore'
import { useActionSignals } from '@/hooks/useActionSignals'

interface NavItem {
  id: MobileTab
  label: string
  icon: string
}

const NAV_ITEMS: NavItem[] = [
  { id: 'lab', label: 'Lab', icon: '⚗' },
  { id: 'arkalon', label: 'Arkalon', icon: '◎' },
  { id: 'research', label: 'Research', icon: '◈' },
  { id: 'relics', label: 'Relics', icon: '◆' },
  { id: 'more', label: 'More', icon: '≡' }
]

const MORE_TABS: WorkspaceTab[] = [
  'stats',
  'prestige',
  'modules',
  'excavation',
  'megaprojects',
  'operations',
  'challenges',
  'achievements'
]

export default function MobileNav() {
  const mobileTab = useActiveTab((s) => s.mobileTab)
  const setMobileTab = useActiveTab((s) => s.setMobileTab)
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const moreDrawerOpen = useActiveTab((s) => s.moreDrawerOpen)
  const setMoreDrawerOpen = useActiveTab((s) => s.setMoreDrawerOpen)
  const unseenUnlockedTabs = useUIStore((s) => s.unseenUnlockedTabs)
  const actionSignals = useActionSignals()

  return (
    <nav
      className="lg:hidden flex items-stretch border-t border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 z-30 pb-[env(safe-area-inset-bottom,0.25rem)]"
      aria-label="Main navigation"
    >
      {NAV_ITEMS.map((item) => {
        const isMore = item.id === 'more'
        const isActive = isMore
          ? moreDrawerOpen
          : mobileTab === item.id && !moreDrawerOpen
        const isWorkspace = item.id === 'research'
        const displayLabel =
          isWorkspace && mobileTab === 'research' && !moreDrawerOpen
            ? 'Workspace'
            : item.label

        const hasNew = isMore
          ? MORE_TABS.some((t) => unseenUnlockedTabs.includes(t))
          : item.id === 'research'
            ? unseenUnlockedTabs.includes('research')
            : item.id === 'relics'
              ? unseenUnlockedTabs.includes('relics')
              : false

        const hasAction = isMore
          ? MORE_TABS.some((t) => Boolean(actionSignals[t]))
          : item.id === 'research'
            ? Boolean(actionSignals.research)
            : item.id === 'relics'
              ? Boolean(actionSignals.relics)
              : false

        const navButton = (
          <button
            onClick={() => {
              playSound('click')
              if (isMore) {
                setMoreDrawerOpen(!moreDrawerOpen)
                return
              }
              if (item.id === 'research' && mobileTab !== 'research')
                setWorkspaceTab('research')
              setMobileTab(item.id)
            }}
            className={[
              'w-full flex-1 flex flex-col items-center justify-center gap-1 py-2.5 text-[10px] sm:text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer relative',
              isActive
                ? 'text-(--border-accent) bg-(--border-accent)/10 border-t-2 border-(--border-accent) -mt-px shadow-[0_-4px_12px_rgba(0,240,255,0.2)]'
                : hasNew
                  ? 'text-(--status-success) bg-(--status-success)/10 border-t-2 border-(--status-success) -mt-px shadow-[0_-4px_12px_rgba(57,255,138,0.25)]'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
            aria-current={isActive ? 'page' : undefined}
          >
            <span
              className="relative text-base leading-none"
              aria-hidden="true"
            >
              {item.icon}
              {hasNew && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-(--status-success) shadow-[0_0_6px_rgba(57,255,138,0.9)]" />
              )}
              {!hasNew && hasAction && (
                <span className="absolute -top-1 -right-2 w-2 h-2 rounded-full bg-(--border-accent) shadow-[0_0_6px_rgba(0,240,255,0.8)]" />
              )}
            </span>
            <span>{displayLabel}</span>
          </button>
        )

        if (item.id === 'research') {
          return (
            <TutorialHighlight
              key={item.id}
              targetId="workspace-tab-research"
              className="flex-1 flex"
            >
              {navButton}
            </TutorialHighlight>
          )
        }

        return (
          <div key={item.id} className="flex-1 flex">
            {navButton}
          </div>
        )
      })}
    </nav>
  )
}