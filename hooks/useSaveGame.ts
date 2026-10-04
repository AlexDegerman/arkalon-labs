'use client'

import { useEffect, useRef, useState } from 'react'
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
import { LOCAL_SAVE_INTERVAL_MS, SAVE_RATE_LIMIT_MS } from '@/constants/game'

type SaveStatus = 'synced' | 'saving' | 'error' | 'offline' | '--'

export function useSaveGame() {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('--')
  const [lastSaveLabel, setLastSaveLabel] = useState('--')
  const localSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCloudSaveRef = useRef<number>(0)
  const mountedRef = useRef(false)

  // On mount: load save then start local save interval
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true

    // Load order: localStorage first (cloud load added in Commit 7.3)
    const saved = loadFromLocalStorage()
    if (saved) {
      // Calculate offline progress
      const lastSaveTime = saved.stats?.lastPrestigeTime ?? Date.now()
      const offlinePayload = calculateOfflineProgress(
        saved,
        lastSaveTime,
        Date.now()
      )

      const updatedCurrencies = applyOfflineProgress(saved, offlinePayload)
      const mergedState = { ...saved, ...updatedCurrencies }

      useGameStore.getState().applyState(mergedState)

      if (offlinePayload.rpEarned > 0n) {
        // Show offline progress notification (Facility Alert)
        const { useUIStore } = require('@/app/stores/uiStore')
        const { formatPoints, formatDuration } = require('@/lib/format')
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

    // Local save interval
    localSaveTimerRef.current = setInterval(() => {
      const state = useGameStore.getState()
      saveToLocalStorage(state)
      setLastSaveLabel(
        new Date().toLocaleTimeString(undefined, {
          hour: '2-digit',
          minute: '2-digit'
        })
      )
    }, LOCAL_SAVE_INTERVAL_MS)

    return () => {
      if (localSaveTimerRef.current) {
        clearInterval(localSaveTimerRef.current)
      }
    }
  }, [])

  return { saveStatus, lastSaveLabel }
}
