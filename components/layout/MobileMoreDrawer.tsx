'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useActiveTab, WorkspaceTab } from '@/hooks/useActiveTab'
import { FEATURE_MAP } from '@/lib/featureRegistry'

interface DrawerItem {
  id: WorkspaceTab
  label: string
  icon: string
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
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-(--bg-elevated) border-t border-(--border-default) rounded-t-2xl shadow-2xl p-4 flex flex-col gap-3 animate-[fade-in_0.15s_ease-out_both]"
        role="dialog"
        aria-label="More options"
      >
        <div className="flex items-center justify-between border-b border-(--border-default) pb-2.5">
          <span className="text-xs font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            More
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose()
                useUIStore.getState().setSettingsPanelOpen(true)
              }}
              className="text-xs font-mono text-(--text-accent) font-bold hover:underline px-1.5 py-0.5"
            >
              Settings
            </button>
            <button
              onClick={onClose}
              className="text-(--text-secondary) hover:text-(--text-primary) p-1 rounded font-mono text-sm leading-none cursor-pointer"
              aria-label="Close drawer"
            >
              X
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 pt-1 pb-safe">
          {DRAWER_ITEMS.map((item) => {
            const featureDef = Object.values(FEATURE_MAP).find(
              (f) => f.workspaceTab === item.id
            )
            const isLocked = featureDef ? !unlocks[featureDef.key] : false

            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={[
                  'flex flex-col items-center justify-center gap-1.5 p-2 rounded-xl border transition-all cursor-pointer select-none',
                  isLocked
                    ? 'border-(--border-default)/50 bg-(--bg-surface)/40 text-(--text-secondary)/40 opacity-60'
                    : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent)'
                ].join(' ')}
                aria-label={`${item.label}${isLocked ? ' (locked)' : ''}`}
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {isLocked ? '\u{1F512}' : item.icon}
                </span>
                <span className="text-[10px] font-mono font-bold text-center leading-tight truncate w-full">
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
