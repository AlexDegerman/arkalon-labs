'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'

export default function SettingsButton() {
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen)
  const gamePaused = useGameStore((s) => s.settings.gamePaused)

  return (
    <div className="flex items-center gap-2">
      {gamePaused && (
        <span className="text-xs font-mono text-(--status-warning) animate-pulse">
          PAUSED
        </span>
      )}
      <button
        onClick={() => setSettingsPanelOpen(true)}
        className={[
          'text-xs font-mono px-2 py-1 rounded border transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
          'border-(--border-default) text-(--text-secondary)',
          'hover:border-(--text-secondary) hover:text-(--text-primary)'
        ].join(' ')}
        aria-label="Open settings (,)"
      >
        Settings
      </button>
    </div>
  )
}
