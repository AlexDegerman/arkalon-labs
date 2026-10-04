'use client'

// Core tick, generator purchase, and game loop actions
// Additional action groups appended in subsequent commits

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'
import {
  checkUnlocks,
  checkEraTransition,
  checkResearchSlotExpansion
} from '@/lib/unlockWatcher'
import {
  selectNextAnomaly,
  getEffectiveDuration,
  getNextSpawnInterval,
  buildAnomalyReward
} from '@/lib/anomalyDefs'
import type { AnomalyResultPayload } from '@/types/anomalies'
import {
  getRelicUpgradeCost,
  getRelicSlotCount,
  getSwapCooldownSeconds,
  canEquipToSlot,
  isRelicEquipped,
  getRelicSlotIndex
} from '@/lib/relicDefs'
import { PROBE_COST_RP, RELIC_LEVEL_CAP, UNSTABLE_RIFT_REPAIR_SECONDS } from '@/constants/game'
import { costToBuyN, maxAffordable, nextCost } from '@/lib/generatorCosts'
import {
  markUnlocksDirty,
  markTutorialDirty,
  markAchievementsDirty,
  consumeUnlocksDirty,
  consumeTutorialDirty,
  consumeAchievementsDirty
} from '@/lib/dirtyFlags'
import {
  isNodeAvailable,
  isNodeCompleted,
  isNodeActive,
  isNodeQueued,
  getNodeCost,
  getEffectiveStudyTime,
  getAvailableSlotIndex,
  getActiveSlotCount
} from '@/lib/researchNodes'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { RESEARCH_QUEUE_MAX_BASE } from '@/constants/game'
import type { ExcavationZone, GameState, ModuleType } from '@/types/game'
import type { BulkBuyAmount } from '@/constants/game'
import { canPrestigeTier1, calculateARGain, buildTier1ResetState, canPrestigeTier2, calculateCFGain, buildTier2ResetState, canPrestigeTier3, calculateOSGain, buildTier3ResetState } from '@/lib/prestigeCalc'
import { meetsProbeGateRequirements, canBuildProbe, nextProbeId, getScanDuration, rollProbeResult, ZONE_MAP } from '@/lib/excavationDefs'

export { markUnlocksDirty, markTutorialDirty, markAchievementsDirty }

