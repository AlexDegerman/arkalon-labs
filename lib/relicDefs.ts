// Relic upgrade cost calculation and slot management utilities

import { RELIC_MAP, RELIC_CLASSES, type RelicClass } from '@/constants/relics'
import type { GameState, RelicSlotState } from '@/types/game'
import {
  RELIC_LEVEL_CAP,
  RELIC_SLOT_COUNT_BASE,
  RELIC_SLOT_COUNT_MAX
} from '@/constants/game'

export function getEquippedClassCounts(state: GameState): Record<RelicClass, number> {
  const counts: Record<RelicClass, number> = {
    computation: 0,
    energy: 0,
    reality: 0,
    arkalon: 0
  }
  for (const slot of state.relicSlots) {
    if (slot.relicId) {
      const cls = RELIC_CLASSES[slot.relicId]
      if (cls) counts[cls]++
    }
  }
  return counts
}

export function getClassResonanceMultiplier(relicId: number, state: GameState): number {
  const cls = RELIC_CLASSES[relicId]
  if (!cls) return 1
  const counts = getEquippedClassCounts(state)
  const count = counts[cls]
  if (count >= 3) return 1.35
  if (count >= 2) return 1.15
  return 1
}

// Returns the cost in artifact dust to upgrade a relic to the next level
export function getRelicUpgradeCost(
  relicId: number,
  currentLevel: number
): number {
  const def = RELIC_MAP[relicId]
  if (!def) return 0
  const maxLevel = def.maxLevel ?? RELIC_LEVEL_CAP
  if (currentLevel >= maxLevel) return 0

  // cost = baseDustCost * (dustCostScaling ^ currentLevel)
  return Math.ceil(
    def.baseDustCost * Math.pow(def.dustCostScaling, currentLevel)
  )
}

// Returns how many levels can be bought (up to `amount` or 'max') and their total dust cost
export function getRelicBulkUpgradeInfo(
  relicId: number,
  currentLevel: number,
  availableDust: number,
  amount: number | 'max'
): { levels: number; cost: number } {
  const def = RELIC_MAP[relicId]
  if (!def) return { levels: 0, cost: 0 }
  const maxLevel = def.maxLevel ?? RELIC_LEVEL_CAP
  const cap = amount === 'max' ? maxLevel - currentLevel : Math.min(amount, maxLevel - currentLevel)

  let levels = 0
  let totalCost = 0
  for (let i = 0; i < cap; i++) {
    const nextCost = getRelicUpgradeCost(relicId, currentLevel + i)
    if (nextCost <= 0 || totalCost + nextCost > availableDust) break
    totalCost += nextCost
    levels++
  }
  return { levels, cost: totalCost }
}

// Returns the number of active relic slots
// Base 3, +1 per SC11 tier (max 6), capped at RELIC_SLOT_COUNT_MAX
export function getRelicSlotCount(state: GameState): number {
  const sc11Tiers = state.challengeRecords['SC11']?.completedTiers ?? 0
  return Math.min(RELIC_SLOT_COUNT_MAX, RELIC_SLOT_COUNT_BASE + sc11Tiers)
}

// Returns true if a relic can be equipped in a given slot
export function canEquipToSlot(slot: RelicSlotState): boolean {
  return slot.relicId === null
}

// Returns true if a relic is currently equipped in any slot
export function isRelicEquipped(relicId: number, state: GameState): boolean {
  return state.relicSlots.some((s) => s.relicId === relicId)
}

// Returns the slot index where a relic is equipped, or -1
export function getRelicSlotIndex(relicId: number, state: GameState): number {
  return state.relicSlots.findIndex((s) => s.relicId === relicId)
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
      return `+${Math.min(100, level)}% offline RP efficiency`
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
      return `+${(0.5 * level).toFixed(1)}% Energy RP per Stellar Harvester`
    case 13:
      return `+${(5 * level).toFixed(0)}% module synergy bonuses`
    case 14:
      return `-${Math.min(90, 1.5 * level).toFixed(1)}% research RP costs`
    case 15:
      return `+${(10 * level).toFixed(0)}% Reality Engine RP output`
    case 16:
      return `+${(2 * level).toFixed(0)}% Arkalon Interface RP per owned tier`
    case 17:
      return `-${Math.min(90, 2 * level).toFixed(0)}% Vacuum Fluctuator & Dark Matter Synthesizer cost`
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
