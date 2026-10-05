'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  getRelicUpgradeCost,
  getRelicSlotCount,
  getSwapCooldownSeconds,
  canEquipToSlot,
  isRelicEquipped,
  getRelicSlotIndex
} from '@/lib/relicDefs'
import { RELIC_LEVEL_CAP } from '@/constants/game'
import { markAchievementsDirty } from '@/lib/dirtyFlags'

// Relic actions

// Equips a relic into the first available slot
export function equipRelic(relicId: number): void {
  const store = useGameStore.getState()

  // SC11: relics cannot be equipped
  if (store.activeChallengeRestrictions?.relicsDisabled) return

  if (!store.unlockedRelics.includes(relicId)) return
  if (isRelicEquipped(relicId, store)) return

  const slotCount = getRelicSlotCount(store)
  const availableSlotIndex = store.relicSlots
    .slice(0, slotCount)
    .findIndex((s) => canEquipToSlot(s))

  if (availableSlotIndex === -1) return

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[availableSlotIndex] = {
      relicId,
      cooldownRemaining: 0
    }
    return { relicSlots: newSlots }
  })

  useGameStore.getState().recalcPPS()
}

// Unequips a relic from its slot, starting the swap cooldown
export function unequipRelic(relicId: number): void {
  const store = useGameStore.getState()
  const slotIndex = getRelicSlotIndex(relicId, store)
  if (slotIndex === -1) return

  const cooldown = getSwapCooldownSeconds(store)

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[slotIndex] = {
      relicId: null,
      cooldownRemaining: cooldown
    }
    return { relicSlots: newSlots }
  })

  useGameStore.getState().recalcPPS()
}

// Upgrades a relic using artifact dust
export function upgradeRelic(relicId: number): void {
  const store = useGameStore.getState()

  if (!store.unlockedRelics.includes(relicId)) return

  const currentLevel = store.relicLevels[relicId] ?? 0
  if (currentLevel >= RELIC_LEVEL_CAP) return

  const cost = getRelicUpgradeCost(relicId, currentLevel)
  if (store.artifactDust < cost) return

  useGameStore.setState((s) => ({
    artifactDust: s.artifactDust - cost,
    relicLevels: {
      ...s.relicLevels,
      [relicId]: (s.relicLevels[relicId] ?? 0) + 1
    }
  }))

  // Relic level changes affect production
  useGameStore.getState().recalcPPS()
  markAchievementsDirty()
}