// Single 100ms tick dispatched by useGameLoop
// CRITICAL: reads only cachedPointsPerSecond, never calls recalculatePPS
export function tick(): void {
  const store = useGameStore.getState()

  // Skip tick if game is paused
  if (store.settings.gamePaused) return

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
  const updatedSlots = store.activeResearchSlots.map((slot) => {
    if (!slot.nodeId || slot.timerRemaining <= 0) return slot
    const next = Math.max(0, slot.timerRemaining - 0.1)
    if (next === 0 && slot.timerRemaining > 0) {
      // Completion handled below after state update
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
  if (store.activeAnomalyType && store.anomalyTimeRemaining > 0) {
    const nextTimer = Math.max(0, store.anomalyTimeRemaining - 0.1)
    nextState.anomalyTimeRemaining = nextTimer
    if (nextTimer === 0) {
      // Timer expired - dismiss without reward after state update
      setTimeout(() => dismissAnomaly(), 0)
    }
  }

  // 5. Decrement anomaly spawn check timer
  if (store.unlocks.anomalies && !store.activeAnomalyType) {
    const nextSpawnTimer = Math.max(0, store.timeToNextAnomalyCheck - 0.1)
    nextState.timeToNextAnomalyCheck = nextSpawnTimer
    if (nextSpawnTimer === 0 && store.timeToNextAnomalyCheck > 0) {
      // Timer just hit zero - fire spawn check after state update
      setTimeout(() => checkAnomalySpawn(), 0)
    }
  }

  // 6. Decrement probe timers and process completions
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
    const hasCompletions = updatedProbes.some(
      (p) =>
        (p.status === 'scanning' && p.timerRemaining <= 0) ||
        (p.status === 'repairing' && p.repairTimerRemaining <= 0)
    )
    if (hasCompletions) {
      setTimeout(() => processProbeCompletions(), 0)
    }
  }

  // 7. Megaproject RP absorption (full logic in Commit 12.1)
  if (store.activeMegaprojectId && store.megaprojectAllocationPercent > 0) {
    const allocFraction = BigInt(store.megaprojectAllocationPercent)
    const absorbed = (pps * allocFraction) / 1000n // per 100ms tick
    nextState.megaprojectRPAbsorbed = store.megaprojectRPAbsorbed + absorbed
  }

  // 8. Session playtime
  const updatedStats = {
    ...store.stats,
    totalSessionPlaytime: store.stats.totalSessionPlaytime + 0.1
  }
  // Update peak PPS if current exceeds recorded peak
  if (pps > store.stats.peakRPPerSec) {
    updatedStats.peakRPPerSec = pps
  }
  nextState.stats = updatedStats

  // Apply all state changes in a single setState call
  useGameStore.setState((s) => ({ ...s, ...nextState }))

  // 9. Deferred: check research completions
  handleResearchCompletions(updatedSlots)

  // 10. Deferred: unlock check (dirty flag)
  if (consumeUnlocksDirty()) {
    const currentState = useGameStore.getState()
    checkUnlocks(currentState)
    checkEraTransition(currentState)
  }

  // 11. Deferred: tutorial beats (dirty flag) - wired in Commit 14.1
  if (consumeTutorialDirty()) {
    // checkTutorialBeats() called in Commit 14.1
  }

  // 12. Deferred: achievements check - wired in Commit 19.2
  if (consumeAchievementsDirty()) {
    // checkAchievements() called in Commit 19.2
  }

  // 13. Auto-prestige check (Automated Lab / Automated Timeline Severance)
  if (
    store.automation.autoPrestigeTierI ||
    store.automation.autoPrestigeTierII
  ) {
    checkAutoPrestige(store)
  }
}

// Auto-prestige countdown state
let autoPrestigeCountdown = 0
let autoPrestigeTier: 1 | 2 | 0 = 0

function checkAutoPrestige(store: GameState): void {
  const { canPrestigeTier1, canPrestigeTier2 } = require('@/lib/prestigeCalc')
  const {
    AUTO_PRESTIGE_COUNTDOWN_SECONDS,
    ANOMALY_GRACE_SECONDS
  } = require('@/constants/game')

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

// Research actions

// Starts studying a research node in the first available slot
export function startResearch(nodeId: string): void {
  const store = useGameStore.getState()

  if (!isNodeAvailable(nodeId, store)) return
  if (isNodeCompleted(nodeId, store)) return
  if (isNodeActive(nodeId, store)) return
  if (isNodeQueued(nodeId, store)) return

  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return

  const cost = getNodeCost(nodeId, store)
  if (store.researchPoints < cost) return

  // Infinite nodes complete instantly (no timer)
  if (node.isInfinite) {
    const newLevel = (store.infiniteResearchLevels[nodeId] ?? 0) + 1
    useGameStore.setState((s) => ({
      researchPoints: s.researchPoints - cost,
      infiniteResearchLevels: {
        ...s.infiniteResearchLevels,
        [nodeId]: newLevel,
      },
      completedResearchNodes: s.completedResearchNodes.includes(nodeId)
        ? s.completedResearchNodes
        : [...s.completedResearchNodes, nodeId],
      stats: {
        ...s.stats,
        totalResearchNodesCompleted: s.completedResearchNodes.length + 1,
      },
    }))
    useGameStore.getState().recalcPPS()
    markUnlocksDirty()
    return
  }

  // Check parallel slot rules: slots from different branches
  const slotCount = getActiveSlotCount(store)
  const filledSlots = store.activeResearchSlots
    .slice(0, slotCount)
    .filter((s) => s.nodeId !== null)

  // For parallel slots, verify different branch requirement
  for (const slot of filledSlots) {
    if (!slot.nodeId) continue
    const activeNode = RESEARCH_NODE_MAP[slot.nodeId]
    if (activeNode && activeNode.branch === node.branch) {
      // Same branch already being studied - queue it instead
      queueResearch(nodeId)
      return
    }
  }

  const slotIndex = getAvailableSlotIndex(store)
  if (slotIndex === -1) {
    // No empty slot - queue it
    queueResearch(nodeId)
    return
  }

  const studyTime = getEffectiveStudyTime(nodeId, store)

  useGameStore.setState((s) => {
    const newSlots = [...s.activeResearchSlots]
    // Ensure slot array is large enough
    while (newSlots.length <= slotIndex) {
      newSlots.push({ nodeId: null, timerRemaining: 0 })
    }
    newSlots[slotIndex] = { nodeId, timerRemaining: studyTime }

    return {
      researchPoints: s.researchPoints - cost,
      activeResearchSlots: newSlots,
    }
  })

  markTutorialDirty()
}

// Adds a node to the research queue
export function queueResearch(nodeId: string): void {
  const store = useGameStore.getState()

  if (!isNodeAvailable(nodeId, store)) return
  if (isNodeCompleted(nodeId, store)) return
  if (isNodeActive(nodeId, store)) return
  if (isNodeQueued(nodeId, store)) return

  // Determine queue max size (expanded by SC10 challenge completions)
  const sc10Tiers = store.challengeRecords['SC10']?.completedTiers ?? 0
  const queueMax = RESEARCH_QUEUE_MAX_BASE + sc10Tiers

  if (store.researchQueue.length >= queueMax) return

  useGameStore.setState((s) => ({
    researchQueue: [...s.researchQueue, nodeId],
  }))
}

// Removes a node from the research queue
export function dequeueResearch(nodeId: string): void {
  useGameStore.setState((s) => ({
    researchQueue: s.researchQueue.filter((id) => id !== nodeId),
  }))
}

// Reorders the research queue by moving nodeId to a new index
export function reorderQueue(nodeId: string, toIndex: number): void {
  const store = useGameStore.getState()
  const queue = [...store.researchQueue]
  const fromIndex = queue.indexOf(nodeId)
  if (fromIndex === -1) return

  queue.splice(fromIndex, 1)
  queue.splice(toIndex, 0, nodeId)

  useGameStore.setState({ researchQueue: queue })
}

// Called by Arkalon sphere click (O2 effect): reduces active timer by 5%
export function applyArkalonClickBoost(): void {
  const store = useGameStore.getState()
  if (!store.completedResearchNodes.includes('O2')) return

  useGameStore.setState((s) => ({
    activeResearchSlots: s.activeResearchSlots.map((slot) => {
      if (!slot.nodeId || slot.timerRemaining <= 0) return slot
      return {
        ...slot,
        timerRemaining: slot.timerRemaining * 0.95,
      }
    }),
  }))
}

// Anomaly actions

// Called by the tick loop when the spawn check timer reaches 0
export function checkAnomalySpawn(): void {
  const store = useGameStore.getState()
  if (!store.unlocks.anomalies) return
  if (store.activeAnomalyType) return
  if (store.activeChallengeRestrictions?.anomaliesDisabled) return

  const def = selectNextAnomaly(store)
  const duration = getEffectiveDuration(def, store)
  const nextCheck = getNextSpawnInterval(store)

  useGameStore.setState({
    activeAnomalyType: def.type,
    anomalyTimeRemaining: duration,
    anomalyInteractionValue: 0,
    timeToNextAnomalyCheck: nextCheck,
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
    autoDismissMs: 5000,
  })
}

// Called when the player successfully resolves an anomaly
// interactionScore: 0.0-1.0
export function resolveAnomaly(interactionScore: number): void {
  const store = useGameStore.getState()
  if (!store.activeAnomalyType) return

  const { ANOMALY_DEFINITIONS, OPERATION_ANOMALY_DEFINITIONS } =
    require('@/lib/anomalyDefs')
  const allDefs = [...ANOMALY_DEFINITIONS, ...OPERATION_ANOMALY_DEFINITIONS]
  const def = allDefs.find((d: any) => d.type === store.activeAnomalyType)
  if (!def) return

  const reward = buildAnomalyReward(def, interactionScore, store)

  // Apply instant RP payout
  let rpGain = reward.instantRPPayout + reward.rpReward

  // Apply dust
  const newDust = store.artifactDust + reward.dustDropped

  // Unlock relic if dropped
  const newUnlocked = reward.relicDropped > 0 &&
    !store.unlockedRelics.includes(reward.relicDropped)
    ? [...store.unlockedRelics, reward.relicDropped]
    : store.unlockedRelics

  if (reward.relicDropped > 0 && !store.unlockedRelics.includes(reward.relicDropped)) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Discovered',
      message: `A new relic has been added to your collection.`,
      autoDismissMs: 5000,
    })
  }

  // Apply R4: reduce running research timers
  let updatedSlots = store.activeResearchSlots
  if (reward.researchTimeReduction > 0) {
    updatedSlots = store.activeResearchSlots.map((slot) => {
      if (!slot.nodeId || slot.timerRemaining <= 0) return slot
      return {
        ...slot,
        timerRemaining: Math.max(0, slot.timerRemaining - reward.researchTimeReduction),
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
      totalAnomaliesResolved: s.stats.totalAnomaliesResolved + 1,
    },
  }))

  // Return to idle BGM
  useMusicStore.getState().setContext('idle')

  markUnlocksDirty()
  markAchievementsDirty()

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
    timeToNextAnomalyCheck: nextCheck,
  })

  useMusicStore.getState().setContext('idle')
}

