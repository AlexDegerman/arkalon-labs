'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  isNodeAvailable,
  isNodeCompleted,
  isNodeActive,
  isNodeQueued,
  getNodeCost,
  getEffectiveStudyTime,
  getAvailableSlotIndex,
  getActiveSlotCount,
  getResearchQueueMax,
  getOverclockDetails
} from '@/lib/researchNodes'
import {
  INF_NODE_COST_SCALING,
  RESEARCH_NODE_MAP,
  RESEARCH_NODES
} from '@/constants/research'
import {
  markUnlocksDirty,
  markTutorialDirty,
  markAchievementsDirty
} from '@/lib/dirtyFlags'
import { dispatchArkalonClick, dispatchResearchComplete } from '@/lib/dialogueDispatcher'
import { checkResearchSlotExpansion } from '@/lib/unlockWatcher'
import type { GameState } from '@/types/game'
import { playSound } from '@/hooks/useSound'
import { awardRelic } from './relicActions'

// Research actions

// Starts studying a research node in the first available slot
export function startResearch(nodeId: string, silent = false): void {
  const store = useGameStore.getState()

  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return

  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  if (!isNodeAvailable(nodeId, store)) return
  if (!node.isInfinite && isNodeCompleted(nodeId, store)) return
  if (isNodeActive(nodeId, store)) return
  if (
    nodeId === 'R_INF' &&
    (store.infiniteResearchLevels[nodeId] ?? 0) >= 299
  ) {
    return
  }

  const cost = getNodeCost(nodeId, store)
  if (store.researchPoints < cost) return

  const usesO6Bypass = Boolean(
    node.prerequisiteId &&
    !store.completedResearchNodes.includes(node.prerequisiteId)
  )
  const studyTime = getEffectiveStudyTime(nodeId, store)

  // Instant completion (SC2 reward or 0s nodes)
  if (studyTime === 0 && !node.isInfinite) {
    if (isNodeQueued(nodeId, store)) {
      dequeueResearch(nodeId)
    }
    const nextRelic4Pity = (store.stats.relic4PityCount ?? 0) + 1
    useGameStore.setState((s) => ({
      researchPoints: s.researchPoints - cost,
      o6BypassUsed: s.o6BypassUsed || usesO6Bypass,
      completedResearchNodes: s.completedResearchNodes.includes(nodeId)
        ? s.completedResearchNodes
        : [...s.completedResearchNodes, nodeId],
      stats: {
        ...s.stats,
        totalResearchNodesCompleted: s.completedResearchNodes.includes(nodeId)
          ? s.stats.totalResearchNodesCompleted
          : s.stats.totalResearchNodesCompleted + 1,
        o10EverCompleted: s.stats.o10EverCompleted || nodeId === 'O10',
        relic4PityCount: nextRelic4Pity
      }
    }))
    if (!silent) playSound('research-complete')
    dispatchResearchComplete(nodeId)
    if (nextRelic4Pity >= 25 || Math.random() < 0.01) awardRelic(4)
    const standardCount = useGameStore
      .getState()
      .completedResearchNodes.filter((id) => !id.includes('_INF')).length
    if (standardCount >= 10) awardRelic(2)
    useGameStore.getState().recalcPPS()
    markUnlocksDirty()
    markTutorialDirty()
    markAchievementsDirty()
    checkResearchSlotExpansion(useGameStore.getState())
    return
  }

  // Infinite nodes complete instantly (no timer)
  if (node.isInfinite) {
    if (isNodeQueued(nodeId, store)) {
      dequeueResearch(nodeId)
    }
    const isFirstCompletion = !store.completedResearchNodes.includes(nodeId)
    const newLevel = (store.infiniteResearchLevels[nodeId] ?? 0) + 1
    const shouldScaleActiveTimers =
      nodeId === 'R_INF' && Math.pow(0.99, newLevel) >= 0.05

    useGameStore.setState((s) => ({
      researchPoints: s.researchPoints - cost,
      infiniteResearchLevels: {
        ...s.infiniteResearchLevels,
        [nodeId]: newLevel
      },
      ...(shouldScaleActiveTimers
        ? {
            activeResearchSlots: s.activeResearchSlots.map((sl) =>
              sl.nodeId && sl.timerRemaining > 1
                ? {
                    ...sl,
                    timerRemaining: Math.max(1, sl.timerRemaining * 0.99)
                  }
                : sl
            )
          }
        : {}),
      completedResearchNodes: isFirstCompletion
        ? [...s.completedResearchNodes, nodeId]
        : s.completedResearchNodes,
      stats: {
        ...s.stats,
        totalResearchNodesCompleted: isFirstCompletion
          ? s.stats.totalResearchNodesCompleted + 1
          : s.stats.totalResearchNodesCompleted
      }
    }))
    if (!silent) playSound('purchase')
    useGameStore.getState().recalcPPS()
    markUnlocksDirty()
    return
  }

  // Check parallel slot rules: slots from different branches
  const slotCount = getActiveSlotCount(store)
  const filledSlots = store.activeResearchSlots
    .slice(0, slotCount)
    .filter((s) => s.nodeId !== null)

  const queueUnlocked =
    store.arUpgrades.auto_research_queue > 0 &&
    !store.activeChallengeRestrictions?.prestigeUpgradesDisabled

  // For parallel slots, verify different branch requirement
  for (const slot of filledSlots) {
    if (!slot.nodeId) continue
    const activeNode = RESEARCH_NODE_MAP[slot.nodeId]
    if (activeNode && activeNode.branch === node.branch) {
      if (queueUnlocked) {
        queueResearch(nodeId)
      } else if (!silent) {
        playSound('fail')
        useUIStore.getState().pushAlert({
          priority: 2,
          variant: 'info',
          title: 'Branch Busy',
          message: `The ${node.branch} branch is already studying. Wait for completion or unlock Auto-Research Queue.`,
          autoDismissMs: 3500
        })
      }
      return
    }
  }

  const slotIndex = getAvailableSlotIndex(store)
  if (slotIndex === -1) {
    if (queueUnlocked) {
      queueResearch(nodeId)
    } else if (!silent) {
      playSound('fail')
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Research Slot Busy',
        message:
          'All active slots are full. Unlock Parallel Research (R3) or Auto-Research Queue.',
        autoDismissMs: 3500
      })
    }
    return
  }

  if (isNodeQueued(nodeId, store)) {
    dequeueResearch(nodeId)
  }

  useGameStore.setState((s) => {
    const newSlots = [...s.activeResearchSlots]
    // Ensure slot array is large enough
    while (newSlots.length <= slotIndex) {
      newSlots.push({ nodeId: null, timerRemaining: 0 })
    }
    newSlots[slotIndex] = { nodeId, timerRemaining: studyTime }

    return {
      researchPoints: s.researchPoints - cost,
      o6BypassUsed: s.o6BypassUsed || usesO6Bypass,
      activeResearchSlots: newSlots
    }
  })

  if (!silent) playSound('click')
  useGameStore.getState().recalcPPS()
  markTutorialDirty()
}

