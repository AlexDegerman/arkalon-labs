'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '../uiStore'
import {
  checkUnlocks,
  checkEraTransition,
  checkEndgameVictory,
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
import {
  getEffectiveConstructionCost,
  getMegaprojectPhase
} from '@/lib/megaprojectDefs'
import {
  buildTier1ResetState,
  calculateARGain,
  calculateCFGain,
  calculateOSGain,
  canPrestigeTier1,
  canPrestigeTier2,
  canPrestigeTier3
} from '@/lib/prestigeCalc'
import {
  AUTO_PRESTIGE_COUNTDOWN_SECONDS,
  ANOMALY_GRACE_SECONDS,
  MAX_RP_HARD_CAP
} from '@/constants/game'
import { checkAnomalySpawn, completeAnomaly } from './anomalyActions'
import { processProbeCompletions } from './excavationActions'
import { checkMegaprojectCompletion } from './megaprojectActions'
import { handleResearchCompletions } from './researchActions'
import { checkChallengeCompletion } from './challengeActions'
import { tickAutomation } from './automationActions'
import { triggerTierI, triggerTierII, triggerTierIII } from './prestigeActions'
import type { GameState } from '@/types/game'
import { playSound } from '@/hooks/useSound'
import { getAnomalyBuffScale } from '@/lib/anomalyDefs'
import { awardRelic } from './relicActions'
import { dispatchAnomalyIncoming } from '@/lib/dialogueDispatcher'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'

let ppsRemainder = 0n
let tickCounter = 0
let dustRemainder = 0
let opRemainder = 0
let r7ExpiryHandledFor = -1

// Single 100ms tick dispatched by useGameLoop
// CRITICAL: reads only cachedPointsPerSecond - never calls recalculatePPS
// All production formula computation happens only when inputs change
export function tick(): void {
  const store = useGameStore.getState()

  tickCounter++

  // Read the cached PPS - this is the ONLY production read in the tick
  const pps = store.cachedPointsPerSecond
  const totalThisTick = pps + ppsRemainder
  const tickRP = totalThisTick / 10n // 100ms = 1/10 of a second
  ppsRemainder = totalThisTick % 10n

  const nextState: Partial<GameState> = {}

  // 1. Accumulate RP (siphoning active megaproject allocation)
  const megaAlloc = store.activeMegaprojectId
    ? BigInt(store.megaprojectAllocationPercent)
    : 0n
  const allocatedRP = (tickRP * megaAlloc) / 100n
  const surplusRP = tickRP - allocatedRP

  const rawRP = store.researchPoints + surplusRP
  const rawLifetime = store.lifetimePoints + tickRP
  const newRP = rawRP > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : rawRP
  const newLifetime =
    rawLifetime > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : rawLifetime
  nextState.researchPoints = newRP
  nextState.lifetimePoints = newLifetime

  const shouldAwardRelic19 =
    newLifetime >= 10n ** 63n && !store.unlockedRelics.includes(19)

  if (tickRP > 0n && tickCounter % 10 === 0) {
    markUnlocksDirty()
  }

  // 2. Decrement active research timers
  // AC3/AC8 challenge: timers only advance while an anomaly is active
  const researchTimersFrozen =
    store.activeChallengeRestrictions?.noResearchTimerTick ?? false
  const buffScale = getAnomalyBuffScale(store)
  const r4Boost =
    !store.activeChallengeRestrictions?.techMatrixDisabled &&
    store.completedResearchNodes.includes('R4') &&
    store.activeAnomalyType
      ? 2
      : 1
  const anomalyResearchSpeed =
    store.activeAnomalyType === 'temporal_distortion' ||
    store.activeAnomalyType === 'fused_chronal_breach'
      ? 10 * buffScale
      : store.activeAnomalyType === 'operation_chrono_freeze'
        ? 5 * buffScale
        : 1
  const researchSpeedMult = anomalyResearchSpeed * r4Boost
  const hasRunningSlot = store.activeResearchSlots.some((slot) =>
    Boolean(slot.nodeId && slot.timerRemaining > 0)
  )
  let updatedSlots = store.activeResearchSlots
  if (
    hasRunningSlot &&
    (!researchTimersFrozen || Boolean(store.activeAnomalyType))
  ) {
    updatedSlots = store.activeResearchSlots.map((slot) => {
      if (!slot.nodeId || slot.timerRemaining <= 0) return slot
      const delta = researchTimersFrozen
        ? 0.1 * 5 * researchSpeedMult
        : 0.1 * researchSpeedMult
      const next = Math.max(0, slot.timerRemaining - delta)
      if (next === 0 && slot.timerRemaining > 0) {
        markTutorialDirty()
      }
      return { ...slot, timerRemaining: next }
    })
    nextState.activeResearchSlots = updatedSlots
  }

  // 3. Decrement relic slot cooldowns
  if (store.relicSlots.some((slot) => slot.cooldownRemaining > 0)) {
    nextState.relicSlots = store.relicSlots.map((slot) => {
      if (slot.cooldownRemaining <= 0) return slot
      return {
        ...slot,
        cooldownRemaining: Math.max(0, slot.cooldownRemaining - 0.1)
      }
    })
  }

  // 4. Decrement anomaly timer
  let anomalyCompleted = false
  if (store.activeAnomalyType && store.anomalyTimeRemaining > 0) {
    const nextTimer = Math.max(0, store.anomalyTimeRemaining - 0.1)
    nextState.anomalyTimeRemaining = nextTimer
    if (nextTimer === 0) {
      anomalyCompleted = true
    }
  }

  // 5. Decrement anomaly spawn check timer (and spawn immediately if offline drained timer to 0)
  let anomalySpawnReady = false
  if (
    store.unlocks.anomalies &&
    !store.activeAnomalyType &&
    !store.activeChallengeRestrictions?.anomaliesDisabled
  ) {
    if (store.timeToNextAnomalyCheck <= 0) {
      anomalySpawnReady = true
    } else {
      const nextSpawnTimer = Math.max(0, store.timeToNextAnomalyCheck - 0.1)
      nextState.timeToNextAnomalyCheck = nextSpawnTimer
      if (
        store.completedResearchNodes.includes('O3') &&
        nextSpawnTimer <= 10 &&
        store.timeToNextAnomalyCheck > 10
      ) {
        playSound('alert')
        dispatchAnomalyIncoming()
      }
      if (nextSpawnTimer === 0) {
        anomalySpawnReady = true
      }
    }
  }

  // 6. Decrement probe timers and process completions (frozen when excavation is disabled)
  let probeCompletionsReady = false
  if (
    store.probes.length > 0 &&
    !store.activeChallengeRestrictions?.excavationDisabled
  ) {
    const hasTickingProbe = store.probes.some(
      (p) =>
        (p.status === 'scanning' && p.timerRemaining > 0) ||
        (p.status === 'repairing' && p.repairTimerRemaining > 0)
    )
    const updatedProbes = hasTickingProbe
      ? store.probes.map((probe) => {
          if (probe.status === 'scanning' && probe.timerRemaining > 0) {
            return {
              ...probe,
              timerRemaining: Math.max(0, probe.timerRemaining - 0.1)
            }
          }
          if (probe.status === 'repairing' && probe.repairTimerRemaining > 0) {
            return {
              ...probe,
              repairTimerRemaining: Math.max(
                0,
                probe.repairTimerRemaining - 0.1
              )
            }
          }
          return probe
        })
      : store.probes

    if (hasTickingProbe) {
      nextState.probes = updatedProbes
    }

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
    const absorptionMult =
      getMegaprojectPhase('chronos_array', store) >= 3 ? 120n : 100n
    const absorbedThisTick = (allocatedRP * absorptionMult) / 100n
    const newAbsorbed = store.megaprojectRPAbsorbed + absorbedThisTick
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

  // 8. Session playtime, cumulative totals & Synthesizer secondary resource accumulation
  const rawAllTime =
    (store.stats.allTimePoints ?? store.lifetimePoints) + tickRP
  const nextAllTimePoints =
    rawAllTime > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : rawAllTime

  if (tickCounter % 10 === 0) {
    const rates = getSynthesizerRates(store)
    let dustGain = 0
    if (rates.dustPerSec > 0) {
      dustRemainder += rates.dustPerSec
      dustGain = Math.floor(dustRemainder)
      if (dustGain > 0) {
        dustRemainder -= dustGain
        nextState.artifactDust = store.artifactDust + dustGain
      }
    }
    if (rates.opPerSec > 0) {
      opRemainder += rates.opPerSec
      const opGain = Math.floor(opRemainder)
      if (opGain > 0) {
        opRemainder -= opGain
        nextState.currentOperationPoints = store.currentOperationPoints + opGain
      }
    }

    if (store.activeChallengeId) {
      nextState.challengeActiveSeconds = (store.challengeActiveSeconds ?? 0) + 1
    }

    const currentPeakLifetime = store.stats.peakLifetimePoints ?? 0n
    const updatedStats = {
      ...store.stats,
      allTimePoints: nextAllTimePoints,
      allTimeDust: (store.stats.allTimeDust ?? store.artifactDust) + dustGain,
      totalSessionPlaytime: store.stats.totalSessionPlaytime + 1,
      currentRunSeconds: (store.stats.currentRunSeconds ?? 0) + 1,
      peakLifetimePoints:
        newLifetime > currentPeakLifetime ? newLifetime : currentPeakLifetime
    }
    nextState.stats = updatedStats

    // Mark tutorial dirty at the 5-minute milestone for tutorial_end evaluation
    if (
      !store.tutorial.tutorialCompleted &&
      Math.floor(updatedStats.totalSessionPlaytime / 10) !==
        Math.floor((updatedStats.totalSessionPlaytime - 1) / 10)
    ) {
      markTutorialDirty()
    }
  } else if (tickRP > 0n) {
    nextState.stats = {
      ...store.stats,
      allTimePoints: nextAllTimePoints
    }
  }

  // Apply all state changes in a single shallow-merged setState call
  useGameStore.setState(nextState)

  // Post-tick synchronous dispatches (after state is committed)
  if (shouldAwardRelic19) awardRelic(19)
  if (anomalyCompleted) completeAnomaly()
  if (anomalySpawnReady) checkAnomalySpawn()
  if (probeCompletionsReady) processProbeCompletions()
  if (megaprojectCompletionReady) checkMegaprojectCompletion()

  // R7 post-prestige buff expiry: recalc once when the 5-minute window ends
  if (
    store.completedResearchNodes.includes('R7') &&
    store.stats.lastPrestigeTime > 0 &&
    (store.stats.currentRunSeconds ?? 0) >= 300 &&
    r7ExpiryHandledFor !== store.stats.lastPrestigeTime
  ) {
    r7ExpiryHandledFor = store.stats.lastPrestigeTime
    useGameStore.getState().recalcPPS()
  }

  // 9. Deferred: check research completions
  handleResearchCompletions(updatedSlots)

  // 10. Deferred: unlock check (dirty flag)
  if (consumeUnlocksDirty()) {
    const cs = useGameStore.getState()
    checkUnlocks(cs)
    checkEraTransition(cs)
    checkEndgameVictory(cs)
  }

  // Active challenge completion check (evaluated every 1 second)
  if (store.activeChallengeId && tickCounter % 10 === 0) {
    checkChallengeCompletion()
  }

  // 11. Deferred: achievements check (before tutorial_end flips tutorialCompleted)
  if (consumeAchievementsDirty()) {
    checkAchievements(useGameStore.getState())
  }

  // 12. Deferred: tutorial beats
  if (consumeTutorialDirty()) {
    checkTutorialBeats(useGameStore.getState())
  }

  // 13. Auto-prestige check (Automated Lab / EC3 forced / Timeline Severance / Singular Synthesis)
  const latestStore = useGameStore.getState()
  if (
    latestStore.automation.autoPrestigeTierI ||
    latestStore.automation.autoPrestigeTierII ||
    latestStore.automation.autoPrestigeTierIII ||
    latestStore.activeChallengeRestrictions?.autoPrestigeIntervalSeconds != null
  ) {
    checkAutoPrestige(latestStore)
  }

  // 14. Automation tick (runs on sub-intervals within the main 100ms tick)
  tickAutomation()
}

// Auto-prestige countdown & run-stall tracking state
let autoPrestigeCountdown = 0
let autoPrestigeTier: 1 | 2 | 3 | 0 = 0
let stallTrackedRunTime = -1
let stallWindowStartSec = 0
let stallWindowBasePPS = 0n

function checkAutoPrestige(store: GameState): void {
  // EC3 challenge: forced recursive collapse every 5 minutes (300s interval)
  const forcedInterval =
    store.activeChallengeRestrictions?.autoPrestigeIntervalSeconds
  if (
    forcedInterval !== null &&
    forcedInterval !== undefined &&
    store.activeChallengeId
  ) {
    // Resolve challenge completion before evaluating forced collapse
    checkChallengeCompletion()
    const freshStore = useGameStore.getState()
    if (
      !freshStore.activeChallengeId ||
      freshStore.activeChallengeRestrictions?.autoPrestigeIntervalSeconds ==
        null
    ) {
      return
    }
    const elapsed = freshStore.stats.currentRunSeconds ?? 0
    if (elapsed >= forcedInterval) {
      const resetPatch = buildTier1ResetState(freshStore, 0, true, true)
      useGameStore.setState((s) => ({
        ...resetPatch,
        settings: s.settings,
        achievements: s.achievements,
        unlockedRelics: s.unlockedRelics,
        relicLevels: s.relicLevels,
        relicSlots: s.relicSlots,
        artifactDust: s.artifactDust,
        automation: s.automation,
        cfUpgrades: s.cfUpgrades,
        osUpgrades: s.osUpgrades,
        chronalFractures: s.chronalFractures,
        omniSpars: s.omniSpars,
        arUpgrades: s.arUpgrades,
        challengeRecords: s.challengeRecords,
        completedMegaprojects: s.completedMegaprojects,
        unlocks: s.unlocks,
        stats: {
          ...s.stats,
          lastPrestigeTime: Date.now(),
          currentRunSeconds: 0
        },
        activeChallengeId: s.activeChallengeId,
        activeChallengeRestrictions: s.activeChallengeRestrictions
      }))
      playSound('success')
      useGameStore.getState().recalcPPS()
      useUIStore.getState().pushAlert({
        priority: 1,
        variant: 'prestige',
        title: 'Recursive Collapse',
        message: 'Construct collapsed. Next collapse in 5m.',
        autoDismissMs: 4000
      })
    }
    return
  }

  // Determine which tier to auto-prestige
  let targetTier: 1 | 2 | 3 | 0 = 0
  const runElapsed = store.stats.currentRunSeconds ?? 0

  // Protect active Megaprojects from Auto-Prestige resets (bypass Dyson hold when Auto-Dyson is active)
  const activeMega = store.activeMegaprojectId
  const holdForDyson =
    (store.autoPrestigeHoldForDyson ?? false) &&
    !store.automation.autoDysonSwarm
  const megaProtected =
    activeMega !== null &&
    (store.megaprojectAllocationPercent > 0 ||
      store.megaprojectRPAbsorbed > 0n) &&
    (activeMega !== 'dyson_swarm' || holdForDyson)

  if (megaProtected) {
    autoPrestigeCountdown = 0
    autoPrestigeTier = 0
    const ui = useUIStore.getState()
    if (ui.autoPrestigePendingTier !== 0) {
      ui.setAutoPrestigePending(0, 0)
    }
    return
  }

  const holdTier2ForHigher =
    (store.autoPrestigeWaitForHigher ?? true) &&
    store.automation.autoPrestigeTierIII &&
    (store.osUpgrades.automated_singular_synthesis ?? 0) > 0

  // Minimum 15-second run duration prevents infinite instant-reset loops with Chronal Anchor
  if (runElapsed >= 15) {
    if (
      store.automation.autoPrestigeTierIII &&
      (store.osUpgrades.automated_singular_synthesis ?? 0) > 0 &&
      canPrestigeTier3(store) &&
      calculateOSGain(store) >= Math.max(1, store.autoPrestigeTargetOS ?? 10)
    ) {
      targetTier = 3
    } else if (
      store.automation.autoPrestigeTierII &&
      store.osUpgrades.automated_timeline_severance > 0 &&
      !holdTier2ForHigher &&
      canPrestigeTier2(store) &&
      calculateCFGain(store) >= Math.max(1, store.autoPrestigeTargetCF ?? 10)
    ) {
      targetTier = 2
    } else if (
      store.automation.autoPrestigeTierI &&
      store.osUpgrades.the_automated_lab > 0 &&
      canPrestigeTier1(store)
    ) {
      const arGain = calculateARGain(store)
      if (arGain > 0) {
        const mode = store.autoPrestigeMode ?? 'ratio'
        let shouldPrestige = false

        if (mode === 'target') {
          shouldPrestige = arGain >= (store.autoPrestigeTargetAR ?? 1000)
        } else if (mode === 'ratio') {
          const ratio = store.autoPrestigeRatio ?? 2
          const baselineAR = Math.max(
            store.arkalonResonance,
            Math.floor((store.resonanceMemoryAR ?? 0) * 0.25)
          )
          const target = Math.min(
            1_500_000_000,
            Math.max(25, Math.floor(baselineAR * ratio))
          )
          shouldPrestige = arGain >= target
        } else if (mode === 'stall') {
          const current = store.cachedPointsPerSecond
          if (store.stats.lastPrestigeTime !== stallTrackedRunTime) {
            stallTrackedRunTime = store.stats.lastPrestigeTime
            stallWindowStartSec = runElapsed
            stallWindowBasePPS = current
          } else if (runElapsed - stallWindowStartSec >= 15) {
            if (
              runElapsed >= 45 &&
              stallWindowBasePPS > 0n &&
              current <= (stallWindowBasePPS * 101n) / 100n
            ) {
              shouldPrestige = true
            }
            stallWindowStartSec = runElapsed
            stallWindowBasePPS = current
          }
        }

        if (shouldPrestige) {
          targetTier = 1
        }
      }
    }
  }

  const ui = useUIStore.getState()

  if (targetTier === 0) {
    autoPrestigeCountdown = 0
    autoPrestigeTier = 0
    if (ui.autoPrestigePendingTier !== 0) {
      ui.setAutoPrestigePending(0, 0)
    }
    return
  }

  // Give active anomaly grace period
  if (store.activeAnomalyType && store.anomalyTimeRemaining > 0) {
    if (store.anomalyTimeRemaining > ANOMALY_GRACE_SECONDS) {
      autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS
      if (ui.autoPrestigePendingTier !== 0) {
        ui.setAutoPrestigePending(0, 0)
      }
      return
    }
  }

  if (autoPrestigeTier !== targetTier) {
    autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS
    autoPrestigeTier = targetTier
  }

  autoPrestigeCountdown = Math.max(0, autoPrestigeCountdown - 0.1)
  const displaySec = Math.ceil(autoPrestigeCountdown)

  if (autoPrestigeCountdown <= 0) {
    autoPrestigeTier = 0
    autoPrestigeCountdown = AUTO_PRESTIGE_COUNTDOWN_SECONDS
    ui.setAutoPrestigePending(0, 0)
    if (targetTier === 3) {
      triggerTierIII()
    } else if (targetTier === 2) {
      triggerTierII()
    } else {
      triggerTierI()
    }
  } else if (
    ui.autoPrestigePendingTier !== targetTier ||
    ui.autoPrestigeCountdown !== displaySec
  ) {
    ui.setAutoPrestigePending(targetTier, displaySec)
  }
}

export function resetTickSession(): void {
  useUIStore.getState().setAutoPrestigePending(0, 0)
  ppsRemainder = 0n
  tickCounter = 0
  dustRemainder = 0
  opRemainder = 0
  r7ExpiryHandledFor = -1
  autoPrestigeCountdown = 0
  autoPrestigeTier = 0
  stallTrackedRunTime = -1
  stallWindowStartSec = 0
  stallWindowBasePPS = 0n
}