'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useTabGuard } from '@/hooks/useTabGuard'
import { useSaveGame } from '@/hooks/useSaveGame'

// Handles game initialization, save/load, and starts the game loop
// Runs entirely client-side after hydration
export default function GameBootstrap() {
  const initialized = useGameStore((s) => s._initialized)
  const isDuplicate = useTabGuard()

  // useSaveGame handles: localStorage load on mount, offline calc,
  // local save interval every 5s, and exposes save status
  const { lastSaveLabel } = useSaveGame()

  // Start game loop once initialized and not a duplicate tab
  useGameLoop(initialized && !isDuplicate)

  // Duplicate tab overlay
  if (isDuplicate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--bg-primary)">
        <div className="glass rounded-lg border border-(--border-default) p-8 max-w-sm mx-4 text-center">
          <p className="text-sm font-mono text-(--text-accent) mb-2">
            Arkalon Laboratories is running in another tab.
          </p>
          <p className="text-xs text-(--text-secondary)">
            Close this tab or switch to the other one to continue.
          </p>
        </div>
      </div>
    )
  }

  return null
}