// Manual afford-limited bulk purchase for infinite research nodes (no automation/offline)
export function buyInfiniteResearchBulk(
  nodeId: string,
  amount: number | 'max'
): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node?.isInfinite) return
  if (!isNodeAvailable(nodeId, store)) return

  const startLevel = store.infiniteResearchLevels[nodeId] ?? 0
  const maxCap = nodeId === 'R_INF' ? 299 : Number.MAX_SAFE_INTEGER
  const maxSteps =
    amount === 'max'
      ? Math.min(300, Math.max(0, maxCap - startLevel))
      : Math.min(amount, Math.max(0, maxCap - startLevel))

  if (maxSteps <= 0) return

  const scaling = INF_NODE_COST_SCALING[nodeId] ?? 1.5
  const scaleNum = BigInt(Math.round(scaling * 1000))

  let remainingRP = store.researchPoints
  let bought = 0
  let totalCost = 0n
  let stepCost = getNodeCost(nodeId, store)

  for (let i = 0; i < maxSteps; i++) {
    if (remainingRP < stepCost) break
    remainingRP -= stepCost
    totalCost += stepCost
    bought++
    stepCost = (stepCost * scaleNum) / 1000n
  }

  if (bought <= 0) return

  const newLevel = startLevel + bought
  const isFirstCompletion = !store.completedResearchNodes.includes(nodeId)
  const prevReduction = Math.max(0.05, Math.pow(0.99, startLevel))
  const nextReduction = Math.max(0.05, Math.pow(0.99, newLevel))
  const scaleFactor = nodeId === 'R_INF' ? nextReduction / prevReduction : 1

  useGameStore.setState((s) => ({
    researchPoints: s.researchPoints - totalCost,
    infiniteResearchLevels: {
      ...s.infiniteResearchLevels,
      [nodeId]: newLevel
    },
    ...(nodeId === 'R_INF'
      ? {
          activeResearchSlots: s.activeResearchSlots.map((sl) =>
            sl.nodeId && sl.timerRemaining > 1
              ? {
                  ...sl,
                  timerRemaining: Math.max(1, sl.timerRemaining * scaleFactor)
                }
              : sl
          )
        }
      : {}),
    completedResearchNodes: isFirstCompletion
      ? [...s.completedResearchNodes, nodeId]
      : s.completedResearchNodes,
    stats: {
      ...s.stats,
      totalResearchNodesCompleted: isFirstCompletion
        ? s.stats.totalResearchNodesCompleted + 1
        : s.stats.totalResearchNodesCompleted
    }
  }))

  playSound('purchase')
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}

