'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  serialiseState,
  deserialiseState,
  getLastSaveTime,
  initPlayerLocalStorage
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
import { useUIStore } from '@/app/stores/uiStore'
import { formatDateTime, setNotationMode } from '@/lib/format'
import { checkOperationCycle } from '@/app/stores/actions/operationActions'
import { useMusicStore } from '@/app/stores/musicStore'
import { awardRelic } from '@/app/stores/actions/relicActions'
import { recalculatePPS } from '@/lib/productionEngine'
import { dispatchMegaprojectComplete } from '@/lib/dialogueDispatcher'
import { UPDATES_VERSION } from '@/lib/updates'
import type { UITheme } from '@/types/game'

type SaveStatus = 'synced' | 'saving' | 'error' | 'offline' | '--'

export function useSaveGame(canSave = true) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('--')
  const [lastSaveLabel, setLastSaveLabel] = useState('--')
  const localSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const cloudSaveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastCloudSaveRef = useRef<number>(0)
  const mountedRef = useRef(false)
  const canSaveRef = useRef(canSave)
  const wasBlockedRef = useRef(!canSave)
  canSaveRef.current = canSave

  // Performs a cloud save - rate-limited client-side as well as server-side
  const doCloudSave = useCallback(async () => {
    if (!canSaveRef.current) return
    const state = useGameStore.getState()
    if (!state._initialized) return

    const now = Date.now()
    if (now - lastCloudSaveRef.current < SAVE_RATE_LIMIT_MS) return

    setSaveStatus('saving')

    const serialized = serialiseState(state)

    try {
      const result = await saveState({
        save: serialized,
        lastSavedTime: serialized.lastSavedTime,
        lifetimePoints: serialized.lifetimePoints,
        currentPoints: serialized.researchPoints,
        cachedPPS: serialized.cachedPointsPerSecond
      })

      if (result.success) {
        lastCloudSaveRef.current = now
        setSaveStatus('synced')
        setLastSaveLabel(formatDateTime(now))
      } else if (result.error === 'Rate limited') {
        // Throttled by server cooldown; local state remains intact
        setSaveStatus('synced')
      } else if (result.error === 'Database offline') {
        setSaveStatus('offline')
      } else {
        setSaveStatus('error')
      }
    } catch {
      setSaveStatus('offline')
      window.dispatchEvent(new CustomEvent('arkalon_check_version'))
    }
  }, [])

  const runBoot = useCallback(async () => {
    if (!canSaveRef.current) return

    let resolvedCoreId = useUIStore.getState().playerCoreId
    if (!resolvedCoreId) {
      resolvedCoreId = await new Promise<string>((resolve) => {
        const current = useUIStore.getState().playerCoreId
        if (current) {
          resolve(current)
          return
        }
        let settled = false
        const finish = (id: string) => {
          if (settled) return
          settled = true
          clearTimeout(timer)
          unsub()
          resolve(id)
        }
        const unsub = useUIStore.subscribe((s) => {
          if (s.playerCoreId) finish(s.playerCoreId)
        })
        const timer = setTimeout(() => {
          let fallbackId: string | null = null
          try {
            fallbackId = localStorage.getItem('arkalon_labs_player_id')
          } catch {}
          finish(fallbackId || '11111111-1111-4111-8111-111111111111')
        }, 6000)
      })
    }
    if (!canSaveRef.current) return
    initPlayerLocalStorage(resolvedCoreId)

    let loadedState = null
    let cloudState: Record<string, unknown> | null = null
    let cloudTime = 0

    // 1. Check local and cloud saves, load whichever has the newer timestamp
    const localState = loadFromLocalStorage()
    const localTime = localState
      ? localState.lastSavedTime > 0
        ? localState.lastSavedTime
        : getLastSaveTime()
      : 0

    try {
      const result = await loadState()
      if (result.success && result.state) {
        cloudState = result.state
        cloudTime = Number(result.state.lastSavedTime ?? 0)

        if (cloudTime >= localTime) {
          loadedState = deserialiseState(result.state)
        } else if (localState) {
          loadedState = localState
        } else {
          loadedState = deserialiseState(result.state)
        }
      }
    } catch {
      // Cloud unavailable - fall through to localStorage
    }

    if (!canSaveRef.current) return

    if (!loadedState && localState) {
      loadedState = localState
    }

    // 2. Apply loaded state and offline progress
    if (loadedState) {
      // Sync saved notation mode on startup
      if (loadedState.settings?.notationMode) {
        setNotationMode(loadedState.settings.notationMode)
      }
      if (loadedState.settings?.currentUITheme) {
        import('@/components/settings/SettingsPanel').then(
          ({ applyThemeVariables, THEME_CONFIG }) => {
            const theme = loadedState.settings.currentUITheme
            if (theme in THEME_CONFIG) {
              applyThemeVariables(theme as UITheme)
            }
          }
        )
      }
      document.documentElement.setAttribute(
        'data-neon-bloom',
        String(loadedState.settings?.neonBloom ?? true)
      )
      document.documentElement.setAttribute(
        'data-reduced-motion',
        String(loadedState.settings?.reducedMotion ?? false)
      )
      if (loadedState.settings?.audioMuted) {
        useMusicStore.getState().setMuted(true)
      }
      if (loadedState.settings?.volumeMusic !== undefined) {
        useMusicStore.getState().setVolumeBGM(loadedState.settings.volumeMusic)
      }
      if (loadedState.settings?.volumeSFX !== undefined) {
        useMusicStore.getState().setVolumeSFX(loadedState.settings.volumeSFX)
      }
      if (loadedState.settings?.volumeVoice !== undefined) {
        useMusicStore
          .getState()
          .setVolumeVoice(loadedState.settings.volumeVoice)
      }

      const authoritativeSaveTime =
        loadedState.lastSavedTime > 0
          ? loadedState.lastSavedTime
          : Math.max(localTime, cloudTime)
      const lastSaveTime =
        authoritativeSaveTime > 0 ? authoritativeSaveTime : Date.now() - 5000

      // Ensure cached PPS reflects actual generator and research production before calculating offline gains
      loadedState.cachedPointsPerSecond = recalculatePPS(loadedState)

      const offlinePayload = calculateOfflineProgress(
        loadedState,
        lastSaveTime,
        Date.now()
      )

      const updatedCurrencies = applyOfflineProgress(
        loadedState,
        offlinePayload
      )
      const prevOffline = loadedState.stats?.totalOfflineTime ?? 0
      const updatedOffline =
        prevOffline + Math.floor(offlinePayload.actualElapsedSeconds)
      const mergedState = {
        ...loadedState,
        ...updatedCurrencies,
        stats: {
          ...loadedState.stats,
          totalOfflineTime: updatedOffline
        }
      }
      useGameStore.getState().applyState(mergedState)
      saveToLocalStorage(useGameStore.getState())

      if (offlinePayload.megaprojectCompletedId) {
        dispatchMegaprojectComplete(offlinePayload.megaprojectCompletedId)
      }

      // Check for operation cycle advance
      const serverCycle = cloudState?._serverCycleNumber
      if (serverCycle && typeof serverCycle === 'number') {
        checkOperationCycle(serverCycle)
      }

      if (updatedOffline >= 180000) {
        awardRelic(5)
      }

      // Show offline diagnostic modal if away for at least 60s with earnings or completions
      const storedVersion = (() => {
        try {
          return localStorage.getItem('arkalon_labs_version')
        } catch {
          return null
        }
      })()
      const isFirstTimeVisitor = !storedVersion
      const hasOfflineActivity =
        offlinePayload.rpEarned > 0n ||
        (offlinePayload.dustEarned ?? 0) > 0 ||
        (offlinePayload.operationPointsEarned ?? 0) > 0 ||
        (offlinePayload.researchCompletedNames?.length ?? 0) > 0 ||
        (offlinePayload.probesCompletedCount ?? 0) > 0
      if (
        offlinePayload.actualElapsedSeconds >= 60 &&
        hasOfflineActivity &&
        !isFirstTimeVisitor
      ) {
        useUIStore.getState().setOfflinePayload(offlinePayload)
        useUIStore.getState().setOfflineModalOpen(true)
      }
    } else {
      document.documentElement.setAttribute('data-neon-bloom', 'true')
      document.documentElement.setAttribute('data-reduced-motion', 'false')
    }

    // Ensure operation cycle is current for all players (cloud and local-only)
    const CYCLE_DURATION_MS = 90 * 24 * 3600 * 1000
    const clientCycleNumber = Math.floor(Date.now() / CYCLE_DURATION_MS) + 1
    const currentCycle = useGameStore.getState().currentOperationCycle
    if (clientCycleNumber !== currentCycle) {
      checkOperationCycle(clientCycleNumber)
    }

    useGameStore.getState().setInitialized(true)
    setSaveStatus(cloudState ? 'synced' : 'offline')
  }, [])

  // On mount: load latest save and apply offline progress
  useEffect(() => {
    if (mountedRef.current) return
    mountedRef.current = true
    runBoot()
  }, [runBoot])

  // Re-hydrate from latest save if this tab transitions from duplicate to active owner
  useEffect(() => {
    if (!canSave) {
      wasBlockedRef.current = true
      return
    }
    if (wasBlockedRef.current) {
      wasBlockedRef.current = false
      useGameStore.getState().setInitialized(false)
      runBoot()
    }
  }, [canSave, runBoot])

  // Auto-save timers & unload listeners (disabled while duplicate tab is blocked)
  useEffect(() => {
    const saveLocalIfReady = () => {
      if (!canSaveRef.current) return
      const state = useGameStore.getState()
      if (!state._initialized) return
      saveToLocalStorage(state)
    }

    // Local save every 5 seconds
    localSaveTimerRef.current = setInterval(
      saveLocalIfReady,
      LOCAL_SAVE_INTERVAL_MS
    )

    // Cloud save every 60 seconds
    cloudSaveTimerRef.current = setInterval(() => {
      doCloudSave()
    }, CLOUD_SAVE_INTERVAL_MS)

    const handleVisibilitySave = () => {
      if (document.visibilityState === 'hidden') {
        saveLocalIfReady()
      }
    }

    // Save immediately when backgrounded, hidden, or unloaded
    window.addEventListener('beforeunload', saveLocalIfReady)
    window.addEventListener('pagehide', saveLocalIfReady)
    document.addEventListener('visibilitychange', handleVisibilitySave)

    return () => {
      if (localSaveTimerRef.current) clearInterval(localSaveTimerRef.current)
      if (cloudSaveTimerRef.current) clearInterval(cloudSaveTimerRef.current)
      window.removeEventListener('beforeunload', saveLocalIfReady)
      window.removeEventListener('pagehide', saveLocalIfReady)
      document.removeEventListener('visibilitychange', handleVisibilitySave)
    }
  }, [doCloudSave])

  return { saveStatus, lastSaveLabel, doCloudSave }
}