// Updates the anomaly interaction value (used by interaction widgets)
export function updateAnomalyInteraction(value: number): void {
  useGameStore.setState({ anomalyInteractionValue: value })
}

// Relic actions

// Equips a relic into the first available slot
export function equipRelic(relicId: number): void {
  const store = useGameStore.getState()

  if (!store.unlockedRelics.includes(relicId)) return
  if (isRelicEquipped(relicId, store)) return

  const slotCount = getRelicSlotCount(store)
  const availableSlotIndex = store.relicSlots
    .slice(0, slotCount)
    .findIndex((s) => canEquipToSlot(s))

  if (availableSlotIndex === -1) return

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[availableSlotIndex] = {
      relicId,
      cooldownRemaining: 0,
    }
    return { relicSlots: newSlots }
  })

  useGameStore.getState().recalcPPS()
}

// Unequips a relic from its slot, starting the swap cooldown
export function unequipRelic(relicId: number): void {
  const store = useGameStore.getState()
  const slotIndex = getRelicSlotIndex(relicId, store)
  if (slotIndex === -1) return

  const cooldown = getSwapCooldownSeconds(store)

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[slotIndex] = {
      relicId: null,
      cooldownRemaining: cooldown,
    }
    return { relicSlots: newSlots }
  })

  useGameStore.getState().recalcPPS()
}

