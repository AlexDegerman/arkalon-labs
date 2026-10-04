'use client'

// Core tick action and game loop actions
// Additional actions appended in subsequent commits

import { useGameStore } from '@/app/stores/gameStore'
import { recalculatePPS } from '@/lib/productionEngine'
import { checkUnlocks } from '@/lib/unlockWatcher'
import type { GameState } from '@/types/game'

// Dirty flags for deferred checks inside the tick
let unlocksDirty = false
let tutorialDirty = false
let achievementsDirty = false

export function markUnlocksDirty(): void {
  unlocksDirty = true
}

export function markTutorialDirty(): void {
  tutorialDirty = true
}

export function markAchievementsDirty(): void {
  achievementsDirty = true
}

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
    unlocksDirty = true
  }

  // 2. Decrement active research timers
  const updatedSlots = store.activeResearchSlots.map((slot) => {
    if (!slot.nodeId || slot.timerRemaining <= 0) return slot
    const next = Math.max(0, slot.timerRemaining - 0.1)
    if (next === 0 && slot.timerRemaining > 0) {
      // Completion handled below after state update
      tutorialDirty = true
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
  if (unlocksDirty) {
    unlocksDirty = false
    const currentState = useGameStore.getState()
    checkUnlocks(currentState)
  }

  // 11. Deferred: tutorial beats (dirty flag) - wired in Commit 14.1
  if (tutorialDirty) {
    tutorialDirty = false
    // checkTutorialBeats() called in Commit 14.1
  }

  // 12. Deferred: achievements check - wired in Commit 19.2
  if (achievementsDirty) {
    achievementsDirty = false
    // checkAchievements() called in Commit 19.2
  }
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
