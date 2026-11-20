'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'
import {
  selectNextAnomaly,
  getEffectiveDuration,
  getNextSpawnInterval,
  ANOMALY_DEFINITIONS,
  OPERATION_ANOMALY_DEFINITIONS,
  FUSED_ANOMALY_DEFINITIONS
} from '@/lib/anomalyDefs'
import type { AnomalyType } from '@/types/game'
import {
  markUnlocksDirty,
  markAchievementsDirty,
  markTutorialDirty
} from '@/lib/dirtyFlags'
import {
  dispatchAnomalyResolved,
  dispatchAnomalySpawn,
} from '@/lib/dialogueDispatcher'
import { playSound } from '@/hooks/useSound'
import { awardRelic } from './relicActions'

// Anomaly actions

// Called by the tick loop when the spawn check timer reaches 0 or forced via cascade/collider
export function checkAnomalySpawn(
  force = false,
  presetType?: AnomalyType
): void {
  const store = useGameStore.getState()
  if (!store.unlocks.anomalies && !force) return
  if (store.activeAnomalyType) return
  // SC5, EC4: no anomalies
  if (store.activeChallengeRestrictions?.anomaliesDisabled) return

  const allDefs = [
    ...ANOMALY_DEFINITIONS,
    ...OPERATION_ANOMALY_DEFINITIONS,
    ...FUSED_ANOMALY_DEFINITIONS
  ]
  const def = presetType
    ? (allDefs.find((d) => d.type === presetType) ?? selectNextAnomaly(store))
    : selectNextAnomaly(store)

  const duration = getEffectiveDuration(def, store)
  const nextCheck = getNextSpawnInterval(store)

  useGameStore.setState({
    activeAnomalyType: def.type,
    anomalyTimeRemaining: duration,
    timeToNextAnomalyCheck: nextCheck
  })

  // Transition BGM to anomaly context
  useMusicStore.getState().setContext('anomaly')

  // Recalculate PPS to apply passive buffer
  useGameStore.getState().recalcPPS()

  playSound('spawn')
  dispatchAnomalySpawn(def.type)
  markTutorialDirty()

  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'anomaly',
    title: def.label,
    message: `${def.rewardDescription} active for ${Math.round(duration)}s.`,
    autoDismissMs: 5000
  })
}

// Auto-called when an active anomaly buff window expires
export function completeAnomaly(): void {
  const store = useGameStore.getState()
  if (!store.activeAnomalyType) return

  const allDefs = [
    ...ANOMALY_DEFINITIONS,
    ...OPERATION_ANOMALY_DEFINITIONS,
    ...FUSED_ANOMALY_DEFINITIONS
  ]
  const def = allDefs.find((d) => d.type === store.activeAnomalyType)

  useGameStore.setState((s) => ({
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    stats: {
      ...s.stats,
      totalAnomaliesResolved: s.stats.totalAnomaliesResolved + 1
    }
  }))

  if (store.stats.totalAnomaliesResolved + 1 >= 10) {
    awardRelic(6)
  }

  // Return to idle BGM
  useMusicStore.getState().setContext('idle')

  if (def) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: `${def.label} Ended`,
      message: 'Facility parameters returned to baseline.',
      autoDismissMs: 3000
    })
  }

  markUnlocksDirty()
  markAchievementsDirty()
  dispatchAnomalyResolved()
  useGameStore.getState().recalcPPS()

  // Passive 10% cascade chance to chain a follow-up anomaly
  if (Math.random() < 0.1) {
    setTimeout(() => {
      checkAnomalySpawn(true)
    }, 400)
  }
}

// Particle Collider: Synthesize an anomaly on demand using 25 Artifact Dust
export function synthesizeAnomaly(): void {
  const store = useGameStore.getState()
  if (!store.unlocks.anomalies) return
  if (store.activeAnomalyType) return
  if (store.activeChallengeRestrictions?.anomaliesDisabled) return
  if (store.artifactDust < 25) return

  useGameStore.setState({
    artifactDust: store.artifactDust - 25
  })

  playSound('spawn')
  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'unlock',
    title: 'Particle Collider Activated',
    message: 'Sub-atomic dust stream fused. Artificial surge emerging.',
    autoDismissMs: 4000
  })

  checkAnomalySpawn(true)
}
