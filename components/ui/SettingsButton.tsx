'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'

export default function SettingsButton() {
  const setSettingsPanelOpen = useUIStore((s) => s.setSettingsPanelOpen)
  const gamePaused = useGameStore((s) => s.settings.gamePaused)

  return (
    <div className="flex items-center gap-2">
      {gamePaused && (
        <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded animate-pulse">
          PAUSED
        </span>
      )}
      <button
        onClick={() => setSettingsPanelOpen(true)}
        className={[
          'px-2.5 py-1 text-xs font-mono font-bold rounded-lg border transition-all duration-150 cursor-pointer select-none',
          'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)',
          'hover:border-(--border-accent) hover:text-(--text-primary) active:scale-95'
        ].join(' ')}
        aria-label="Open settings (,)"
      >
        Settings
      </button>
    </div>
  )
}
