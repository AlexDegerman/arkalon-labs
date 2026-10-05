'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  checkUnlocks,
  checkEraTransition,
  checkTutorialBeats,
  checkAchievements
} from '@/lib/unlockWatcher'
import {
  markUnlocksDirty,
  markTutorialDirty,
  consumeUnlocksDirty,
  consumeTutorialDirty,
  consumeAchievementsDirty
} from '@/lib/dirtyFlags'
import { getEffectiveConstructionCost } from '@/lib/megaprojectDefs'
import { canPrestigeTier1, canPrestigeTier2 } from '@/lib/prestigeCalc'
import {
  AUTO_PRESTIGE_COUNTDOWN_SECONDS,
  ANOMALY_GRACE_SECONDS
} from '@/constants/game'
import { dismissAnomaly, checkAnomalySpawn } from './anomalyActions'
import { processProbeCompletions } from './excavationActions'
import { checkMegaprojectCompletion } from './megaprojectActions'
import { handleResearchCompletions } from './researchActions'
import { checkChallengeCompletion } from './challengeActions'
import { tickAutomation } from './automationActions'
import { triggerTierI, triggerTierII } from './prestigeActions'
import type { GameState } from '@/types/game'

// Single 100ms tick dispatched by useGameLoop
// CRITICAL: reads only cachedPointsPerSecond - never calls recalculatePPS
// All production formula computation happens only when inputs change
export function tick(): void {
  const store = useGameStore.getState()

  // Skip tick if game is paused
  if (store.settings.gamePaused) return

  // Read the cached PPS - this is the ONLY production read in the tick
  const pps = store.cachedPointsPerSecond
  const tickRP = pps / 10n // 100ms = 1/10 of a second

  let nextState: Partial<GameState> = {}

  // 1. Accumulate RP
  const newRP = store.researchPoints + tickRP
  const newLifetime = store.lifetimePoints + tickRP
  nextState.researchPoints = newRP
  nextState.lifetimePoints = newLifetime

  if (tickRP > 0n) {
    markUnlocksDirty()
  }

  // 2. Decrement active research timers
  // AC3 challenge: research timers do not tick (frozen)
  const researchTimersFrozen =
    store.activeChallengeRestrictions?.noResearchTimerTick ?? false
  const updatedSlots = store.activeResearchSlots.map((slot) => {
    if (!slot.nodeId || slot.timerRemaining <= 0) return slot
    if (researchTimersFrozen) return slot // AC3: timers are frozen
    const next = Math.max(0, slot.timerRemaining - 0.1)
    if (next === 0 && slot.timerRemaining > 0) {
      markTutorialDirty()
    }
    return { ...slot, timerRemaining: next }
  })
  nextState.activeResearchSlots = updatedSlots

  // 3. Decrement relic slot cooldowns
  const updatedRelicSlots = store.relicSlots.map((slot) => {
    if (slot.cooldownRemaining <= 0) return slot
    return {
      ...slot,
      cooldownRemaining: Math.max(0, slot.cooldownRemaining - 0.1)
    }
  })
  nextState.relicSlots = updatedRelicSlots

  // 4. Decrement anomaly timer
  let anomalyExpired = false
  if (store.activeAnomalyType && store.anomalyTimeRemaining > 0) {
    const nextTimer = Math.max(0, store.anomalyTimeRemaining - 0.1)
    nextState.anomalyTimeRemaining = nextTimer
    if (nextTimer === 0) {
      anomalyExpired = true
    }
  }

  // 5. Decrement anomaly spawn check timer
  let anomalySpawnReady = false
  if (store.unlocks.anomalies && !store.activeAnomalyType) {
    const nextSpawnTimer = Math.max(0, store.timeToNextAnomalyCheck - 0.1)
    nextState.timeToNextAnomalyCheck = nextSpawnTimer
    if (nextSpawnTimer === 0 && store.timeToNextAnomalyCheck > 0) {
      anomalySpawnReady = true
    }
  }

  // 6. Decrement probe timers and process completions
  let probeCompletionsReady = false
  if (store.probes.length > 0) {
    const updatedProbes = store.probes.map((probe) => {
      if (probe.status === 'scanning' && probe.timerRemaining > 0) {
        return {
          ...probe,
          timerRemaining: Math.max(0, probe.timerRemaining - 0.1)
        }
      }
      if (probe.status === 'repairing' && probe.repairTimerRemaining > 0) {
        return {
          ...probe,
          repairTimerRemaining: Math.max(0, probe.repairTimerRemaining - 0.1)
        }
      }
      return probe
    })
    nextState.probes = updatedProbes

    // Check for newly completed scans after timer update
    probeCompletionsReady = updatedProbes.some(
      (p) =>
        (p.status === 'scanning' && p.timerRemaining <= 0) ||
        (p.status === 'repairing' && p.repairTimerRemaining <= 0)
    )
  }

  // 7. Megaproject RP absorption
  let megaprojectCompletionReady = false
  if (store.activeMegaprojectId && store.megaprojectAllocationPercent > 0) {
    const allocFraction = BigInt(store.megaprojectAllocationPercent)
    const absorbed = (pps * allocFraction) / 1000n // per 100ms tick
    const newAbsorbed = store.megaprojectRPAbsorbed + absorbed
    nextState.megaprojectRPAbsorbed = newAbsorbed

    // Check completion after update
    const megaCost = getEffectiveConstructionCost(
      store.activeMegaprojectId,
      store
    )
    if (newAbsorbed >= megaCost) {
      megaprojectCompletionReady = true
    }
  }

  // 8. Session playtime (peak PPS now updated in recalcPPS, not here)
  const updatedStats = {
    ...store.stats,
    totalSessionPlaytime: store.stats.totalSessionPlaytime + 0.1
  }
  nextState.stats = updatedStats

  // Mark tutorial dirty at the 5-minute milestone for tutorial_end evaluation
  if (
    !store.tutorial.tutorialCompleted &&
    Math.floor(store.stats.totalSessionPlaytime / 10) <
      Math.floor((store.stats.totalSessionPlaytime + 0.1) / 10)
  ) {
    markTutorialDirty()
  }

  // Apply all state changes in a single setState call
  useGameStore.setState((s) => ({ ...s, ...nextState }))

  // Post-tick synchronous dispatches (after state is committed)
  if (anomalyExpired) dismissAnomaly()
  if (anomalySpawnReady) checkAnomalySpawn()
  if (probeCompletionsReady) processProbeCompletions()
  if (megaprojectCompletionReady) checkMegaprojectCompletion()

  // 9. Deferred: check research completions
  handleResearchCompletions(updatedSlots)

  // 10. Deferred: unlock check (dirty flag)
  if (consumeUnlocksDirty()) {
    const cs = useGameStore.getState()
    checkUnlocks(cs)
    checkEraTransition(cs)
    // Check active challenge completion
    if (cs.activeChallengeId) {
      checkChallengeCompletion()
    }
  }

  // 11. Deferred: tutorial beats
  if (consumeTutorialDirty()) {
    checkTutorialBeats(useGameStore.getState())
  }

  // 12. Deferred: achievements check
  if (consumeAchievementsDirty()) {
    checkAchievements(useGameStore.getState())
  }

  // 13. Auto-prestige check (Automated Lab / EC3 forced / Automated Timeline Severance)
  if (
    store.automation.autoPrestigeTierI ||
    store.automation.autoPrestigeTierII ||
    store.activeChallengeRestrictions?.autoPrestigeIntervalSeconds != null
  ) {
    checkAutoPrestige(store)
  }

  // 14. Automation tick (runs on sub-intervals within the main 100ms tick)
  tickAutomation()
}

