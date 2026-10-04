// Relic passive effects integrated into the production engine
// Called from recalculatePPS in productionEngine.ts

import type { GameState } from '@/types/game'
import { GENERATOR_CLASS } from '@/constants/generators'

// Returns the total production multiplier from all equipped relics
// Only relics in active slots contribute
export function computeRelicProductionMultiplier(state: GameState): number {
  let multiplier = 1

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0
    if (level === 0) continue

    const bonus = getRelicGlobalMultiplier(slot.relicId, level, state)
    multiplier *= bonus
  }

  // Relic Resonance AR upgrade: +5% to all equipped relic effects per level
  // Applied as a meta-multiplier on top of all relic bonuses
  const resonanceLevel = state.arUpgrades.relic_resonance
  if (resonanceLevel > 0 && multiplier > 1) {
    const resonanceBonus = 1 + 0.05 * resonanceLevel
    // Apply to the additive bonus portion only
    multiplier = 1 + (multiplier - 1) * resonanceBonus
  }

  return multiplier
}

// Returns the global production multiplier for a single relic at a given level
function getRelicGlobalMultiplier(
  relicId: number,
  level: number,
  state: GameState
): number {
  switch (relicId) {
    case 1:
      // +2% Arkalon Branch research speed - production effect: none
      // (timer reduction applied in getEffectiveStudyTime)
      return 1

    case 2:
      // +1.5s anomaly duration - no production multiplier
      return 1

    case 3:
      // +5% energy-class generator output per level
      // Applied per-generator in getRelicPerGeneratorMultiplier
      return 1

    case 4:
      // -0.001 growth factor on first 5 generators - cost effect only
      return 1

    case 5:
      // +1% offline rate - no real-time production multiplier
      return 1

    case 6:
      // -3s spawn interval - no production multiplier
      return 1

    case 7:
      // +10% computation-class output per level
      // Applied per-generator in getRelicPerGeneratorMultiplier
      return 1

    case 8: {
      // +0.02 global production exponent per level
      // Applied via getRelicExponentBonus - return 1 here
      return 1
    }

    case 9:
      // +3% AR on prestige - prestige reward modifier only
      return 1

    case 10:
      // +15% Singularity Reactor output per level
      // Applied per-generator
      return 1

    case 11:
      // Milestone trigger shift - milestone calculation effect
      return 1

    case 12: {
      // +0.5% per Stellar Harvester to all energy generators per level
      const harvesterCount = Number(state.generators[14]?.quantity ?? 0n)
      const bonus = 0.005 * level * harvesterCount
      return 1 + bonus
    }

    case 13: {
      // +5% cross-generator synergy coefficients per level
      // Applied in computeSynergyMultiplier as a pass-through
      return 1
    }

    case 14:
      // -1.5% tech node costs - cost effect only
      return 1

    case 15:
      // Reality Engines +10% speed per level
      // Applied per-generator
      return 1

    case 16: {
      // Arkalon Interfaces +2% per other active generator per level
      // Applied per-generator
      return 1
    }

    case 17:
      // -2% dark-energy building costs - cost effect only
      return 1

    case 18: {
      // Galactic Engines boost Stellar Harvesters +1% per Engine per level
      const galacticCount = Number(state.generators[15]?.quantity ?? 0n)
      const bonus = 0.01 * level * galacticCount
      return 1 + bonus
    }

    case 19:
      // -3% Reality Branch costs - cost effect only
      return 1

    case 20: {
      // +50% Void Compressor output per level (cap level 20 = +1000%)
      // Applied per-generator
      return 1
    }

    default:
      return 1
  }
}

// Returns per-generator multiplier from equipped relics for a specific generator
export function getRelicPerGeneratorMultiplier(
  generatorIndex: number,
  state: GameState
): number {
  let multiplier = 1
  const genClass = GENERATOR_CLASS[generatorIndex]

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0
    if (level === 0) continue

    switch (slot.relicId) {
      case 3:
        // +5% energy-class per level
        if (genClass === 'energy') {
          multiplier *= 1 + 0.05 * level
        }
        break

      case 7:
        // +10% computation-class per level
        if (genClass === 'computation') {
          multiplier *= 1 + 0.1 * level
        }
        break

      case 10:
        // +15% Singularity Reactor (gen 5) per level
        if (generatorIndex === 5) {
          multiplier *= 1 + 0.15 * level
        }
        break

      case 15:
        // Reality Engines (gen 4) +10% per level
        if (generatorIndex === 4) {
          multiplier *= 1 + 0.1 * level
        }
        break

      case 16: {
        // Arkalon Interfaces (gen 6) +2% per other active generator per level
        if (generatorIndex === 6) {
          const activeGenTypes = state.generators.filter(
            (g, i) => i !== 6 && g.quantity > 0n
          ).length
          multiplier *= 1 + 0.02 * level * activeGenTypes
        }
        break
      }

      case 20:
        // Void Compressor (gen 19) +50% per level (cap level 20)
        if (generatorIndex === 19) {
          const capLevel = Math.min(20, level)
          multiplier *= 1 + 0.5 * capLevel
        }
        break
    }
  }

  return multiplier
}

// Returns the additive production exponent bonus from equipped relics
export function getRelicExponentBonus(state: GameState): number {
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0
    if (level === 0) continue

    // Tachyon Prism (relic 8): +0.02 exponent per level
    if (slot.relicId === 8) {
      bonus += 0.02 * level
    }
  }

  return bonus
}

// Returns the offline efficiency bonus from equipped relics
export function getRelicOfflineEfficiencyBonus(state: GameState): number {
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0

    // Entropic Anchor (relic 5): +1% per level (cap 100%)
    if (slot.relicId === 5) {
      bonus += Math.min(1.0, 0.01 * level)
    }
  }

  return bonus
}

// Returns the AR prestige bonus multiplier from equipped relics
export function getRelicARBonus(state: GameState): number {
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0

    // Void Compass (relic 9): +3% AR per prestige per level
    if (slot.relicId === 9) {
      bonus += 0.03 * level
    }
  }

  return 1 + bonus
}

// Returns growth factor reduction for first 5 generators from Infinite Ledger relic
export function getInfiniteLedgerReduction(relicLevel: number): number {
  return 0.001 * relicLevel
}

// Returns research speed multiplier for Arkalon Branch from Arkalon's Left Eye
export function getRelicResearchSpeedMultiplier(
  branch: string,
  state: GameState
): number {
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 1) continue
    const level = state.relicLevels[1] ?? 0
    if (branch === 'arkalon') {
      return 1 + 0.02 * level
    }
  }
  return 1
}
