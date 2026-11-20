import {
  RESEARCH_NODES,
  RESEARCH_NODE_MAP,
  INF_NODE_COST_SCALING
} from '@/constants/research'
import type { ResearchNodeDefinition } from '@/constants/research'
import type { GameState } from '@/types/game'
import { infNodeCostAtLevel } from '@/lib/format'
import { getRelicRealityBranchCostMultiplier, getRelicResearchSpeedMultiplier, getRelicTechCostMultiplier } from './relicEffects'
import { RESEARCH_QUEUE_MAX_BASE } from '@/constants/game'
import { getMegaprojectPhase } from './megaprojectDefs'

export type { ResearchNodeDefinition }

export function getOverclockDetails(
  nodeId: string,
  state: GameState,
  remainingSeconds?: number
): { cost: bigint; secondsReduced: number } {
  const fullCost = getNodeCost(nodeId, state)
  const totalStudyTime = getEffectiveStudyTime(nodeId, state)
  const secondsReduced = Math.max(5, Math.round(totalStudyTime * 0.25))
  if (remainingSeconds === undefined || remainingSeconds >= secondsReduced) {
    return { cost: fullCost, secondsReduced }
  }
  const fraction = Math.max(0.05, remainingSeconds / secondsReduced)
  const cost = (fullCost * BigInt(Math.ceil(fraction * 10000))) / 10000n
  return { cost: cost > 1n ? cost : 1n, secondsReduced }
}

// Returns whether O6 prerequisite-bypass is unlocked and still available this run
export function getO6BypassStatus(state: GameState): {
  unlocked: boolean
  remaining: number
} {
  if (
    state.activeChallengeRestrictions?.techMatrixDisabled ||
    !state.completedResearchNodes.includes('O6')
  ) {
    return { unlocked: false, remaining: 0 }
  }
  return { unlocked: true, remaining: state.o6BypassUsed ? 0 : 1 }
}

// Returns true if a node's prerequisites are satisfied
export function isNodeAvailable(nodeId: string, state: GameState): boolean {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node) return false

  // Technology Matrix must be unlocked and not disabled by active challenge
  if (!state.unlocks.techMatrix) return false
  if (state.activeChallengeRestrictions?.techMatrixDisabled) return false

  // Challenge: energy branch locked (SC9)
  if (
    state.activeChallengeRestrictions?.energyBranchLocked &&
    node.branch === 'energy'
  )
    return false

  // Challenge: arkalon branch locked (SC3)
  if (
    state.activeChallengeRestrictions?.arkalonBranchLocked &&
    node.branch === 'arkalon'
  )
    return false

  // Challenge: single branch only (SC7)
  if (state.activeChallengeRestrictions?.singleBranchOnly) {
    const activeOrDoneBranch =
      state.completedResearchNodes
        .map((id) => RESEARCH_NODE_MAP[id]?.branch)
        .find(Boolean) ||
      state.activeResearchSlots
        .map((s) => (s.nodeId ? RESEARCH_NODE_MAP[s.nodeId]?.branch : null))
        .find(Boolean) ||
      state.researchQueue
        .map((id) => RESEARCH_NODE_MAP[id]?.branch)
        .find(Boolean)

    if (activeOrDoneBranch && node.branch !== activeOrDoneBranch) {
      return false
    }
  }

  // Infinite nodes require branch tier 8 to be completed
  if (node.isInfinite) {
    const prereq = node.prerequisiteId
    if (prereq && !state.completedResearchNodes.includes(prereq)) return false
    return true
  }

  // Standard nodes require previous tier in same branch (O6 allows bypassing 1 prereq per reset)
  if (node.prerequisiteId) {
    const hasPrereq = state.completedResearchNodes.includes(node.prerequisiteId)
    if (!hasPrereq) {
      if (getO6BypassStatus(state).remaining <= 0) return false
    }
  }

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

  let cost: bigint
  if (node.isInfinite) {
    const level = state.infiniteResearchLevels[nodeId] ?? 0
    const scaling = INF_NODE_COST_SCALING[nodeId] ?? 1.5
    cost = infNodeCostAtLevel(node.cost, scaling, level)
  } else {
    cost = node.cost
  }

  const relic14Mult = getRelicTechCostMultiplier(state)
  if (relic14Mult < 1) {
    cost = (cost * BigInt(Math.round(relic14Mult * 10000))) / 10000n
  }

  if (node.branch === 'reality') {
    const relic19Mult = getRelicRealityBranchCostMultiplier(state)
    if (relic19Mult < 1) {
      cost = (cost * BigInt(Math.round(relic19Mult * 10000))) / 10000n
    }
  }

  // Arkalon Matrix Mirror Phase 2: -10% research node costs
  if (getMegaprojectPhase('arkalon_matrix_mirror', state) >= 2) {
    cost = (cost * 90n) / 100n
  }

  // Arkalon Resonance anomaly booster: 25% tech cost reduction
  if (
    state.activeAnomalyType === 'arkalon_resonance' ||
    state.activeAnomalyType === 'fused_chronal_breach'
  ) {
    cost = (cost * 75n) / 100n
  }

  return cost
}

