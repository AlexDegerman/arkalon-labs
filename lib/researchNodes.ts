import {
  RESEARCH_NODES,
  RESEARCH_NODE_MAP,
  INF_NODE_COST_SCALING
} from '@/constants/research'
import type { ResearchNodeDefinition } from '@/constants/research'
import type { GameState } from '@/types/game'
import { infNodeCostAtLevel } from '@/lib/format'

export type { ResearchNodeDefinition }

// Returns true if a node's prerequisites are satisfied
export function isNodeAvailable(nodeId: string, state: GameState): boolean {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return false

  // Infinite nodes require branch tier 8 to be completed
  if (node.isInfinite) {
    const prereq = node.prerequisiteId
    if (prereq && !state.completedResearchNodes.includes(prereq)) return false
    return true
  }

  // Standard nodes require previous tier in same branch
  if (node.prerequisiteId) {
    if (!state.completedResearchNodes.includes(node.prerequisiteId))
      return false
  }

  // Technology Matrix must be unlocked for any research
  if (!state.unlocks.techMatrix) return false

  return true
}

// Returns true if a node is already completed
export function isNodeCompleted(nodeId: string, state: GameState): boolean {
  return state.completedResearchNodes.includes(nodeId)
}

// Returns true if a node is currently being studied in any slot
export function isNodeActive(nodeId: string, state: GameState): boolean {
  return state.activeResearchSlots.some((s) => s.nodeId === nodeId)
}

// Returns true if a node is in the research queue
export function isNodeQueued(nodeId: string, state: GameState): boolean {
  return state.researchQueue.includes(nodeId)
}

// Returns the cost of a node (infinite nodes scale per level)
export function getNodeCost(nodeId: string, state: GameState): bigint {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return 0n

  if (node.isInfinite) {
    const level = state.infiniteResearchLevels[nodeId] ?? 0
    const scaling = INF_NODE_COST_SCALING[nodeId] ?? 1.5
    return infNodeCostAtLevel(node.cost, scaling, level)
  }

  return node.cost
}

// Returns the effective study time for a node in seconds, applying all reductions
export function getEffectiveStudyTime(
  nodeId: string,
  state: GameState
): number {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node || node.isInfinite) return 0

  let time = node.studyTimeSeconds

  // C2: -5% study time
  if (state.completedResearchNodes.includes('C2')) {
    time *= 0.95
  }

  // R2: -15% study time
  if (state.completedResearchNodes.includes('R2')) {
    time *= 0.85
  }

  // AR Research Accelerant: -3% per level (multiplicative)
  const accelLevel = state.arUpgrades.research_accelerant
  if (accelLevel > 0) {
    time *= Math.pow(0.97, accelLevel)
  }

  // CF Temporal Compression: -25%
  if (state.cfUpgrades.temporal_compression > 0) {
    time *= 0.75
  }

  // R_INF: -1% per level (multiplicative, 95% hard cap)
  const rInfLevel = state.infiniteResearchLevels['R_INF'] ?? 0
  if (rInfLevel > 0) {
    const reduction = Math.max(0.05, Math.pow(0.99, rInfLevel))
    time *= reduction
  }

  // O3 click boost (5% speed = 4.76% time reduction) - applied per click, not here
  // AC3 challenge: timers do not tick (handled in tick action)

  // Operation artifact Empirical Compass: -10% Reality branch
  if (
    node.branch === 'reality' &&
    state.operationArtifactsUnlocked.includes('empirical_compass')
  ) {
    time *= 0.9
  }

  return Math.max(1, time)
}

// Returns true if a second research slot is available (R3 completed)
export function hasParallelResearch(state: GameState): boolean {
  return state.completedResearchNodes.includes('R3')
}

// Returns true if a third research slot is available (CF Deep Research Slots)
export function hasThirdResearchSlot(state: GameState): boolean {
  return state.cfUpgrades.deep_research_slots > 0
}

// Returns the number of active research slots available
export function getActiveSlotCount(state: GameState): number {
  // SC10 challenge: force single slot regardless of R3 or CF upgrades
  if (state.activeChallengeRestrictions?.singleResearchSlot) return 1

  let count = 1
  if (hasParallelResearch(state)) count = 2
  if (hasThirdResearchSlot(state)) count = 3
  return count
}

// Returns the first available empty slot index, or -1 if all full
export function getAvailableSlotIndex(state: GameState): number {
  const slotCount = getActiveSlotCount(state)
  for (let i = 0; i < slotCount; i++) {
    const slot = state.activeResearchSlots[i]
    if (!slot || !slot.nodeId) return i
  }
  return -1
}

// Returns all nodes in a branch sorted by tier
export function getBranchNodes(
  branch: string,
  includeInfinite = false
): ResearchNodeDefinition[] {
  return RESEARCH_NODES.filter(
    (n) => n.branch === branch && (includeInfinite ? true : !n.isInfinite)
  ).sort((a, b) => a.tier - b.tier)
}

// Returns all nodes for display in a branch including infinite
export function getBranchNodesAll(branch: string): ResearchNodeDefinition[] {
  return RESEARCH_NODES.filter((n) => n.branch === branch).sort(
    (a, b) => (a.isInfinite ? 999 : a.tier) - (b.isInfinite ? 999 : b.tier)
  )
}
