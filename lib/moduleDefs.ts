// Generator module definitions and cost calculations
// Three module types per generator, each capped at level 5 (AC5: 8)

import { GENERATORS, MODULE_SYNERGIES } from '@/constants/generators'
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

const moduleCostCache = new Map<string, bigint>()

// Returns the cost to upgrade a specific module to the next level
export function getModuleUpgradeCost(
  generatorIndex: number,
  moduleType: ModuleType,
  currentLevel: number,
  sc4Tiers = 0
): bigint {
  const cacheKey = `${generatorIndex}:${moduleType}:${currentLevel}:${sc4Tiers}`
  const cached = moduleCostCache.get(cacheKey)
  if (cached !== undefined) return cached

  const def = GENERATORS[generatorIndex]
  if (!def) return 0n

  const moduleDef = MODULE_DEFINITIONS[moduleType]
  const nextLevel = currentLevel + 1

  // Pure BigInt scaling: base multiplier up to Lv25, 100x up to Lv100, 1000x above Lv100
  const baseFactor = BigInt(moduleDef.costMultiplierBase)
  let cost: bigint
  if (nextLevel <= 25) {
    cost = def.baseCost * baseFactor ** BigInt(nextLevel)
  } else if (nextLevel <= 100) {
    cost = def.baseCost * baseFactor ** 25n * 100n ** BigInt(nextLevel - 25)
  } else {
    cost =
      def.baseCost *
      baseFactor ** 25n *
      100n ** 75n *
      1000n ** BigInt(nextLevel - 100)
  }

  // SC4 reward: Module upgrade costs reduced by 10% per tier
  if (sc4Tiers > 0) {
    const discountFactor = BigInt(Math.max(50, 100 - 10 * sc4Tiers))
    cost = (cost * discountFactor) / 100n
  }

  moduleCostCache.set(cacheKey, cost)
  return cost
}

// Returns the effective core level cap for modules (used for 2x Maxed Set bonus)
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

// Returns per-track cap: Cost Discount and Tier 11-20 Cross-Boost stay at core cap;
// Output Boost and Tier 1-10 Cross-Boost expand across Prestige tiers and Eras into deep endgame
export function getTrackLevelCap(
  generatorIndex: number,
  moduleType: ModuleType,
  state: {
    activeChallengeRestrictions: {
      moduleLevelCapOverride: number | null
    } | null
    challengeRecords: Record<string, { completedTiers: number }>
    lifetimePoints?: bigint
    stats?: {
      totalPrestigesTier1?: number
      totalPrestigesTier2?: number
      totalPrestigesTier3?: number
      peakLifetimePoints?: bigint
      o10EverCompleted?: boolean
    }
    completedResearchNodes?: string[]
  }
): number {
  const baseCap = getModuleLevelCap(state)
  const override = state.activeChallengeRestrictions?.moduleLevelCapOverride
  if (override !== null && override !== undefined) {
    return baseCap
  }

  if (moduleType === 'cost_reduction') return baseCap
  if (
    moduleType === 'synergy' &&
    !MODULE_SYNERGIES.some((s) => s.sourceIndex === generatorIndex)
  ) {
    return baseCap
  }

  const peakRP =
    (state.stats?.peakLifetimePoints ?? 0n) > (state.lifetimePoints ?? 0n)
      ? (state.stats?.peakLifetimePoints ?? 0n)
      : (state.lifetimePoints ?? 0n)

  if (
    state.stats?.o10EverCompleted ||
    state.completedResearchNodes?.includes('O10') ||
    peakRP >= 10n ** 140n
  ) {
    return Math.max(baseCap, 250)
  }
  if ((state.stats?.totalPrestigesTier3 ?? 0) > 0 || peakRP >= 10n ** 85n) {
    return Math.max(baseCap, 75)
  }
  if ((state.stats?.totalPrestigesTier2 ?? 0) > 0 || peakRP >= 10n ** 35n) {
    return Math.max(baseCap, 30)
  }
  if ((state.stats?.totalPrestigesTier1 ?? 0) > 0 || peakRP >= 10n ** 18n) {
    return Math.max(baseCap, 15)
  }

  return baseCap
}

export function getNextModuleCapHint(state: {
  activeChallengeRestrictions: { moduleLevelCapOverride: number | null } | null
  challengeRecords: Record<string, { completedTiers: number }>
  lifetimePoints?: bigint
  stats?: {
    totalPrestigesTier1?: number
    totalPrestigesTier2?: number
    totalPrestigesTier3?: number
    peakLifetimePoints?: bigint
    o10EverCompleted?: boolean
  }
  completedResearchNodes?: string[]
}): { currentCap: number; nextHint: string | null } {
  const currentCap = getTrackLevelCap(0, 'efficiency', state)
  if (state.activeChallengeRestrictions?.moduleLevelCapOverride != null) {
    return { currentCap, nextHint: null }
  }
  if (currentCap >= 250) {
    return { currentCap, nextHint: null }
  }
  if (currentCap >= 75) {
    return { currentCap, nextHint: 'Next cap: Lv250 at Node O10 or 10^140 RP' }
  }
  if (currentCap >= 30) {
    return { currentCap, nextHint: 'Next cap: Lv75 at Tier III or 10^85 RP' }
  }
  if (currentCap >= 15) {
    return { currentCap, nextHint: 'Next cap: Lv30 at Tier II or 10^35 RP' }
  }
  return { currentCap, nextHint: 'Next cap: Lv15 at Tier I or 10^18 RP' }
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
    | 'lifetimePoints'
    | 'generators'
    | 'challengeRecords'
    | 'activeChallengeRestrictions'
    | 'stats'
    | 'completedResearchNodes'
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
      const cap = getTrackLevelCap(i, type, state)
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

  const activeTracks: Array<{ i: number; type: ModuleType; cap: number }> = []
  for (let i = 0; i < 20; i++) {
    const gen = nextGenerators[i]
    if (!gen || gen.quantity === 0n) continue
    for (const type of types) {
      const cap = getTrackLevelCap(i, type, state)
      const lvl =
        type === 'efficiency'
          ? gen.efficiencyLevel
          : type === 'cost_reduction'
            ? gen.costReductionLevel
            : gen.synergyLevel
      if (lvl < cap) activeTracks.push({ i, type, cap })
    }
  }

  let currentRP = state.researchPoints
  let totalCost = 0n
  let purchaseCount = 0

  while (activeTracks.length > 0) {
    let boughtAny = false

    for (let idx = activeTracks.length - 1; idx >= 0; idx--) {
      const track = activeTracks[idx]
      const gen = nextGenerators[track.i]
      const lvl =
        track.type === 'efficiency'
          ? gen.efficiencyLevel
          : track.type === 'cost_reduction'
            ? gen.costReductionLevel
            : gen.synergyLevel

      if (lvl >= track.cap) {
        activeTracks.splice(idx, 1)
        continue
      }

      const cost = getModuleUpgradeCost(track.i, track.type, lvl, sc4Tiers)
      if (currentRP >= cost) {
        currentRP -= cost
        totalCost += cost
        purchaseCount++
        boughtAny = true

        if (track.type === 'efficiency') gen.efficiencyLevel += 1
        else if (track.type === 'cost_reduction') gen.costReductionLevel += 1
        else gen.synergyLevel += 1

        if (lvl + 1 >= track.cap) {
          activeTracks.splice(idx, 1)
        }
      } else {
        activeTracks.splice(idx, 1)
      }
    }

    if (!boughtAny) break
  }

  return {
    purchaseCount,
    totalCost,
    nextCheapestCost,
    remainingToMaxCost,
    nextGenerators
  }
}