// Adds a node to the research queue
export function queueResearch(nodeId: string): void {
  const store = useGameStore.getState()

  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  if (
    store.arUpgrades.auto_research_queue <= 0 ||
    store.activeChallengeRestrictions?.prestigeUpgradesDisabled
  ) {
    return
  }
  if (!isNodeAvailable(nodeId, store)) return
  const node = RESEARCH_NODE_MAP[nodeId]
  if (
    node?.prerequisiteId &&
    !store.completedResearchNodes.includes(node.prerequisiteId)
  ) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Direct Study Required',
      message:
        'O6 Prerequisite Bypass must be started directly in an open branch slot.',
      autoDismissMs: 3500
    })
    return
  }
  if (isNodeCompleted(nodeId, store)) return
  if (isNodeActive(nodeId, store)) return
  if (isNodeQueued(nodeId, store)) return

  // Determine queue max size (expanded by SC10 and AC8 challenge completions)
  const queueMax = getResearchQueueMax(store)

  if (store.researchQueue.length >= queueMax) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Queue Full',
      message: 'Research queue is at maximum capacity.',
      autoDismissMs: 3000
    })
    return
  }

  playSound('click')
  useGameStore.setState((s) => ({
    researchQueue: [...s.researchQueue, nodeId]
  }))
}

// Removes a node from the research queue
export function dequeueResearch(nodeId: string): void {
  playSound('click')
  useGameStore.setState((s) => ({
    researchQueue: s.researchQueue.filter((id) => id !== nodeId)
  }))
}

// Spends liquid RP to accelerate active research by 25% of total study time
export function overclockResearch(slotIndex: number): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  const slot = store.activeResearchSlots[slotIndex]
  if (!slot?.nodeId || slot.timerRemaining <= 0) return

  const { cost, secondsReduced } = getOverclockDetails(
    slot.nodeId,
    store,
    slot.timerRemaining
  )
  if (store.researchPoints < cost) return

  const nextTimer = Math.max(0, slot.timerRemaining - secondsReduced)
  const newSlots = [...store.activeResearchSlots]
  newSlots[slotIndex] = {
    ...slot,
    timerRemaining: nextTimer
  }

  useGameStore.setState({
    researchPoints: store.researchPoints - cost,
    activeResearchSlots: newSlots
  })

  if (nextTimer > 0) {
    playSound('purchase')
  } else {
    handleResearchCompletions(newSlots)
  }
}