// Auto-prestige countdown state
let autoPrestigeCountdown = 0
let autoPrestigeTier: 1 | 2 | 0 = 0

function checkAutoPrestige(store: GameState): void {
  // EC3 challenge: forced prestige every 5 minutes (300s interval)
  const forcedInterval =
    store.activeChallengeRestrictions?.autoPrestigeIntervalSeconds
  if (
    forcedInterval !== null &&
    forcedInterval !== undefined &&
    store.activeChallengeId
  ) {
    const elapsed = (Date.now() - store.stats.lastPrestigeTime) / 1000
    if (elapsed >= forcedInterval) {
      triggerTierI()
    }
    return
  }

  // Determine which tier to auto-prestige
  let targetTier: 1 | 2 | 0 = 0
  if (store.automation.autoPrestigeTierII && canPrestigeTier2(store)) {
    targetTier = 2
  } else if (store.automation.autoPrestigeTierI && canPrestigeTier1(store)) {
    targetTier = 1
  }
  if (targetTier === 0) {
    autoPrestigeCountdown = 0
    autoPrestigeTier = 0
    return
  }

  // Don't fire if a manual prestige dialog is open (no way to detect from tick
  // user must dismiss dialog first - the automation simply won't count down)

  // Give active anomaly grace period
  if (store.activeAnomalyType && store.anomalyTimeRemaining > 0) {
    if (store.anomalyTimeRemaining > ANOMALY_GRACE_SECONDS) {
      autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS
      return
    }
  }

  if (autoPrestigeTier !== targetTier) {
    autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS
    autoPrestigeTier = targetTier
  }

  autoPrestigeCountdown = Math.max(0, autoPrestigeCountdown - 0.1)

  if (autoPrestigeCountdown <= 0) {
    autoPrestigeTier = 0
    autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS

    if (targetTier === 2) {
      triggerTierII()
    } else {
      triggerTierI()
    }
  }
}
