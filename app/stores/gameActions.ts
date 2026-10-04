'use client'

// Core tick, generator purchase, and game loop actions
// Additional action groups appended in subsequent commits

import { useGameStore } from '@/app/stores/gameStore'
import { checkUnlocks, checkEraTransition } from '@/lib/unlockWatcher'
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
import type { GameState } from '@/types/game'
import type { BulkBuyAmount } from '@/constants/game'

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
      nextState.activeAnomalyType = null
      nextState.anomalyInteractionValue = 0
    }
  }

  // 5. Decrement anomaly spawn check timer
  if (store.unlocks.anomalies && !store.activeAnomalyType) {
    const nextSpawnTimer = Math.max(0, store.timeToNextAnomalyCheck - 0.1)
    nextState.timeToNextAnomalyCheck = nextSpawnTimer
    // Spawn check handled in anomaly actions (Commit 8.1)
  }

  // 6. Decrement probe timers (full logic in Commit 11.1)
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
}

// Research actions

// Starts studying a research node in the first available slot
export function startResearch(nodeId: string): void {
  const store = useGameStore.getState();

  if (!isNodeAvailable(nodeId, store)) return;
  if (isNodeCompleted(nodeId, store)) return;
  if (isNodeActive(nodeId, store)) return;
  if (isNodeQueued(nodeId, store)) return;

  const node = RESEARCH_NODE_MAP[nodeId];
  if (!node) return;

  const cost = getNodeCost(nodeId, store);
  if (store.researchPoints < cost) return;

  // Infinite nodes complete instantly (no timer)
  if (node.isInfinite) {
    const newLevel = (store.infiniteResearchLevels[nodeId] ?? 0) + 1;
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
    }));
    useGameStore.getState().recalcPPS();
    markUnlocksDirty();
    return;
  }

  // Check parallel slot rules: slots from different branches
  const slotCount = getActiveSlotCount(store);
  const filledSlots = store.activeResearchSlots
    .slice(0, slotCount)
    .filter((s) => s.nodeId !== null);

  // For parallel slots, verify different branch requirement
  for (const slot of filledSlots) {
    if (!slot.nodeId) continue;
    const activeNode = RESEARCH_NODE_MAP[slot.nodeId];
    if (activeNode && activeNode.branch === node.branch) {
      // Same branch already being studied - queue it instead
      queueResearch(nodeId);
      return;
    }
  }

  const slotIndex = getAvailableSlotIndex(store);
  if (slotIndex === -1) {
    // No empty slot - queue it
    queueResearch(nodeId);
    return;
  }

  const studyTime = getEffectiveStudyTime(nodeId, store);

  useGameStore.setState((s) => {
    const newSlots = [...s.activeResearchSlots];
    // Ensure slot array is large enough
    while (newSlots.length <= slotIndex) {
      newSlots.push({ nodeId: null, timerRemaining: 0 });
    }
    newSlots[slotIndex] = { nodeId, timerRemaining: studyTime };

    return {
      researchPoints: s.researchPoints - cost,
      activeResearchSlots: newSlots,
    };
  });

  markTutorialDirty();
}

// Adds a node to the research queue
export function queueResearch(nodeId: string): void {
  const store = useGameStore.getState();

  if (!isNodeAvailable(nodeId, store)) return;
  if (isNodeCompleted(nodeId, store)) return;
  if (isNodeActive(nodeId, store)) return;
  if (isNodeQueued(nodeId, store)) return;

  // Determine queue max size (expanded by SC10 challenge completions)
  const sc10Tiers = store.challengeRecords['SC10']?.completedTiers ?? 0;
  const queueMax = RESEARCH_QUEUE_MAX_BASE + sc10Tiers;

  if (store.researchQueue.length >= queueMax) return;

  useGameStore.setState((s) => ({
    researchQueue: [...s.researchQueue, nodeId],
  }));
}

// Removes a node from the research queue
export function dequeueResearch(nodeId: string): void {
  useGameStore.setState((s) => ({
    researchQueue: s.researchQueue.filter((id) => id !== nodeId),
  }));
}

// Reorders the research queue by moving nodeId to a new index
export function reorderQueue(nodeId: string, toIndex: number): void {
  const store = useGameStore.getState();
  const queue = [...store.researchQueue];
  const fromIndex = queue.indexOf(nodeId);
  if (fromIndex === -1) return;

  queue.splice(fromIndex, 1);
  queue.splice(toIndex, 0, nodeId);

  useGameStore.setState({ researchQueue: queue });
}

// Called by Arkalon sphere click (O2 effect): reduces active timer by 5%
export function applyArkalonClickBoost(): void {
  const store = useGameStore.getState();
  if (!store.completedResearchNodes.includes('O2')) return;

  useGameStore.setState((s) => ({
    activeResearchSlots: s.activeResearchSlots.map((slot) => {
      if (!slot.nodeId || slot.timerRemaining <= 0) return slot;
      return {
        ...slot,
        timerRemaining: slot.timerRemaining * 0.95,
      };
    }),
  }));
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

  slots.forEach((slot, idx) => {
    if (!slot.nodeId || slot.timerRemaining > 0) return

    // Node completed
    if (!newCompleted.includes(slot.nodeId)) {
      newCompleted.push(slot.nodeId)
    }

    // Advance queue into this slot if available
    const nextNodeId = newQueue.shift() ?? null
    newSlots[idx] = { nodeId: nextNodeId, timerRemaining: 0 }
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
}
