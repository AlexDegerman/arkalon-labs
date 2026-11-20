'use client'

import { useEffect, useRef } from 'react'
import { TICK_INTERVAL_MS } from '@/constants/game'
import { tick } from '@/app/stores/actions/tickActions'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  calculateOfflineProgress,
  applyOfflineProgress
} from '@/lib/offlineCalc'
import { saveToLocalStorage } from '@/lib/saveGame'
import {
  markUnlocksDirty,
  markTutorialDirty,
  markAchievementsDirty
} from '@/lib/dirtyFlags'
import { checkResearchSlotExpansion } from '@/lib/unlockWatcher'
import { dispatchMegaprojectComplete } from '@/lib/dialogueDispatcher'
import { awardRelic } from '@/app/stores/actions/relicActions'

// Short browser hiccups catch up via ticks; longer gaps use offline calculation
const MAX_FAST_CATCHUP_MS = 15_000

// Establishes the 100ms game loop via setInterval
// Handles missed ticks from tab inactivity via delta detection
export function useGameLoop(enabled: boolean) {
  // Track last tick time outside React state to avoid re-render on each tick
  const lastTickTimeRef = useRef<number>(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const enabledRef = useRef(enabled)

  // Keep ref in sync with prop without triggering effect re-run
  enabledRef.current = enabled

  useEffect(() => {
    if (!enabled) return

    lastTickTimeRef.current = Date.now()

    intervalRef.current = setInterval(() => {
      // Check enabled via ref to avoid stale closure
      if (!enabledRef.current) return

      const now = Date.now()
      const prevTime = lastTickTimeRef.current
      const delta = now - prevTime
      lastTickTimeRef.current = now

      // Normal case: delta close to TICK_INTERVAL_MS
      if (delta <= TICK_INTERVAL_MS * 1.5) {
        tick()
        return
      }

      // Brief browser throttle (<= 15s): catch up tick-by-tick
      if (delta <= MAX_FAST_CATCHUP_MS) {
        const ticksToApply = Math.floor(delta / TICK_INTERVAL_MS)
        for (let i = 0; i < ticksToApply; i++) {
          tick()
        }
        return
      }

      // Background tab / sleep (> 15s): gaps under 60s retain 100% online efficiency
      const store = useGameStore.getState()
      const payload = calculateOfflineProgress(
        store,
        prevTime,
        now,
        delta < 60_000 ? 1.0 : undefined
      )
      const patch = applyOfflineProgress(store, payload)
      const updatedOffline =
        (store.stats.totalOfflineTime ?? 0) +
        Math.floor(payload.actualElapsedSeconds)

      store.applyState({
        ...patch,
        stats: {
          ...(patch.stats ?? store.stats),
          totalOfflineTime: updatedOffline
        }
      })

      if (payload.megaprojectCompletedId) {
        dispatchMegaprojectComplete(payload.megaprojectCompletedId)
      }
      if (updatedOffline >= 180_000) {
        awardRelic(5)
      }

      checkResearchSlotExpansion(useGameStore.getState())
      markUnlocksDirty()
      markTutorialDirty()
      markAchievementsDirty()
      saveToLocalStorage(useGameStore.getState())

      const hasSignificantActivity =
        payload.rpEarned > 0n ||
        (payload.dustEarned ?? 0) > 0 ||
        (payload.operationPointsEarned ?? 0) > 0 ||
        (payload.researchCompletedNames?.length ?? 0) > 0 ||
        (payload.probesCompletedCount ?? 0) > 0

      if (
        delta >= 60_000 &&
        hasSignificantActivity &&
        !useUIStore.getState().welcomeModalOpen &&
        !useUIStore.getState().updateModalOpen
      ) {
        useUIStore.getState().setOfflinePayload(payload)
        useUIStore.getState().setOfflineModalOpen(true)
      }
    }, TICK_INTERVAL_MS)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [enabled])
}
