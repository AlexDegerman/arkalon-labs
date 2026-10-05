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
  getActiveSlotCount
} from '@/lib/researchNodes'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { RESEARCH_QUEUE_MAX_BASE } from '@/constants/game'
import {
  markUnlocksDirty,
  markTutorialDirty,
  markAchievementsDirty
} from '@/lib/dirtyFlags'
import { dispatchResearchComplete } from '@/lib/dialogueDispatcher'
import { checkResearchSlotExpansion } from '@/lib/unlockWatcher'
import type { GameState } from '@/types/game'

// Research actions

// Starts studying a research node in the first available slot
export function startResearch(nodeId: string): void {
  const store = useGameStore.getState()

  // Challenge: tech matrix disabled (SC2, EC4)
  if (store.activeChallengeRestrictions?.techMatrixDisabled) return

  // Challenge: energy branch locked (SC9)
  if (
    store.activeChallengeRestrictions?.energyBranchLocked &&
    nodeId.startsWith('E')
  )
    return

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
        [nodeId]: newLevel
      },
      completedResearchNodes: s.completedResearchNodes.includes(nodeId)
        ? s.completedResearchNodes
        : [...s.completedResearchNodes, nodeId],
      stats: {
        ...s.stats,
        totalResearchNodesCompleted: s.completedResearchNodes.length + 1
      }
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
      activeResearchSlots: newSlots
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
    researchQueue: [...s.researchQueue, nodeId]
  }))
}

// Removes a node from the research queue
export function dequeueResearch(nodeId: string): void {
  useGameStore.setState((s) => ({
    researchQueue: s.researchQueue.filter((id) => id !== nodeId)
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
        timerRemaining: slot.timerRemaining * 0.95
      }
    })
  }))
}

// Checks if any research slots completed this tick and processes them
export function handleResearchCompletions(
  slots: GameState['activeResearchSlots']
): void {
  const store = useGameStore.getState()
  let changed = false
  let newCompleted = [...store.completedResearchNodes]
  let newQueue = [...store.researchQueue]
  const newSlots = [...store.activeResearchSlots]
  const autoResearchEnabled = store.arUpgrades.auto_research_queue > 0
  const pushAlert = useUIStore.getState().pushAlert

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
            return RESEARCH_NODE_MAP[s.nodeId]?.branch ?? null
          })
          .filter(Boolean)
      )

      const queueIndex = newQueue.findIndex((id) => {
        const node = RESEARCH_NODE_MAP[id]
        if (!node) return false
        if (activeBranches.has(node.branch)) return false
        return true
      })

      if (queueIndex !== -1) {
        const candidateId = newQueue[queueIndex]
        const candidateNode = RESEARCH_NODE_MAP[candidateId]

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

  // Fire research completion dialogue only for nodes that completed THIS tick
  const previouslyCompleted = new Set(store.completedResearchNodes)
  for (const nodeId of newCompleted) {
    if (!previouslyCompleted.has(nodeId)) {
      dispatchResearchComplete(nodeId)
    }
  }

  // Recalculate PPS since research nodes affect production
  useGameStore.getState().recalcPPS()

  // Check if slot array needs to grow (R3 or CF Deep Research Slots)
  checkResearchSlotExpansion(useGameStore.getState())
}
