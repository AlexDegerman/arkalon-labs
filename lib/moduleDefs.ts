// Generator module definitions and cost calculations
// Three module types per generator, each capped at level 5 (AC5: 8)

import { GENERATORS } from '@/constants/generators'
import type { GeneratorState, ModuleType, GameState } from '@/types/game'
import { MODULE_LEVEL_CAP, MODULE_LEVEL_CAP_AC5 } from '@/constants/game'

export function isGeneratorChassisOverclocked(
  gen: GeneratorState | undefined,
  cap: number
): boolean {
  if (!gen || gen.quantity === 0n) return false
  return (
    gen.efficiencyLevel >= cap &&
    gen.costReductionLevel >= cap &&
    gen.synergyLevel >= cap
  )
}

export function getOverclockedChassisCount(state: GameState): number {
  const cap = getModuleLevelCap(state)
  return state.generators.filter((g) => isGeneratorChassisOverclocked(g, cap))
    .length
}

export interface ModuleDefinition {
  type: ModuleType
  label: string
  description: string
  // Cost multiplier applied to the generator's base cost
  // Efficiency: 10^level, CostReduction: 15^level, Synergy: 25^level
  costMultiplierBase: number
  effectPerLevel: string
}

export const MODULE_DEFINITIONS: Record<ModuleType, ModuleDefinition> = {
  efficiency: {
    type: 'efficiency',
    label: 'Output Boost',
    description: "Multiplies this generator's RP output.",
    costMultiplierBase: 10,
    effectPerLevel: '+25% output per level (compounding)'
  },
  cost_reduction: {
    type: 'cost_reduction',
    label: 'Cost Discount',
    description: 'Slows how fast generator buy prices increase.',
    costMultiplierBase: 15,
    effectPerLevel: 'Slows price scaling (-0.015/lv)'
  },
  synergy: {
    type: 'synergy',
    label: 'Cross-Boost',
    description: 'Lets this generator boost a linked generator.',
    costMultiplierBase: 25,
    effectPerLevel: 'Powers linked generator boost (+bonus/lv)'
  }
}

// Returns the cost to upgrade a specific module to the next level
export function getModuleUpgradeCost(
  generatorIndex: number,
  moduleType: ModuleType,
  currentLevel: number,
  sc4Tiers = 0
): bigint {
  const def = GENERATORS[generatorIndex]
  if (!def) return 0n

  const moduleDef = MODULE_DEFINITIONS[moduleType]
  const nextLevel = currentLevel + 1

  // Cost = generatorBaseCost * costMultiplierBase^nextLevel
  let cost = BigInt(
    Math.round(
      Number(def.baseCost) * Math.pow(moduleDef.costMultiplierBase, nextLevel)
    )
  )

  // SC4 reward: Module upgrade costs reduced by 10% per tier
  if (sc4Tiers > 0) {
    const discountFactor = BigInt(Math.max(50, 100 - 10 * sc4Tiers))
    cost = (cost * discountFactor) / 100n
  }

  return cost
}

// Returns the effective level cap for modules
// AC5 challenge completion raises cap by +1 per tier up to 8
export function getModuleLevelCap(state: {
  activeChallengeRestrictions: { moduleLevelCapOverride: number | null } | null
  challengeRecords: Record<string, { completedTiers: number }>
}): number {
  // Challenge override (during AC5 run: doubled levels)
  const override = state.activeChallengeRestrictions?.moduleLevelCapOverride
  if (override !== null && override !== undefined) {
    return override
  }

  const ac5Tiers = state.challengeRecords['AC5']?.completedTiers ?? 0
  if (ac5Tiers > 0) {
    return Math.min(MODULE_LEVEL_CAP_AC5, MODULE_LEVEL_CAP + ac5Tiers)
  }

  return MODULE_LEVEL_CAP
}

// Returns the effect description for a module at a given level
export function getModuleEffectLabel(
  moduleType: ModuleType,
  level: number,
  ac5Active = false
): string {
  if (level === 0) return 'Not installed'
  const effectiveLevel = ac5Active ? level * 2 : level

  switch (moduleType) {
    case 'efficiency': {
      const mult = Math.pow(1.25, effectiveLevel).toFixed(2)
      return `x${mult} output`
    }
    case 'cost_reduction': {
      const reduction = (0.015 * effectiveLevel).toFixed(3)
      return `-${reduction} price scaling`
    }
    case 'synergy': {
      return `Active (Lv${effectiveLevel})`
    }
  }
}

export interface UpgradeAllModulesPlan {
  purchaseCount: number
  totalCost: bigint
  nextCheapestCost: bigint | null
  remainingToMaxCost: bigint
  nextGenerators: GeneratorState[]
}

export function getUpgradeAllModulesPlan(
  state: Pick<
    GameState,
    | 'researchPoints'
    | 'generators'
    | 'challengeRecords'
    | 'activeChallengeRestrictions'
  >,
  filterType?: ModuleType
): UpgradeAllModulesPlan {
  const nextGenerators = state.generators.map((g) => ({ ...g }))
  if (state.activeChallengeRestrictions?.modulesDisabled) {
    return {
      purchaseCount: 0,
      totalCost: 0n,
      nextCheapestCost: null,
      remainingToMaxCost: 0n,
      nextGenerators
    }
  }

  const cap = getModuleLevelCap(state)
  const sc4Tiers = state.challengeRecords['SC4']?.completedTiers ?? 0
  const types: ModuleType[] = filterType
    ? [filterType]
    : ['efficiency', 'cost_reduction', 'synergy']

  let remainingToMaxCost = 0n
  let nextCheapestCost: bigint | null = null

  for (let i = 0; i < 20; i++) {
    const gen = nextGenerators[i]
    if (!gen || gen.quantity === 0n) continue

    for (const type of types) {
      const startLvl =
        type === 'efficiency'
          ? gen.efficiencyLevel
          : type === 'cost_reduction'
            ? gen.costReductionLevel
            : gen.synergyLevel

      if (startLvl >= cap) continue

      const nextCost = getModuleUpgradeCost(i, type, startLvl, sc4Tiers)
      if (nextCheapestCost === null || nextCost < nextCheapestCost) {
        nextCheapestCost = nextCost
      }

      for (let lvl = startLvl; lvl < cap; lvl++) {
        remainingToMaxCost += getModuleUpgradeCost(i, type, lvl, sc4Tiers)
      }
    }
  }

  let currentRP = state.researchPoints
  let totalCost = 0n
  let purchaseCount = 0
  let canContinue = true

  while (canContinue) {
    canContinue = false

    for (let i = 0; i < 20; i++) {
      const gen = nextGenerators[i]
      if (!gen || gen.quantity === 0n) continue

      for (const type of types) {
        const lvl =
          type === 'efficiency'
            ? gen.efficiencyLevel
            : type === 'cost_reduction'
              ? gen.costReductionLevel
              : gen.synergyLevel

        if (lvl >= cap) continue

        const cost = getModuleUpgradeCost(i, type, lvl, sc4Tiers)
        if (currentRP >= cost) {
          currentRP -= cost
          totalCost += cost
          purchaseCount++
          canContinue = true

          if (type === 'efficiency') gen.efficiencyLevel += 1
          else if (type === 'cost_reduction') gen.costReductionLevel += 1
          else gen.synergyLevel += 1
        }
      }
    }
  }

  return {
    purchaseCount,
    totalCost,
    nextCheapestCost,
    remainingToMaxCost,
    nextGenerators
  }
}