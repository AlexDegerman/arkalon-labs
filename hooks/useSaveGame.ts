'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  serialiseState,
  deserialiseState
} from '@/lib/saveGame'
import {
  calculateOfflineProgress,
  applyOfflineProgress
} from '@/lib/offlineCalc'
import {
  LOCAL_SAVE_INTERVAL_MS,
  CLOUD_SAVE_INTERVAL_MS,
  SAVE_RATE_LIMIT_MS
} from '@/constants/game'
import { saveState } from '@/app/actions/saveState'
import { loadState } from '@/app/actions/loadState'

type SaveStatus = 'synced' | 'saving' | 'error' | 'offline' | '--'

export function useSaveGame() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('--')
  const [lastSaveLabel, setLastSaveLabel] = useState('--')
  const localSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cloudSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCloudSaveRef = useRef<number>(0)
  const mountedRef = useRef(false)

  // Performs a cloud save - rate-limited client-side as well as server-side
  const doCloudSave = useCallback(async () => {
    const now = Date.now()
    if (now - lastCloudSaveRef.current < SAVE_RATE_LIMIT_MS) return

    setSaveStatus('saving')

    const state = useGameStore.getState()
    const serialized = serialiseState(state)

    try {
      const result = await saveState({
        save: serialized as unknown as Record<string, unknown>,
        lastSavedTime: serialized.lastSavedTime,
        lifetimePoints: serialized.lifetimePoints,
        currentPoints: serialized.researchPoints,
        cachedPPS: serialized.cachedPointsPerSecond
      })

      if (result.success) {
        lastCloudSaveRef.current = now
        setSaveStatus('synced')
        setLastSaveLabel(
          new Date().toLocaleTimeString(undefined, {
            hour: '2-digit',
            minute: '2-digit'
          })
        )
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('offline')
    }
  }, [])

  // On mount: attempt cloud load, fall back to localStorage, apply offline progress
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    async function boot() {
      let loadedState = null
      let cloudState: Record<string, unknown> | null = null

      // 1. Try cloud load
      try {
        const result = await loadState()
        if (result.success && result.state) {
          cloudState = result.state
          loadedState = deserialiseState(result.state)
        }
      } catch {
        // Cloud unavailable - fall through to localStorage
      }

      // 2. Fall back to localStorage
      if (!loadedState) {
        loadedState = loadFromLocalStorage()
      }

      // 3. Apply loaded state and offline progress
      if (loadedState) {
        const lastSaveTime =
          loadedState.stats.lastPrestigeTime > 0
            ? loadedState.stats.lastPrestigeTime
            : Date.now() - 5000

        const offlinePayload = calculateOfflineProgress(
          loadedState,
          lastSaveTime,
          Date.now()
        )

        const updatedCurrencies = applyOfflineProgress(
          loadedState,
          offlinePayload
        )
        const mergedState = { ...loadedState, ...updatedCurrencies }
        useGameStore.getState().applyState(mergedState)

        // Check for operation cycle advance
        const serverCycle = (cloudState as any)?._serverCycleNumber
        if (serverCycle && typeof serverCycle === 'number') {
          const { checkOperationCycle } =
            await import('@/app/stores/gameActions')
          checkOperationCycle(serverCycle)
        }

        if (offlinePayload.rpEarned > 0n) {
          const { useUIStore } = await import('@/app/stores/uiStore')
          const { formatPoints, formatDuration } = await import('@/lib/format')
          useUIStore.getState().pushAlert({
            priority: 2,
            variant: 'info',
            title: 'Offline Progress',
            message: `Generated ${formatPoints(offlinePayload.rpEarned)} RP while away (${formatDuration(offlinePayload.elapsedSeconds)} at ${Math.round(offlinePayload.efficiencyApplied * 100)}% efficiency).`,
            autoDismissMs: 6000
          })
        }
      }

      useGameStore.getState().setInitialized(true)
      setSaveStatus(cloudState ? 'synced' : 'offline')
    }

    boot()

    // Local save every 5 seconds
    localSaveTimerRef.current = setInterval(() => {
      const state = useGameStore.getState()
      saveToLocalStorage(state)
    }, LOCAL_SAVE_INTERVAL_MS)

    // Cloud save every 60 seconds
    cloudSaveTimerRef.current = setInterval(() => {
      doCloudSave()
    }, CLOUD_SAVE_INTERVAL_MS)

    return () => {
      if (localSaveTimerRef.current) clearInterval(localSaveTimerRef.current)
      if (cloudSaveTimerRef.current) clearInterval(cloudSaveTimerRef.current)
    }
  }, [doCloudSave])

  return { saveStatus, lastSaveLabel, doCloudSave }
}