// Swaps a relic in a specific slot with a new relic
export function swapRelic(slotIndex: number, newRelicId: number): void {
  const store = useGameStore.getState()
  const slot = store.relicSlots[slotIndex]
  if (!slot) return
  if (slot.cooldownRemaining > 0) return
  if (!store.unlockedRelics.includes(newRelicId)) return
  if (isRelicEquipped(newRelicId, store)) return

  const cooldown = getSwapCooldownSeconds(store)

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[slotIndex] = {
      relicId: newRelicId,
      cooldownRemaining: 0,
    }
    // Start cooldown on this slot for next swap
    // The cooldown applies to the NEXT swap, not the current equip
    return { relicSlots: newSlots }
  })

  useGameStore.getState().recalcPPS()
}

// Upgrades a relic using artifact dust
export function upgradeRelic(relicId: number): void {
  const store = useGameStore.getState()

  if (!store.unlockedRelics.includes(relicId)) return

  const currentLevel = store.relicLevels[relicId] ?? 0
  if (currentLevel >= RELIC_LEVEL_CAP) return

  const cost = getRelicUpgradeCost(relicId, currentLevel)
  if (store.artifactDust < cost) return

  useGameStore.setState((s) => ({
    artifactDust: s.artifactDust - cost,
    relicLevels: {
      ...s.relicLevels,
      [relicId]: (s.relicLevels[relicId] ?? 0) + 1,
    },
  }))

  // Relic level changes affect production
  useGameStore.getState().recalcPPS()
  markAchievementsDirty()
}

