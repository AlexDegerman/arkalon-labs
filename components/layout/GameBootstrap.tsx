'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useTabGuard } from '@/hooks/useTabGuard'
import { useSaveGame } from '@/hooks/useSaveGame'
import FooterBarLive from '@/components/layout/FooterBarLive'
import { useInactiveTabDetection } from '@/hooks/useInactiveTabDetection'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useUIStore } from '@/app/stores/uiStore'
import { useBGM } from '@/hooks/useBGM'

// Handles game initialization, save/load, and starts the game loop
// Runs entirely client-side after hydration
export default function GameBootstrap() {
  const initialized = useGameStore((s) => s._initialized)
  const isDuplicate = useTabGuard()

  const { lastSaveLabel, saveStatus } = useSaveGame()

  // Start game loop once initialized and not a duplicate tab
  useGameLoop(initialized && !isDuplicate)
  useInactiveTabDetection()
  useKeyboardShortcuts()
  // Context-aware BGM: operation anomalies take priority, then prestige, then anomalies
  const activeAnomalyType = useGameStore((s) => s.activeAnomalyType)
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)
  useBGM({
    anomalyActive:
      activeAnomalyType !== null && !activeAnomalyType.startsWith('operation_'),
    prestigeActive: prestigeAnimating,
    operationActive: activeAnomalyType?.startsWith('operation_') ?? false
  })

  if (isDuplicate) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-(--bg-primary)/95 backdrop-blur-md">
        <div className="card rounded-2xl border border-(--border-default) bg-(--bg-surface) p-8 max-w-sm mx-4 text-center shadow-2xl flex flex-col gap-3">
          <span className="text-3xl select-none" aria-hidden="true">
            ⚠️
          </span>
          <p className="text-sm font-mono font-bold text-(--text-accent) uppercase tracking-wider">
            Duplicate Session Detected
          </p>
          <p className="text-xs text-(--text-secondary) leading-relaxed">
            Arkalon Laboratories is actively running in another browser tab.
            Please close this window to avoid telemetry desynchronization.
          </p>
        </div>
      </div>
    )
  }

  // Render the live footer overlay that shows dynamic save status
  return <FooterBarLive lastSaveLabel={lastSaveLabel} saveStatus={saveStatus} />
}
