'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useGameLoop } from '@/hooks/useGameLoop'
import { useTabGuard } from '@/hooks/useTabGuard'
import { useSaveGame } from '@/hooks/useSaveGame'
import FooterBarLive from '@/components/layout/FooterBarLive'
import { useInactiveTabDetection } from '@/hooks/useInactiveTabDetection'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { useBGM } from '@/hooks/useBGM'
import { useSound } from '@/hooks/useSound'
import { primeArkalonVoices } from '@/lib/arkalonTTS'
import { useMusicStore } from '@/app/stores/musicStore'
import { useUIStore } from '@/app/stores/uiStore'

// Handles game initialization, save/load, and starts the game loop
// Runs entirely client-side after hydration
export default function GameBootstrap() {
  const initialized = useGameStore((s) => s._initialized)
  const isDuplicate = useTabGuard()
  useSound()

  useEffect(() => {
    primeArkalonVoices()
  }, [])

  const { lastSaveLabel, saveStatus } = useSaveGame(!isDuplicate)

  // Start game loop once initialized and not a duplicate tab
  useGameLoop(initialized && !isDuplicate)

  // Keep BGM context in sync when resets or offline catch-up clear an anomaly
  useEffect(() => {
    let prev = useGameStore.getState().activeAnomalyType
    useMusicStore.getState().setContext(prev ? 'anomaly' : 'idle')
    return useGameStore.subscribe((s) => {
      if (s.activeAnomalyType === prev) return
      prev = s.activeAnomalyType
      useMusicStore.getState().setContext(prev ? 'anomaly' : 'idle')
    })
  }, [])

  useEffect(() => {
    const clientBuildId = process.env.NEXT_PUBLIC_BUILD_ID
    if (!clientBuildId || process.env.NODE_ENV === 'development') return

    let lastCheck = 0
    let stopped = false

    const checkVersion = async (force = false) => {
      if (stopped || useUIStore.getState().clientUpdateAvailable) return
      const now = Date.now()
      if (!force && now - lastCheck < 60_000) return
      lastCheck = now

      try {
        const res = await fetch('/api/version', { cache: 'no-store' })
        if (!res.ok) return
        const data = (await res.json()) as { buildId?: string }
        if (data.buildId && data.buildId !== clientBuildId) {
          useUIStore.getState().setClientUpdateAvailable(true)
        }
      } catch {
        // Ignore transient network errors
      }
    }

    const onVisibility = () => {
      if (document.visibilityState === 'visible') checkVersion()
    }
    const onCheckEvent = () => checkVersion(true)

    const initialTimer = setTimeout(() => checkVersion(true), 10_000)
    const interval = setInterval(() => checkVersion(true), 5 * 60_000)
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('arkalon_check_version', onCheckEvent)

    return () => {
      stopped = true
      clearTimeout(initialTimer)
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('arkalon_check_version', onCheckEvent)
    }
  }, [])

  useInactiveTabDetection()
  useKeyboardShortcuts(!isDuplicate)
  useBGM()

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