// Prestige actions

// Performs a Tier I Reality Recalibration prestige
export function triggerTierI(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier1(store)) return

  const arGained = calculateARGain(store)
  const resetPatch = buildTier1ResetState(store, arGained)

  // Anomalous Operations unlock on first prestige
  const firstPrestige = store.stats.totalPrestigesTier1 === 0

  useGameStore.setState((s) => ({
    ...resetPatch,
    // Retain all unlocks except reset per design
    unlocks: {
      ...s.unlocks,
      anomalousOperations: firstPrestige ? true : s.unlocks.anomalousOperations,
    },
    stats: {
      ...s.stats,
      totalPrestigesTier1: s.stats.totalPrestigesTier1 + 1,
      lastPrestigeTime: Date.now(),
    },
    // Retain settings, achievements, relics, automation, operations
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    chronalFractures: s.chronalFractures,
    omniSpars: s.omniSpars,
    arUpgrades: s.arUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 3000)

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Reality Recalibrated',
    message: `Earned ${arGained} Arkalon Resonance. Rebuilding in parallel dimension.`,
    autoDismissMs: 6000,
  })

  if (firstPrestige) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Anomalous Operations Active',
      message: 'Global 90-day operation cycle has begun.',
      autoDismissMs: 5000,
    })
  }
}

// Performs a Tier II Timeline Severance prestige
export function triggerTierII(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier2(store)) return

  const cfGained = calculateCFGain(store)
  const resetPatch = buildTier2ResetState(store, cfGained)

  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    omniSpars: s.omniSpars,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: {
      ...s.stats,
      totalPrestigesTier2: s.stats.totalPrestigesTier2 + 1,
      lastPrestigeTime: Date.now(),
    },
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 3000)

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Timeline Severed',
    message: `Earned ${cfGained} Chronal Fractures. New timeline initializing.`,
    autoDismissMs: 6000,
  })
}

// Performs a Tier III Singular Synthesis prestige
export function triggerTierIII(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier3(store)) return

  const osGained = calculateOSGain(store)
  const resetPatch = buildTier3ResetState(store, osGained)

  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    osUpgrades: s.osUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: {
      ...s.stats,
      totalPrestigesTier3: s.stats.totalPrestigesTier3 + 1,
      lastPrestigeTime: Date.now(),
    },
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 4000)

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Singular Synthesis Complete',
    message: `Earned ${osGained} Omni-Spars. The Omega Construct begins.`,
    autoDismissMs: 6000,
  })
}

