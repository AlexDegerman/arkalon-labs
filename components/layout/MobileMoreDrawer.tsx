'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useActiveTab, WorkspaceTab } from '@/hooks/useActiveTab'
import { FEATURE_MAP } from '@/lib/featureRegistry'

interface DrawerItem {
  id: WorkspaceTab
  label: string
  icon: string
  // Rendered even when locked; lock state wired in Phase 4
  alwaysVisible: boolean
}

const DRAWER_ITEMS: DrawerItem[] = [
  { id: 'stats', label: 'Statistics', icon: '◑', alwaysVisible: true },
  { id: 'prestige', label: 'Prestige', icon: '⟳', alwaysVisible: true },
  { id: 'modules', label: 'Modules', icon: '⊞', alwaysVisible: true },
  { id: 'excavation', label: 'Excavation', icon: '⊙', alwaysVisible: true },
  { id: 'megaprojects', label: 'Megaprojects', icon: '⬡', alwaysVisible: true },
  { id: 'operations', label: 'Operations', icon: '◉', alwaysVisible: true },
  { id: 'challenges', label: 'Challenges', icon: '⊛', alwaysVisible: true },
  { id: 'achievements', label: 'Achievements', icon: '★', alwaysVisible: true }
]

interface Props {
  onClose: () => void
}

export default function MobileMoreDrawer({ onClose }: Props) {
  const { setWorkspaceTab, setMobileTab } = useActiveTab()
  const unlocks = useGameStore((s) => s.unlocks)

  function handleSelect(tab: WorkspaceTab) {
    setWorkspaceTab(tab)
    // Navigate to the appropriate mobile screen
    // Research-adjacent tabs share the research screen on mobile
    setMobileTab('research')
    onClose()
  }

  return (
    <>
      {/* Scrim */}
      <div
        className="absolute inset-0 bg-black/60 z-10"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className="absolute bottom-0 left-0 right-0 z-20 bg-(--bg-elevated) border-t border-(--border-default) rounded-t-xl"
        role="dialog"
        aria-label="More options"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-default)">
          <span className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
            More
          </span>
          <button
            onClick={onClose}
            className="text-(--text-secondary) text-lg leading-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent) rounded"
            aria-label="Close drawer"
          >
            x
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1 p-3 pb-safe">
          {DRAWER_ITEMS.map((item) => {
            // Check if a feature key maps to this drawer item
            const featureDef = Object.values(FEATURE_MAP).find(
              (f) => f.workspaceTab === item.id
            )
            const isLocked = featureDef ? !unlocks[featureDef.key] : false

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={[
                  'flex flex-col items-center gap-1 py-3 px-1 rounded transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                  isLocked
                    ? 'text-(--status-locked) opacity-60'
                    : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-surface)'
                ].join(' ')}
                aria-label={`${item.label}${isLocked ? ' (locked)' : ''}`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {isLocked ? '&#x1F512;' : item.icon}
                </span>
                <span className="text-xs text-center leading-tight">
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
