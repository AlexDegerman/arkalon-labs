'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'
import {
  selectNextAnomaly,
  getEffectiveDuration,
  getNextSpawnInterval,
  buildAnomalyReward,
  ANOMALY_DEFINITIONS,
  OPERATION_ANOMALY_DEFINITIONS
} from '@/lib/anomalyDefs'
import { markUnlocksDirty, markAchievementsDirty, markTutorialDirty } from '@/lib/dirtyFlags'
import {
  dispatchAnomalyResolved,
  dispatchRelicDiscovered
} from '@/lib/dialogueDispatcher'
import { earnOperationPoints } from './operationActions'

// Anomaly actions

// Called by the tick loop when the spawn check timer reaches 0
export function checkAnomalySpawn(): void {
  const store = useGameStore.getState()
  if (!store.unlocks.anomalies) return
  if (store.activeAnomalyType) return
  // SC5, EC4: no anomalies
  if (store.activeChallengeRestrictions?.anomaliesDisabled) return

  const def = selectNextAnomaly(store)
  const duration = getEffectiveDuration(def, store)
  const nextCheck = getNextSpawnInterval(store)

  useGameStore.setState({
    activeAnomalyType: def.type,
    anomalyTimeRemaining: duration,
    anomalyInteractionValue: 0,
    timeToNextAnomalyCheck: nextCheck
  })

  // Transition BGM to anomaly context
  useMusicStore.getState().setContext('anomaly')

  // Fire tutorial beat for first anomaly
  markTutorialDirty()

  // Push anomaly alert
  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'anomaly',
    title: def.label,
    message: def.description,
    autoDismissMs: 5000
  })
}

// Called when the player successfully resolves an anomaly
// interactionScore: 0.0-1.0
export function resolveAnomaly(interactionScore: number): void {
  const store = useGameStore.getState()
  if (!store.activeAnomalyType) return

  const allDefs = [...ANOMALY_DEFINITIONS, ...OPERATION_ANOMALY_DEFINITIONS]
  const def = allDefs.find((d: any) => d.type === store.activeAnomalyType)
  if (!def) return

  const reward = buildAnomalyReward(def, interactionScore, store)

  // Apply instant RP payout
  let rpGain = reward.instantRPPayout + reward.rpReward

  // Apply dust
  const newDust = store.artifactDust + reward.dustDropped

  // Unlock relic if dropped
  const newUnlocked =
    reward.relicDropped > 0 &&
    !store.unlockedRelics.includes(reward.relicDropped)
      ? [...store.unlockedRelics, reward.relicDropped]
      : store.unlockedRelics

  if (
    reward.relicDropped > 0 &&
    !store.unlockedRelics.includes(reward.relicDropped)
  ) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Discovered',
      message: `A new relic has been added to your collection.`,
      autoDismissMs: 5000
    })
  }

  // Apply R4: reduce running research timers
  let updatedSlots = store.activeResearchSlots
  if (reward.researchTimeReduction > 0) {
    updatedSlots = store.activeResearchSlots.map((slot) => {
      if (!slot.nodeId || slot.timerRemaining <= 0) return slot
      return {
        ...slot,
        timerRemaining: Math.max(
          0,
          slot.timerRemaining - reward.researchTimeReduction
        )
      }
    })
  }

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints + rpGain,
    lifetimePoints: s.lifetimePoints + rpGain,
    artifactDust: newDust,
    unlockedRelics: newUnlocked,
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    anomalyInteractionValue: 0,
    activeResearchSlots: updatedSlots,
    stats: {
      ...s.stats,
      totalAnomaliesResolved: s.stats.totalAnomaliesResolved + 1
    }
  }))

  // Return to idle BGM
  useMusicStore.getState().setContext('idle')

  // Award operation points for operation anomalies
  const isOperationAnomaly = store.activeAnomalyType?.startsWith('operation_')
  if (isOperationAnomaly && store.activeAnomalyType) {
    earnOperationPoints(store.activeAnomalyType, interactionScore)
  }

  markUnlocksDirty()
  markAchievementsDirty()

  dispatchAnomalyResolved(reward.wasMaxReward)

  if (reward.relicDropped > 0) {
    dispatchRelicDiscovered()
  }

  if (rpGain > 0n) {
    useGameStore.getState().recalcPPS()
  }
}

// Dismisses the active anomaly without reward (timer expired or skipped)
export function dismissAnomaly(): void {
  const store = useGameStore.getState()
  if (!store.activeAnomalyType) return

  const nextCheck = getNextSpawnInterval(store)

  useGameStore.setState({
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    anomalyInteractionValue: 0,
    timeToNextAnomalyCheck: nextCheck
  })

  useMusicStore.getState().setContext('idle')
}

// Updates the anomaly interaction value (used by interaction widgets)
export function updateAnomalyInteraction(value: number): void {
  useGameStore.setState({ anomalyInteractionValue: value })
}