// Prestige upgrade purchase action
export function buyPrestigeUpgrade(
  upgradeId: string,
  currency: 'ar' | 'cf' | 'os'
): void {
  const store = useGameStore.getState()
  const { AR_UPGRADES, CF_UPGRADES, OS_UPGRADES, getUpgradeCost } =
    require('@/lib/prestigeUpgradeDefs')

  const allDefs = [...AR_UPGRADES, ...CF_UPGRADES, ...OS_UPGRADES]
  const def = allDefs.find((d: any) => d.id === upgradeId)
  if (!def) return

  // Get current level from appropriate slice
  let currentLevel = 0
  if (currency === 'ar') {
    currentLevel = (store.arUpgrades as any)[upgradeId] ?? 0
  } else if (currency === 'cf') {
    currentLevel = (store.cfUpgrades as any)[upgradeId] ?? 0
  } else {
    currentLevel = (store.osUpgrades as any)[upgradeId] ?? 0
  }

  if (currentLevel >= def.maxLevel) return

  const cost = getUpgradeCost(def, currentLevel)

  // Check currency
  if (currency === 'ar' && store.arkalonResonance < cost) return
  if (currency === 'cf' && store.chronalFractures < cost) return
  if (currency === 'os' && store.omniSpars < cost) return

  // Deduct currency and increment level
  useGameStore.setState((s) => {
    const newLevel = currentLevel + 1
    if (currency === 'ar') {
      return {
        arkalonResonance: s.arkalonResonance - cost,
        arUpgrades: { ...s.arUpgrades, [upgradeId]: newLevel },
        // Activate automation if relevant upgrade purchased
        automation: upgradeId === 'auto_buy_basic'
          ? { ...s.automation, autoBuyBasic: true }
          : upgradeId === 'auto_research_queue'
          ? { ...s.automation, autoResearchQueue: true }
          : s.automation,
      }
    } else if (currency === 'cf') {
      return {
        chronalFractures: s.chronalFractures - cost,
        cfUpgrades: { ...s.cfUpgrades, [upgradeId]: newLevel },
        automation: upgradeId === 'auto_module_buyer'
          ? { ...s.automation, autoModuleBuy: true }
          : s.automation,
      }
    } else {
      return {
        omniSpars: s.omniSpars - cost,
        osUpgrades: { ...s.osUpgrades, [upgradeId]: newLevel },
        automation: upgradeId === 'the_automated_lab'
          ? { ...s.automation, autoPrestigeTierI: true }
          : upgradeId === 'automated_timeline_severance'
          ? { ...s.automation, autoPrestigeTierII: true }
          : s.automation,
      }
    }
  })

  // Research slot expansion check for deep_research_slots
  if (upgradeId === 'deep_research_slots') {
    checkResearchSlotExpansion(useGameStore.getState())
  }

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

// Excavation actions

// Builds a new probe, deducting RP
export function buildProbe(): void {
  const store = useGameStore.getState()

  if (!meetsProbeGateRequirements(store)) return
  if (!canBuildProbe(store)) return

  const id = nextProbeId()

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - PROBE_COST_RP,
    probes: [
      ...s.probes,
      {
        id,
        status: 'idle' as const,
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: 0,
      },
    ],
  }))
}

// Launches a probe to a specific zone
export function launchProbe(probeId: number, zone: ExcavationZone): void {
  const store = useGameStore.getState()
  const probe = store.probes.find((p) => p.id === probeId)
  if (!probe || probe.status !== 'idle') return

  const duration = getScanDuration(zone, store)

  useGameStore.setState((s) => ({
    probes: s.probes.map((p) =>
      p.id === probeId
        ? { ...p, status: 'scanning' as const, zone, timerRemaining: duration }
        : p
    ),
  }))
}

