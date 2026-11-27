// Generator display utilities used by GeneratorCard and tooltip components

import type { GameState } from '@/types/game'
import { GENERATORS } from '@/constants/generators'
import {
  generatorEffectiveCost,
  getNextMilestoneInfo,
  CENTURY_MUTATIONS,
  type CenturyMutation,
  getMilestoneMultiplier
} from '@/lib/productionEngine'
import {
  formatPointsCompact,
  formatTimeToAfford,
  getNetSpendablePPS
} from '@/lib/format'
import { getSuperrecursiveCoreLevel } from './relicEffects'

export function getActiveCenturyMutations(quantity: bigint): CenturyMutation[] {
  return CENTURY_MUTATIONS.filter((m) => quantity >= m.threshold)
}

export function getNextCenturyMutation(
  quantity: bigint
): CenturyMutation | null {
  return CENTURY_MUTATIONS.find((m) => quantity < m.threshold) ?? null
}

// Shared visibility rule for GeneratorList and digit keyboard shortcuts
export function isGeneratorVisible(
  index: number,
  state: {
    generators: GameState['generators']
    lifetimePoints?: bigint
    activeChallengeRestrictions: { maxGeneratorTier: number | null } | null
  }
): boolean {
  const maxTier = state.activeChallengeRestrictions?.maxGeneratorTier ?? null
  if (maxTier !== null && index >= maxTier) return false
  if (index < 5) return true

  const gen = state.generators[index]
  if (gen && gen.quantity > 0n) return true

  const baseCost = GENERATORS[index]?.baseCost
  if (
    baseCost !== undefined &&
    state.lifetimePoints !== undefined &&
    state.lifetimePoints >= baseCost
  ) {
    return true
  }

  const highestOwned = state.generators.reduce((max, g, i) => {
    if (maxTier !== null && i >= maxTier) return max
    return g.quantity > 0n ? i : max
  }, 0)

  return index <= highestOwned + 2
}

// Returns the next milestone threshold for a generator
// Uses the shared cumulative step helper so display never drifts from production
export function getNextMilestone(
  generatorIndex: number,
  quantity: bigint,
  state: GameState
): { current: number; next: number; doublings: number } {
  const sc8Tiers = state.challengeRecords['SC8']?.completedTiers ?? 0
  return getNextMilestoneInfo(
    generatorIndex,
    quantity,
    state.arUpgrades.milestone_sharpener,
    getSuperrecursiveCoreLevel(state),
    sc8Tiers
  )
}

export function formatMilestoneMultiplier(steps: number): string {
  if (steps <= 0) return '1x'
  return `${formatPointsCompact(getMilestoneMultiplier(steps))}x`
}

// Returns the time-to-afford string
export function getTimeToAffordString(
  generatorIndex: number,
  state: GameState
): string {
  const gen = state.generators[generatorIndex]
  if (!gen) return ''

  const cost = generatorEffectiveCost(generatorIndex, gen.quantity, state)
  if (state.researchPoints >= cost) return ''

  const netPPS = getNetSpendablePPS(
    state.cachedPointsPerSecond,
    state.activeMegaprojectId,
    state.megaprojectAllocationPercent
  )

  return formatTimeToAfford(cost, state.researchPoints, netPPS)
}