// Generator display utilities used by GeneratorCard and tooltip components

import type { GameState } from '@/types/game'
import {
  generatorEffectiveCost,
  getMilestoneInterval,
  marginalPPS
} from '@/lib/productionEngine'
import {
  formatPoints,
  formatRate,
  formatTimeToAfford,
  formatPercent
} from '@/lib/format'
import { getSuperrecursiveCoreLevel } from './relicEffects'

// Returns the next milestone threshold for a generator
// Interval honors Milestone Sharpener and Superrecursive Core via the
// shared production-engine helper so display never drifts from production
export function getNextMilestone(
  generatorIndex: number,
  quantity: bigint,
  state: GameState
): { current: number; next: number; multiplier: number } {
  const interval = getMilestoneInterval(
    generatorIndex,
    quantity,
    state.arUpgrades.milestone_sharpener,
    getSuperrecursiveCoreLevel(state)
  )
  const q = Number(quantity)
  const nextMilestone =
    q === 0 ? interval : Math.ceil((q + 1) / interval) * interval
  const doublings = Math.floor(nextMilestone / interval)
  return {
    current: q,
    next: nextMilestone,
    multiplier: Math.pow(2, doublings)
  }
}
// Returns the milestone string for display on a generator card
// e.g. "12/25 - 2x at 25", total multiplier at the next threshold
export function getMilestoneString(
  generatorIndex: number,
  quantity: bigint,
  state: GameState
): string {
  const { current, next, multiplier } = getNextMilestone(
    generatorIndex,
    quantity,
    state
  )
  if (quantity === 0n) return `0/${next} - ${multiplier}x at ${next}`
  return `${current}/${next} - ${multiplier}x at ${next}`
}

// Returns the marginal cost efficiency as a string
// e.g. "+1.25M RP/s per 1K RP"
export function getCostEfficiencyString(
  generatorIndex: number,
  state: GameState
): string {
  const gen = state.generators[generatorIndex]
  if (!gen) return ''

  const cost = generatorEffectiveCost(generatorIndex, gen.quantity, state)
  if (cost <= 0n) return ''

  const marginal = marginalPPS(generatorIndex, state)
  if (marginal <= 0n) return ''

  // RP/s gained per RP spent
  const efficiency = Number(marginal) / Number(cost)

  if (efficiency < 0.001) {
    return `+${formatRate(marginal)} / ${formatPoints(cost)} RP`
  }

  return `${formatPercent(efficiency * 100, 2)} gain/cost`
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

  return formatTimeToAfford(
    cost,
    state.researchPoints,
    state.cachedPointsPerSecond
  )
}