// Processes probe completions - called from tick when timerRemaining hits 0
export function processProbeCompletions(): void {
  const store = useGameStore.getState()
  const completedProbes = store.probes.filter(
    (p) => p.status === 'scanning' && p.timerRemaining <= 0
  )

  if (completedProbes.length === 0) {
    // Check repairs
    const repairsComplete = store.probes.filter(
      (p) => p.status === 'repairing' && p.repairTimerRemaining <= 0
    )
    if (repairsComplete.length > 0) {
      useGameStore.setState((s) => ({
        probes: s.probes.map((p) =>
          p.status === 'repairing' && p.repairTimerRemaining <= 0
            ? { ...p, status: 'idle' as const, zone: null, repairTimerRemaining: 0 }
            : p
        ),
      }))
    }
    return
  }

  let totalDust = 0
  const newRelics: number[] = []
  const updatedProbes = [...store.probes]

  for (const probe of completedProbes) {
    const result = rollProbeResult(probe, store)
    const idx = updatedProbes.findIndex((p) => p.id === probe.id)
    if (idx === -1) continue

    totalDust += result.dustEarned

    if (result.relicDropped > 0 && !store.unlockedRelics.includes(result.relicDropped)) {
      newRelics.push(result.relicDropped)
    }

    if (result.probeDestroyed) {
      updatedProbes.splice(idx, 1)
    } else if (result.needsRepair) {
      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'repairing',
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: UNSTABLE_RIFT_REPAIR_SECONDS,
      }
    } else {
      updatedProbes[idx] = {
        ...updatedProbes[idx],
        status: 'idle',
        zone: null,
        timerRemaining: 0,
        repairTimerRemaining: 0,
      }
    }

    // Alert per probe
    if (result.success) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Returned',
        message: `${ZONE_MAP[probe.zone!].label} scan complete. +${result.dustEarned} Artifact Dust.`,
        autoDismissMs: 4000,
      })
    } else if (result.probeDestroyed) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'anomaly',
        title: 'Probe Destroyed',
        message: 'Void Depth scan failed. The probe has been lost.',
        autoDismissMs: 5000,
      })
    } else if (result.needsRepair) {
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Probe Damaged',
        message: 'Unstable Rift scan failed. Probe entering repair cycle (10 min).',
        autoDismissMs: 4000,
      })
    }
  }

  useGameStore.setState((s) => ({
    probes: updatedProbes,
    artifactDust: s.artifactDust + totalDust,
    unlockedRelics:
      newRelics.length > 0
        ? [...new Set([...s.unlockedRelics, ...newRelics])]
        : s.unlockedRelics,
  }))

  if (newRelics.length > 0) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Recovered',
      message: 'A relic has been recovered from the excavation scan.',
      autoDismissMs: 5000,
    })
  }

  markAchievementsDirty()
}

// Module purchase action
export function buyModule(
  generatorIndex: number,
  moduleType: ModuleType,
  currentLevel: number
): void {
  const store = useGameStore.getState()

  // Check module restrictions
  if (store.activeChallengeRestrictions?.modulesDisabled) return

  const { getModuleUpgradeCost, getModuleLevelCap } = require('@/lib/moduleDefs')
  const cap = getModuleLevelCap(store)

  if (currentLevel >= cap) return

  const cost = getModuleUpgradeCost(generatorIndex, moduleType, currentLevel)
  if (store.researchPoints < cost) return

  useGameStore.setState((s) => {
    const newGenerators = s.generators.map((g, i) => {
      if (i !== generatorIndex) return g
      switch (moduleType) {
        case 'efficiency':
          return { ...g, efficiencyLevel: g.efficiencyLevel + 1 }
        case 'cost_reduction':
          return { ...g, costReductionLevel: g.costReductionLevel + 1 }
        case 'synergy':
          return { ...g, synergyLevel: g.synergyLevel + 1 }
        default:
          return g
      }
    })
    return {
      researchPoints: s.researchPoints - cost,
      generators: newGenerators,
    }
  })

  // Modules affect production
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

// Generator purchase action
// amount: 1 | 10 | 100 | 'max'
export function buyGenerator(
  generatorIndex: number,
  amount: BulkBuyAmount
): void {
  const store = useGameStore.getState()
  const gen = store.generators[generatorIndex]
  if (!gen) return

  // Determine actual count to buy
  let count: number
  if (amount === 'max') {
    count = maxAffordable(generatorIndex, store)
  } else {
    count = amount
  }

  if (count <= 0) return

  const totalCost = costToBuyN(generatorIndex, count, store)
  if (store.researchPoints < totalCost) return

  const newGenerators = store.generators.map((g, i) => {
    if (i !== generatorIndex) return g
    return { ...g, quantity: g.quantity + BigInt(count) }
  })

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - totalCost,
    generators: newGenerators,
  }))

  markUnlocksDirty()
  markTutorialDirty()

  // Recalculate PPS since generator quantities changed
  useGameStore.getState().recalcPPS()
}

