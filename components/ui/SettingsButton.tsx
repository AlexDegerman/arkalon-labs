'use client'

import { useUIStore } from '@/app/stores/uiStore'

export default function SettingsButton() {
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen)

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setSettingsPanelOpen(true)}
        className={[
          'px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all duration-150 cursor-pointer select-none',
          'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)',
          'hover:border-(--border-accent) hover:text-(--text-primary)'
        ].join(' ')}
        aria-label="Open settings (,)"
      >
        Settings
      </button>
    </div>
  )
}