// Returns the effective study time for a node in seconds, applying all reductions
export function getEffectiveStudyTime(
  nodeId: string,
  state: GameState
): number {
  const node = RESEARCH_NODE_MAP[nodeId]
  if (!node || node.isInfinite) return 0

  // SC2 reward: Tier-1 research nodes complete instantly
  if (
    (state.challengeRecords['SC2']?.completedTiers ?? 0) >= 1 &&
    node.tier === 1
  ) {
    return 0
  }

  let time = node.studyTimeSeconds

  // C2: -5% study time
  if (state.completedResearchNodes.includes('C2')) {
    time *= 0.95
  }

  // R2: -15% study time
  if (state.completedResearchNodes.includes('R2')) {
    time *= 0.85
  }

  // O2: -10% Arkalon branch study time
  if (
    node.branch === 'arkalon' &&
    state.completedResearchNodes.includes('O2')
  ) {
    time *= 0.9
  }

  if (!state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
    // AR Research Accelerant: -3% per level (multiplicative)
    const accelLevel = state.arUpgrades.research_accelerant
    if (accelLevel > 0) {
      time *= Math.pow(0.97, accelLevel)
    }

    // CF Temporal Compression: -25%
    if (state.cfUpgrades.temporal_compression > 0) {
      time *= 0.75
    }
  }

  // R_INF: -1% per level (multiplicative, 95% hard cap)
  const rInfLevel = state.infiniteResearchLevels['R_INF'] ?? 0
  if (rInfLevel > 0) {
    const reduction = Math.max(0.05, Math.pow(0.99, rInfLevel))
    time *= reduction
  }

  // AC3 challenge: timers do not tick (handled in tick action)

  // Operation artifact Empirical Compass: -10% Reality branch
  if (
    node.branch === 'reality' &&
    state.operationArtifactsUnlocked.includes('empirical_compass')
  ) {
    time *= 0.9
  }

  // Chronos Array Phase 1: -10% Reality study time
  if (
    node.branch === 'reality' &&
    getMegaprojectPhase('chronos_array', state) >= 1
  ) {
    time *= 0.9
  }
  // Arkalon's Left Eye relic (ID 1): +2% Arkalon branch speed per level
  time /= getRelicResearchSpeedMultiplier(node.branch, state)

  // SC3 reward: +15% Arkalon Branch research speed per tier
  const sc3Tiers = state.challengeRecords['SC3']?.completedTiers ?? 0
  if (node.branch === 'arkalon' && sc3Tiers > 0) {
    time /= 1 + 0.15 * sc3Tiers
  }

  // SC7 reward: -15% research time per tier (multiplicative)
  const sc7Tiers = state.challengeRecords['SC7']?.completedTiers ?? 0
  if (sc7Tiers > 0) {
    time *= Math.pow(0.85, sc7Tiers)
  }

  // AC3 reward: All research timers permanently -20% per tier
  const ac3Tiers = state.challengeRecords['AC3']?.completedTiers ?? 0
  if (ac3Tiers > 0) {
    time *= Math.pow(0.8, ac3Tiers)
  }

  // Omniscient achievement capstone: -10% research study times
  if (state.achievements?.includes('research_all')) {
    time *= 0.9
  }

  // Active challenge research timer multiplier
  const timerMultiplier =
    state.activeChallengeRestrictions?.researchTimerMultiplier ?? 1
  time *= timerMultiplier

  return Math.max(1, time)
}

// Returns true if a second research slot is available (R3 completed)
export function hasParallelResearch(state: GameState): boolean {
  return state.completedResearchNodes.includes('R3')
}

// Returns true if CF Deep Research Slots bonus slot is active
export function hasThirdResearchSlot(state: GameState): boolean {
  if (state.activeChallengeRestrictions?.prestigeUpgradesDisabled) return false
  return state.cfUpgrades.deep_research_slots > 0
}

// Returns the number of active research slots available
export function getActiveSlotCount(state: GameState): number {
  // SC10 challenge: force single slot regardless of R3 or CF upgrades
  if (state.activeChallengeRestrictions?.singleResearchSlot) return 1

  return (
    1 +
    (hasParallelResearch(state) ? 1 : 0) +
    (hasThirdResearchSlot(state) ? 1 : 0)
  )
}

// Computes maximum research queue slots (base 4 + SC10 tiers + AC8 completion)
export function getResearchQueueMax(state: GameState): number {
  const sc10Tiers = state.challengeRecords['SC10']?.completedTiers ?? 0
  const ac8Done = (state.challengeRecords['AC8']?.completedTiers ?? 0) > 0 ? 1 : 0
  return RESEARCH_QUEUE_MAX_BASE + sc10Tiers + ac8Done
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