// Batch queues available nodes using smart sorting presets
export function applyQueuePreset(
  preset: 'shortest' | 'cheapest' | 'tier' | 'clear'
): void {
  const store = useGameStore.getState()

  if (preset === 'clear') {
    if (store.researchQueue.length === 0) return
    playSound('click')
    useGameStore.setState({ researchQueue: [] })
    return
  }

  if (
    store.arUpgrades.auto_research_queue <= 0 ||
    store.activeChallengeRestrictions?.prestigeUpgradesDisabled
  ) {
    return
  }
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  if (!store.unlocks.techMatrix) return

  const queueMax = getResearchQueueMax(store)
  const openCapacity = queueMax - store.researchQueue.length
  if (openCapacity <= 0) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Queue Full',
      message: 'Research queue is already at capacity.',
      autoDismissMs: 3000
    })
    return
  }

  const activeNodeIds = new Set(
    store.activeResearchSlots.map((s) => s.nodeId).filter(Boolean)
  )
  const queuedNodeIds = new Set(store.researchQueue)
  const completedNodeIds = new Set(store.completedResearchNodes)

  // Find candidate standard nodes that are eligible to be researched or queued
  const candidates = RESEARCH_NODES.filter((node) => {
    if (node.isInfinite) return false
    if (completedNodeIds.has(node.id)) return false
    if (activeNodeIds.has(node.id)) return false
    if (queuedNodeIds.has(node.id)) return false
    if (node.prerequisiteId && !completedNodeIds.has(node.prerequisiteId)) {
      return false
    }
    return isNodeAvailable(node.id, store)
  })

  if (candidates.length === 0) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'No Available Nodes',
      message: 'All available prerequisite research nodes are already queued or active.',
      autoDismissMs: 3000
    })
    return
  }

  // Sort according to requested strategy
  if (preset === 'shortest') {
    candidates.sort(
      (a, b) =>
        getEffectiveStudyTime(a.id, store) - getEffectiveStudyTime(b.id, store)
    )
  } else if (preset === 'cheapest') {
    candidates.sort((a, b) => {
      const diff = getNodeCost(a.id, store) - getNodeCost(b.id, store)
      return diff < 0n ? -1 : diff > 0n ? 1 : 0
    })
  } else if (preset === 'tier') {
    candidates.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier
      const diff = getNodeCost(a.id, store) - getNodeCost(b.id, store)
      return diff < 0n ? -1 : diff > 0n ? 1 : 0
    })
  }

  const toAdd = candidates.slice(0, openCapacity).map((n) => n.id)
  playSound('click')

  useGameStore.setState({
    researchQueue: [...store.researchQueue, ...toAdd]
  })
}

// Manually starts a queued node immediately if a slot and branch are open
export function startQueuedResearch(nodeId: string): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  if (!isNodeQueued(nodeId, store)) return
  if (!isNodeAvailable(nodeId, store)) return

  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return

  const slotCount = getActiveSlotCount(store)
  const filledSlots = store.activeResearchSlots
    .slice(0, slotCount)
    .filter((s) => s.nodeId !== null)

  for (const slot of filledSlots) {
    if (!slot.nodeId) continue
    const activeNode = RESEARCH_NODE_MAP[slot.nodeId]
    if (activeNode && activeNode.branch === node.branch) return
  }

  if (getAvailableSlotIndex(store) === -1) return

  const cost = getNodeCost(nodeId, store)
  if (store.researchPoints < cost) return

  startResearch(nodeId)
}

// Reorders the research queue by moving nodeId to a new index
export function reorderQueue(nodeId: string, toIndex: number): void {
  const store = useGameStore.getState()
  const queue = [...store.researchQueue]
  const fromIndex = queue.indexOf(nodeId)
  if (fromIndex === -1) return

  queue.splice(fromIndex, 1)
  queue.splice(toIndex, 0, nodeId)

  playSound('click')
  useGameStore.setState({ researchQueue: queue })
}

let lastPulseTime = 0
const PULSE_COOLDOWN_MS = 400

export const CALIBRATION_NODE_ID = '__CALIBRATION__'

// Emergency 30s zero-cost calibration study so AC1/AC8 can never softlock mid-run
export function startCalibrationStudy(): void {
  const store = useGameStore.getState()
  if (!store.activeChallengeRestrictions?.productionOnlyWhileResearching) return
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return

  const slotCount = getActiveSlotCount(store)
  const hasRunning = store.activeResearchSlots
    .slice(0, slotCount)
    .some((s) => s.nodeId !== null)
  if (hasRunning) return

  useGameStore.setState((s) => {
    const newSlots = [...s.activeResearchSlots]
    if (newSlots.length === 0) {
      newSlots.push({ nodeId: CALIBRATION_NODE_ID, timerRemaining: 30 })
    } else {
      newSlots[0] = { nodeId: CALIBRATION_NODE_ID, timerRemaining: 30 }
    }
    return { activeResearchSlots: newSlots }
  })

  playSound('click')
  useGameStore.getState().recalcPPS()
}

export function pulseArkalonCore(): void {
  const now = Date.now()
  if (now - lastPulseTime < PULSE_COOLDOWN_MS) return
  lastPulseTime = now

  playSound('click')
  dispatchArkalonClick()
}

