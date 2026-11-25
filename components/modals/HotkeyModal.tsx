'use client'

import { useUIStore } from '@/app/stores/uiStore'

const SHORTCUT_GROUPS = [
  {
    category: 'Equipment Deployment',
    keys: [
      {
        key: '1 - 9, 0',
        desc: 'Instantly buy 1 unit of Generators 1 through 10'
      },
      {
        key: 'Shift + 1 - 0',
        desc: 'Instantly buy 1 unit of Generators 11 through 20'
      },
      {
        key: 'M',
        desc: 'Buy Max All across all tiers (Requires Bulk Procurement AR upgrade)'
      },
      {
        key: 'B',
        desc: 'Cycle Purchase Multiplier Mode (x1 → x10 → x100 → NEXT → MAX)'
      }
    ]
  },
  {
    category: 'Facility Navigation',
    keys: [
      { key: 'R', desc: 'Open Research Workspace' },
      { key: 'P', desc: 'Open Prestige Hub' },
      {
        key: 'Esc',
        desc: 'Dismiss open modals, drawers, or confirmation dialogues'
      }
    ]
  },
  {
    category: 'Diagnostics & Systems',
    keys: [
      { key: ',', desc: 'Open Facility Configuration Settings' },
      { key: '?', desc: 'Toggle this Keyboard Shortcuts Matrix' }
    ]
  }
]

export default function HotkeyModal() {
  const isOpen = useUIStore((s) => s.hotkeyModalOpen)
  const fromSettings = useUIStore((s) => s.hotkeyFromSettings)
  const setOpen = useUIStore((s) => s.setHotkeyModalOpen)
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen)

  if (!isOpen) return null

  function handleBackToSettings() {
    setOpen(false)
    setSettingsPanelOpen(true)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-[fade-in_0.15s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-label="Keybinds and controls info"
    >
      <div className="card w-full max-w-md rounded-2xl border border-(--border-default) bg-(--bg-surface)/95 p-4 sm:p-5 flex flex-col gap-3.5 shadow-2xl backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-(--border-default)/60 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-(--border-accent)" />
            <h3 className="text-xs sm:text-sm font-mono font-black uppercase tracking-wider text-(--text-primary)">
              Keybinds &amp; Controls // Info
            </h3>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="text-(--text-secondary) hover:text-(--text-primary) p-1 cursor-pointer font-mono text-sm"
            aria-label="Close keybinds info"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto scrollbar-dark pr-1 font-mono text-xs">
          {SHORTCUT_GROUPS.map((group) => (
            <div key={group.category} className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-(--text-secondary)/80">
                {group.category}
              </span>
              <div className="flex flex-col gap-1">
                {group.keys.map(({ key, desc }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-2 rounded-lg bg-(--bg-elevated) border border-(--border-default)/50 text-[11px]"
                  >
                    <span className="text-(--text-secondary) flex-1 mr-2">
                      {desc}
                    </span>
                    <kbd className="px-2 py-0.5 rounded bg-black/50 border border-(--border-accent)/40 text-(--text-accent) font-bold shrink-0 shadow-sm">
                      {key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {fromSettings ? (
            <button
              onClick={handleBackToSettings}
              className="flex-1 py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-(--border-accent)/40 bg-(--border-accent)/10 text-(--text-accent) hover:bg-(--border-accent) hover:text-[#080c14] transition-all cursor-pointer"
            >
              ← Back to Settings
            </button>
          ) : (
            <button
              onClick={() => setOpen(false)}
              className="w-full py-2 text-xs font-mono font-bold uppercase tracking-wider rounded-xl border border-(--border-accent)/40 bg-(--border-accent)/10 text-(--text-accent) hover:bg-(--border-accent) hover:text-[#080c14] transition-all cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
