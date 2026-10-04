// Generator display utilities used by GeneratorCard and tooltip components

import type { GameState } from '@/types/game'
import { GENERATORS } from '@/constants/generators'
import { generatorEffectiveCost, marginalPPS } from '@/lib/productionEngine'
import {
  formatPoints,
  formatRate,
  formatTimeToAfford,
  formatPercent,
  formatMilestoneTarget
} from '@/lib/format'
import {
  MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_CAP
} from '@/constants/game'
import { getStageForQuantity } from '@/hooks/useGeneratorStage'

// Returns the next milestone threshold for a generator
export function getNextMilestone(
  generatorIndex: number,
  quantity: bigint
): { current: number; next: number; multiplier: number } {
  const isResearchDesk =
    generatorIndex === 0 && quantity < BigInt(RESEARCH_DESK_MILESTONE_CAP)
  const interval = isResearchDesk
    ? RESEARCH_DESK_MILESTONE_INTERVAL
    : MILESTONE_INTERVAL

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
// e.g. "12/25 - 2x at 25"
export function getMilestoneString(
  generatorIndex: number,
  quantity: bigint
): string {
  const { current, next } = getNextMilestone(generatorIndex, quantity)
  if (quantity === 0n) return `0/${next} - 2x at ${next}`
  return `${current}/${next} - 2x at ${next}`
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

// Returns a full tooltip data object for a generator card
export interface GeneratorTooltipData {
  name: string
  description: string
  baseCost: string
  currentCost: string
  baseOutput: string
  currentOutput: string
  milestoneString: string
  costEfficiency: string
  timeToAfford: string
  stage: 1 | 2 | 3 | 4 | 5 | 6
  moduleEfficiency: number
  moduleCostReduction: number
  moduleSynergy: number
}

export function getGeneratorTooltipData(
  generatorIndex: number,
  state: GameState
): GeneratorTooltipData {
  const def = GENERATORS[generatorIndex]
  const gen = state.generators[generatorIndex]
  if (!def || !gen) {
    return {
      name: '',
      description: '',
      baseCost: '',
      currentCost: '',
      baseOutput: '',
      currentOutput: '',
      milestoneString: '',
      costEfficiency: '',
      timeToAfford: '',
      stage: 1,
      moduleEfficiency: 0,
      moduleCostReduction: 0,
      moduleSynergy: 0
    }
  }

  const cost = generatorEffectiveCost(generatorIndex, gen.quantity, state)
  // Base output is stored as milliRP/sec * 1000
  const baseOutputRPS = def.baseOutput / 1000n
  const pps = state.cachedPointsPerSecond

  return {
    name: def.name,
    description: def.description,
    baseCost: formatPoints(def.baseCost),
    currentCost: formatPoints(cost),
    baseOutput: `${formatPoints(baseOutputRPS)}/s`,
    currentOutput: gen.quantity > 0n ? `${formatRate(pps)}` : '0/s',
    milestoneString: getMilestoneString(generatorIndex, gen.quantity),
    costEfficiency: getCostEfficiencyString(generatorIndex, state),
    timeToAfford: getTimeToAffordString(generatorIndex, state),
    stage: getStageForQuantity(gen.quantity),
    moduleEfficiency: gen.efficiencyLevel,
    moduleCostReduction: gen.costReductionLevel,
    moduleSynergy: gen.synergyLevel
  }
}
