// Relic passive effects integrated into the production engine
// Called from recalculatePPS in productionEngine.ts

import type { GameState } from '@/types/game'
import { GENERATOR_CLASS } from '@/constants/generators'
import { getClassResonanceMultiplier, getEquippedClassCounts } from '@/lib/relicDefs'

export function getRelicEffectiveMultiplier(
  relicId: number,
  state: GameState
): number {
  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled ?? false
  const ac2Tiers = state.challengeRecords['AC2']?.completedTiers ?? 0
  const arEffectivenessMult = prestigeDisabled ? 1 : 1 + 0.2 * ac2Tiers
  const resonanceLevel = prestigeDisabled
    ? 0
    : (state.arUpgrades.relic_resonance ?? 0)
  const resonanceBonus = 1 + 0.05 * resonanceLevel * arEffectivenessMult
  const preservationMult =
    !prestigeDisabled && (state.cfUpgrades.relic_preservation ?? 0) > 0
      ? 1.25
      : 1
  return (
    resonanceBonus *
    preservationMult *
    getClassResonanceMultiplier(relicId, state)
  )
}

// Returns per-generator multiplier from equipped relics for a specific generator
export function getRelicPerGeneratorMultiplier(
  generatorIndex: number,
  state: GameState
): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  let multiplier = 1
  const genClass = GENERATOR_CLASS[generatorIndex]

  // Major Resonance (3+ matching equipped relics): +10% base output to matching generator class
  const classCounts = getEquippedClassCounts(state)
  if (classCounts[genClass] >= 3) {
    multiplier *= 1.1
  }

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0
    if (level === 0) continue

    const effectiveBonus = getRelicEffectiveMultiplier(slot.relicId, state)

    switch (slot.relicId) {
      case 3:
        // +5% energy-class per level
        if (genClass === 'energy') {
          multiplier *= 1 + 0.05 * level * effectiveBonus
        }
        break

      case 7:
        // +10% computation-class per level
        if (genClass === 'computation') {
          multiplier *= 1 + 0.1 * level * effectiveBonus
        }
        break

      case 10:
        // +15% Singularity Reactor (gen 5) per level
        if (generatorIndex === 5) {
          multiplier *= 1 + 0.15 * level * effectiveBonus
        }
        break

      case 12: {
        // +0.5% per Stellar Harvester to all energy generators per level
        if (genClass === 'energy') {
          const harvesterCount = Number(state.generators[14]?.quantity ?? 0n)
          multiplier *= 1 + 0.005 * level * harvesterCount * effectiveBonus
        }
        break
      }

      case 15:
        // Reality Engines (gen 4) +10% per level
        if (generatorIndex === 4) {
          multiplier *= 1 + 0.1 * level * effectiveBonus
        }
        break

      case 16: {
        // Arkalon Interfaces (gen 6) +2% per other active generator per level
        if (generatorIndex === 6) {
          const activeGenTypes = state.generators.filter(
            (g, i) => i !== 6 && g.quantity > 0n
          ).length
          multiplier *= 1 + 0.02 * level * activeGenTypes * effectiveBonus
        }
        break
      }

      case 18: {
        // Galactic Engines boost Stellar Harvesters +1% per Engine per level
        if (generatorIndex === 14) {
          const galacticCount = Number(state.generators[15]?.quantity ?? 0n)
          multiplier *= 1 + 0.01 * level * galacticCount * effectiveBonus
        }
        break
      }

      case 20:
        // Void Compressor (gen 19) +50% per level (cap level 20)
        if (generatorIndex === 19) {
          const capLevel = Math.min(20, level)
          multiplier *= 1 + 0.5 * capLevel * effectiveBonus
        }
        break
    }
  }

  return multiplier
}

// Returns the additive production exponent bonus from equipped relics
export function getRelicExponentBonus(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 0
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0
    if (level === 0) continue

    // Tachyon Prism (relic 8): +0.02 exponent per level
    if (slot.relicId === 8) {
      bonus += 0.02 * level * getRelicEffectiveMultiplier(8, state)
    }
  }

  return bonus
}

// Superrecursive Core (relic 11) effective level while equipped in an active slot
export function getSuperrecursiveCoreLevel(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 0
  if (!state.unlockedRelics.includes(11)) return 0
  if (!state.relicSlots.some((s) => s.relicId === 11)) return 0
  return (state.relicLevels[11] ?? 0) * getRelicEffectiveMultiplier(11, state)
}

// Returns the offline efficiency bonus from equipped relics
export function getRelicOfflineEfficiencyBonus(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 0
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0

    // Entropic Anchor (relic 5): +1% per level (cap 100%)
    if (slot.relicId === 5) {
      bonus += Math.min(1.0, 0.01 * level * getRelicEffectiveMultiplier(5, state))
    }
  }

  return bonus
}

// Returns the AR prestige bonus multiplier from equipped relics
export function getRelicARBonus(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  let bonus = 0

  for (const slot of state.relicSlots) {
    if (!slot.relicId) continue
    const level = state.relicLevels[slot.relicId] ?? 0

    // Void Compass (relic 9): +3% AR per prestige per level
    if (slot.relicId === 9) {
      bonus += 0.03 * level * getRelicEffectiveMultiplier(9, state)
    }
  }

  return 1 + bonus
}

// Returns growth factor reduction for first 5 generators from Infinite Ledger relic
export function getInfiniteLedgerReduction(
  relicLevel: number,
  state?: GameState
): number {
  const mult = state ? getRelicEffectiveMultiplier(4, state) : 1
  return 0.001 * relicLevel * mult
}

// Returns research speed multiplier for Arkalon Branch from Arkalon's Left Eye
export function getRelicResearchSpeedMultiplier(
  branch: string,
  state: GameState
): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 1) continue
    const level = state.relicLevels[1] ?? 0
    if (branch === 'arkalon') {
      return 1 + 0.02 * level * getRelicEffectiveMultiplier(1, state)
    }
  }
  return 1
}

export function getRelicSynergyBonus(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 13) continue
    const level = state.relicLevels[13] ?? 0
    return 1 + 0.05 * level * getRelicEffectiveMultiplier(13, state)
  }
  return 1
}

export function getRelicTechCostMultiplier(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 14) continue
    const level = state.relicLevels[14] ?? 0
    return Math.max(0.1, 1 - 0.015 * level * getRelicEffectiveMultiplier(14, state))
  }
  return 1
}

export function getRelicDarkEnergyCostMultiplier(
  generatorIndex: number,
  state: GameState
): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  if (generatorIndex !== 12 && generatorIndex !== 13) return 1
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 17) continue
    const level = state.relicLevels[17] ?? 0
    return Math.max(0.1, 1 - 0.02 * level * getRelicEffectiveMultiplier(17, state))
  }
  return 1
}

export function getRelicRealityBranchCostMultiplier(state: GameState): number {
  if (state.activeChallengeRestrictions?.relicsDisabled) return 1
  for (const slot of state.relicSlots) {
    if (slot.relicId !== 19) continue
    const level = state.relicLevels[19] ?? 0
    return Math.max(0.1, 1 - 0.03 * level * getRelicEffectiveMultiplier(19, state))
  }
  return 1
}