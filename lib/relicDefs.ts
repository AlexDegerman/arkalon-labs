// Relic upgrade cost calculation and slot management utilities

import { RELIC_MAP } from '@/constants/relics'
import type { GameState, RelicSlotState } from '@/types/game'
import {
  RELIC_LEVEL_CAP,
  RELIC_SWAP_COOLDOWN_SECONDS,
  RELIC_SWAP_COOLDOWN_CF_SECONDS,
  RELIC_SLOT_COUNT_BASE,
  RELIC_SLOT_COUNT_MAX
} from '@/constants/game'

// Returns the cost in artifact dust to upgrade a relic to the next level
export function getRelicUpgradeCost(
  relicId: number,
  currentLevel: number
): number {
  const def = RELIC_MAP[relicId]
  if (!def) return 0
  if (currentLevel >= RELIC_LEVEL_CAP) return 0

  // cost = baseDustCost * (dustCostScaling ^ currentLevel)
  return Math.ceil(
    def.baseDustCost * Math.pow(def.dustCostScaling, currentLevel)
  )
}

// Returns the number of active relic slots
// Base 3, +1 per SC11 tier (max 6), capped at RELIC_SLOT_COUNT_MAX
export function getRelicSlotCount(state: GameState): number {
  const sc11Tiers = state.challengeRecords['SC11']?.completedTiers ?? 0
  return Math.min(RELIC_SLOT_COUNT_MAX, RELIC_SLOT_COUNT_BASE + sc11Tiers)
}

// Returns the swap cooldown in seconds
// CF Relic Preservation reduces to 2 minutes
export function getSwapCooldownSeconds(state: GameState): number {
  if (state.cfUpgrades.relic_preservation > 0) {
    return RELIC_SWAP_COOLDOWN_CF_SECONDS
  }
  return RELIC_SWAP_COOLDOWN_SECONDS
}

// Returns true if a relic can be equipped in a given slot
// (slot is empty or cooldown has expired)
export function canEquipToSlot(slot: RelicSlotState): boolean {
  return slot.relicId === null && slot.cooldownRemaining <= 0
}

// Returns true if a relic is currently equipped in any slot
export function isRelicEquipped(relicId: number, state: GameState): boolean {
  return state.relicSlots.some((s) => s.relicId === relicId)
}

// Returns the slot index where a relic is equipped, or -1
export function getRelicSlotIndex(relicId: number, state: GameState): number {
  return state.relicSlots.findIndex((s) => s.relicId === relicId)
}

// Returns relic level, defaulting to 0 if not leveled
export function getRelicLevel(relicId: number, state: GameState): number {
  return state.relicLevels[relicId] ?? 0
}

// Returns a text description of the effect at the current level
export function getRelicEffectAtLevel(relicId: number, level: number): string {
  const def = RELIC_MAP[relicId]
  if (!def) return ''

  switch (relicId) {
    case 1:
      return `+${(2 * level).toFixed(0)}% Arkalon Branch research speed`
    case 2:
      return `+${(1.5 * level).toFixed(1)}s anomaly duration`
    case 3:
      return `+${(5 * level).toFixed(0)}% energy-class output`
    case 4:
      return `-${(0.001 * level).toFixed(3)} growth factor (Gen 1-5)`
    case 5:
      return `+${Math.min(100, level)}% offline RP rate`
    case 6:
      return `-${3 * level}s min spawn interval`
    case 7:
      return `+${(10 * level).toFixed(0)}% computation-class output`
    case 8:
      return `+${(0.02 * level).toFixed(2)} production exponent`
    case 9:
      return `+${(3 * level).toFixed(0)}% AR on prestige`
    case 10:
      return `+${(15 * level).toFixed(0)}% Singularity Reactor output`
    case 11:
      return `Milestones trigger ${2 * level} units earlier`
    case 12:
      return `+${(0.5 * level).toFixed(1)}% per Harvester to energy`
    case 13:
      return `+${(5 * level).toFixed(0)}% synergy coefficients`
    case 14:
      return `-${(1.5 * level).toFixed(1)}% tech node costs`
    case 15:
      return `Reality Engines +${(10 * level).toFixed(0)}% speed`
    case 16:
      return `Arkalon Interfaces +${(2 * level).toFixed(0)}% per active gen`
    case 17:
      return `-${(2 * level).toFixed(0)}% dark-energy building costs`
    case 18:
      return `Galactic Engines boost Harvesters +${level}%/Engine`
    case 19:
      return `-${(3 * level).toFixed(0)}% Reality Branch costs`
    case 20:
      return `+${Math.min(1000, 50 * level).toFixed(0)}% Void Compressor`
    default:
      return def.effectPerLevel
  }
}
