// Generator module definitions and cost calculations
// Three module types per generator, each capped at level 5 (AC5: 8)

import { GENERATORS } from '@/constants/generators'
import type { ModuleType } from '@/types/game'
import { MODULE_LEVEL_CAP } from '@/constants/game'

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
    label: 'Efficiency',
    description: "Multiplies this generator's output.",
    costMultiplierBase: 10,
    effectPerLevel: '+25% output per level (1.25^level total)'
  },
  cost_reduction: {
    type: 'cost_reduction',
    label: 'Cost Curve',
    description: "Reduces this generator's cost growth factor.",
    costMultiplierBase: 15,
    effectPerLevel: '-0.015 growth factor per level'
  },
  synergy: {
    type: 'synergy',
    label: 'Synergy',
    description: 'Unlocks and amplifies cross-generator synergy bonuses.',
    costMultiplierBase: 25,
    effectPerLevel: 'Enables synergy bonus at level 1; scales with level'
  }
}

// Returns the cost to upgrade a specific module to the next level
export function getModuleUpgradeCost(
  generatorIndex: number,
  moduleType: ModuleType,
  currentLevel: number
): bigint {
  const def = GENERATORS[generatorIndex]
  if (!def) return 0n

  const moduleDef = MODULE_DEFINITIONS[moduleType]
  const nextLevel = currentLevel + 1

  // Cost = generatorBaseCost * costMultiplierBase^nextLevel
  const multiplier = Math.pow(moduleDef.costMultiplierBase, nextLevel)

  return BigInt(Math.round(Number(def.baseCost) * multiplier))
}

// Returns the effective level cap for modules
// AC5 challenge completion raises cap to 8
export function getModuleLevelCap(state: {
  activeChallengeRestrictions: { moduleLevelCapOverride: number | null } | null
  challengeRecords: Record<string, { completedTiers: number }>
}): number {
  // Challenge override (during AC5 run: doubled levels)
  if (
    state.activeChallengeRestrictions?.moduleLevelCapOverride !== null &&
    state.activeChallengeRestrictions?.moduleLevelCapOverride !== undefined
  ) {
    return state.activeChallengeRestrictions.moduleLevelCapOverride
  }

  // AC5 permanent reward: cap raised to 8
  const ac5Tiers = state.challengeRecords['AC5']?.completedTiers ?? 0
  if (ac5Tiers > 0) return 8

  return MODULE_LEVEL_CAP
}

// Returns the effect description for a module at a given level
export function getModuleEffectLabel(
  moduleType: ModuleType,
  level: number,
  generatorIndex: number
): string {
  if (level === 0) return 'Not installed'

  switch (moduleType) {
    case 'efficiency': {
      const mult = Math.pow(1.25, level).toFixed(2)
      return `x${mult} output`
    }
    case 'cost_reduction': {
      const reduction = (0.015 * level).toFixed(3)
      return `-${reduction} growth factor`
    }
    case 'synergy': {
      return `Synergy active (Lv${level})`
    }
  }
}