// Checks if any research slots completed this tick and processes them
export function handleResearchCompletions(
  slots: GameState['activeResearchSlots']
): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return
  let changed = false
  let newCompleted = [...store.completedResearchNodes]
  let newQueue = [...store.researchQueue]
  const newSlots = [...store.activeResearchSlots]
  let currentRP = store.researchPoints
  const autoResearchEnabled =
    store.automation.autoResearchQueue &&
    store.arUpgrades.auto_research_queue > 0 &&
    !store.activeChallengeRestrictions?.prestigeUpgradesDisabled
  const pushAlert = useUIStore.getState().pushAlert

  let calibrationCompleted = false
  slots.forEach((slot, idx) => {
    if (!slot.nodeId || slot.timerRemaining > 0) return

    const completedNodeId = slot.nodeId

    // Calibration fallback finishes cleanly without polluting completedResearchNodes
    if (completedNodeId === CALIBRATION_NODE_ID) {
      newSlots[idx] = { nodeId: null, timerRemaining: 0 }
      changed = true
      calibrationCompleted = true
      return
    }

    // Mark as completed
    if (!newCompleted.includes(completedNodeId)) {
      newCompleted.push(completedNodeId)
    }

    // Auto-advance: try to pull the next node from the queue
    newSlots[idx] = { nodeId: null, timerRemaining: 0 }

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
            return RESEARCH_NODE_MAP[s.nodeId]?.branch ?? null
          })
          .filter(Boolean)
      )

      const queueIndex = newQueue.findIndex((id) => {
        const node = RESEARCH_NODE_MAP[id]
        if (!node) return false
        if (activeBranches.has(node.branch)) return false
        const simulatedStore = {
          ...store,
          researchPoints: currentRP,
          completedResearchNodes: newCompleted
        }
        return isNodeAvailable(id, simulatedStore)
      })

      if (queueIndex !== -1) {
        const candidateId = newQueue[queueIndex]
        const candidateNode = RESEARCH_NODE_MAP[candidateId]

        if (candidateNode) {
          // Check affordability for auto-start
          const simulatedStore = {
            ...store,
            researchPoints: currentRP,
            completedResearchNodes: newCompleted
          }
          const cost = getNodeCost(candidateId, simulatedStore)

          if (autoResearchEnabled && currentRP >= cost) {
            currentRP -= cost
            newQueue.splice(queueIndex, 1)

            // Compute study time from updated state
            const studyTime = getEffectiveStudyTime(candidateId, {
              ...simulatedStore,
              completedResearchNodes: newCompleted
            })
            newSlots[idx] = {
              nodeId: candidateId,
              timerRemaining: studyTime
            }
          } else if (autoResearchEnabled) {
            pushAlert({
              priority: 2,
              variant: 'info',
              title: 'Research Queue Paused',
              message: `Cannot afford ${candidateNode.label}. Queue will resume when affordable.`,
              autoDismissMs: 4000
            })
          }
        }
      }
    }

    changed = true
    markUnlocksDirty()
    markTutorialDirty()
    markAchievementsDirty()
  })

  if (!changed) return

  const previouslyCompleted = new Set(store.completedResearchNodes)
  const newlyCompletedCount = newCompleted.filter(
    (id) => !previouslyCompleted.has(id)
  ).length
  const nextRelic4Pity =
    (store.stats.relic4PityCount ?? 0) + newlyCompletedCount

  useGameStore.setState((s) => ({
    researchPoints: currentRP,
    completedResearchNodes: newCompleted,
    researchQueue: newQueue,
    activeResearchSlots: newSlots,
    stats: {
      ...s.stats,
      totalResearchNodesCompleted: newCompleted.length,
      o10EverCompleted:
        s.stats.o10EverCompleted || newCompleted.includes('O10'),
      relic4PityCount: nextRelic4Pity
    }
  }))

  if (newlyCompletedCount > 0 || !calibrationCompleted) {
    playSound('research-complete')
  }

  // Fire research completion dialogue only for nodes that completed THIS tick
  for (const nodeId of newCompleted) {
    if (!previouslyCompleted.has(nodeId)) {
      dispatchResearchComplete(nodeId)
      if (nextRelic4Pity >= 25 || Math.random() < 0.01) awardRelic(4)
      if (nodeId === 'O8') awardRelic(16)
      if ((RESEARCH_NODE_MAP[nodeId]?.studyTimeSeconds ?? 0) >= 86400)
        awardRelic(14)
    }
  }
  if (newCompleted.filter((id) => !id.includes('_INF')).length >= 10) {
    awardRelic(2)
  }

  // Recalculate PPS since research nodes affect production
  useGameStore.getState().recalcPPS()

  // Check if slot array needs to grow (R3 or CF Deep Research Slots)
  checkResearchSlotExpansion(useGameStore.getState())
}