// Checks if any research slots completed this tick and processes them
function handleResearchCompletions(
  slots: GameState['activeResearchSlots']
): void {
  const store = useGameStore.getState()
  let changed = false
  let newCompleted = [...store.completedResearchNodes]
  let newQueue = [...store.researchQueue]
  const newSlots = [...store.activeResearchSlots]
  const autoResearchEnabled = store.arUpgrades.auto_research_queue > 0
  const pushAlert = (useUIStore as any).getState().pushAlert

  slots.forEach((slot, idx) => {
    if (!slot.nodeId || slot.timerRemaining > 0) return

    const completedNodeId = slot.nodeId

    // Mark as completed
    if (!newCompleted.includes(completedNodeId)) {
      newCompleted.push(completedNodeId)
    }

    // Auto-advance: try to pull the next node from the queue
    let nextNodeId: string | null = null

    if (newQueue.length > 0) {
      // Find next queue item that can start in this slot
      // Constraint: must be different branch from other active slots
      const otherActiveSlots = newSlots.filter(
        (s, i) => i !== idx && s.nodeId !== null
      )
      const activeBranches = new Set(
        otherActiveSlots
          .map((s) => {
            if (!s.nodeId) return null
            const { RESEARCH_NODE_MAP: map } = require('@/constants/research')
            return map[s.nodeId]?.branch ?? null
          })
          .filter(Boolean)
      )

      const queueIndex = newQueue.findIndex((id) => {
        const { RESEARCH_NODE_MAP: map } = require('@/constants/research')
        const node = map[id]
        if (!node) return false
        // Check branch conflict for parallel slots
        if (activeBranches.has(node.branch)) return false
        return true
      })

      if (queueIndex !== -1) {
        const candidateId = newQueue[queueIndex]
        const { RESEARCH_NODE_MAP: map } = require('@/constants/research')
        const candidateNode = map[candidateId]

        if (candidateNode) {
          // Check affordability for auto-start
          const currentStore = useGameStore.getState()
          const cost = getNodeCost(candidateId, currentStore)

          if (currentStore.researchPoints >= cost || !autoResearchEnabled) {
            // Start the node
            nextNodeId = candidateId
            newQueue.splice(queueIndex, 1)

            // Compute study time from updated state
            const studyTime = getEffectiveStudyTime(candidateId, {
              ...currentStore,
              completedResearchNodes: newCompleted
            })
            newSlots[idx] = {
              nodeId: nextNodeId,
              timerRemaining: studyTime
            }
          } else {
            // Unaffordable - fire alert if auto-research is enabled
            if (autoResearchEnabled) {
              pushAlert({
                priority: 2,
                variant: 'info',
                title: 'Research Queue Paused',
                message: `Cannot afford ${candidateNode.label}. Queue will resume when affordable.`,
                autoDismissMs: 4000
              })
            }
            newSlots[idx] = { nodeId: null, timerRemaining: 0 }
          }
        } else {
          newSlots[idx] = { nodeId: null, timerRemaining: 0 }
        }
      } else {
        newSlots[idx] = { nodeId: null, timerRemaining: 0 }
      }
    } else {
      newSlots[idx] = { nodeId: null, timerRemaining: 0 }
    }

    changed = true
    markUnlocksDirty()
    markTutorialDirty()
    markAchievementsDirty()
  })

  if (!changed) return

  useGameStore.setState((s) => ({
    completedResearchNodes: newCompleted,
    researchQueue: newQueue,
    activeResearchSlots: newSlots,
    stats: {
      ...s.stats,
      totalResearchNodesCompleted: newCompleted.length
    }
  }))

  // Recalculate PPS since research nodes affect production
  useGameStore.getState().recalcPPS()

  // Check if slot array needs to grow (R3 or CF Deep Research Slots)
  checkResearchSlotExpansion(useGameStore.getState())
}