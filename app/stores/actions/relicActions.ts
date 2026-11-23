'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  getRelicBulkUpgradeInfo,
  getRelicSlotCount,
  canEquipToSlot,
  isRelicEquipped,
  getRelicSlotIndex
} from '@/lib/relicDefs'
import { RELIC_LEVEL_CAP } from '@/constants/game'
import { markAchievementsDirty } from '@/lib/dirtyFlags'
import { playSound } from '@/hooks/useSound'
import { getRelicRarity, RELIC_MAP } from '@/constants/relics'
import { dispatchRelicDiscovered } from '@/lib/dialogueDispatcher'
import { useUIStore } from '../uiStore'

// Relic actions

export function saveRelicPreset(presetIndex: number): void {
  const store = useGameStore.getState()
  const currentSlots = store.relicSlots.map((s) => s.relicId)
  if (currentSlots.every((id) => id === null)) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'No Relics Equipped',
      message: 'Equip at least one relic before saving to a preset.',
      autoDismissMs: 2500
    })
    return
  }
  const presets = [...(store.relicPresets ?? [[], [], []])]
  while (presets.length < 3) presets.push([])
  presets[presetIndex] = currentSlots

  useGameStore.setState({ relicPresets: presets })
  playSound('click')
  useUIStore.getState().pushAlert({
    priority: 2,
    variant: 'info',
    title: `Preset ${presetIndex + 1} Saved`,
    message: 'Current relic configuration anchored to memory bank.',
    autoDismissMs: 2500
  })
}

export function loadRelicPreset(presetIndex: number): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.relicsDisabled) return

  const presets = store.relicPresets ?? []
  const targetRelics = presets[presetIndex]
  if (!targetRelics || targetRelics.every((id) => id === null)) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Empty Preset',
      message: 'Save a relic configuration to this slot first.',
      autoDismissMs: 2500
    })
    return
  }

  const slotCount = getRelicSlotCount(store)
  const usedIds = new Set<number>()

  const newSlots = Array.from({ length: slotCount }, (_, i) => {
    const rawDesired = targetRelics[i] ?? null
    const desiredId =
      rawDesired !== null &&
      store.unlockedRelics.includes(rawDesired) &&
      !usedIds.has(rawDesired)
        ? rawDesired
        : null

    if (desiredId !== null) usedIds.add(desiredId)
    return { relicId: desiredId }
  })

  useGameStore.setState({ relicSlots: newSlots })
  playSound('equip')
  useGameStore.getState().recalcPPS()
  markAchievementsDirty()
}

// Equips a relic into the first available slot
export function equipRelic(relicId: number, silent = false): void {
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
    newSlots[availableSlotIndex] = { relicId }
    return { relicSlots: newSlots }
  })

  if (!silent) playSound('equip')
  useGameStore.getState().recalcPPS()
}

// Unequips a relic from its slot, starting the swap cooldown
export function unequipRelic(relicId: number): void {
  const store = useGameStore.getState()
  if (store.activeChallengeRestrictions?.relicsDisabled) return
  const slotIndex = getRelicSlotIndex(relicId, store)
  if (slotIndex === -1) return

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[slotIndex] = { relicId: null }
    return { relicSlots: newSlots }
  })

  playSound('equip')
  useGameStore.getState().recalcPPS()
}

// Upgrades a relic using artifact dust (supports 1, 10, or 'max')
export function upgradeRelic(
  relicId: number,
  amount: number | 'max' = 1
): void {
  const store = useGameStore.getState()

  if (!store.unlockedRelics.includes(relicId)) return

  const maxLevel = RELIC_MAP[relicId]?.maxLevel ?? RELIC_LEVEL_CAP
  const currentLevel = store.relicLevels[relicId] ?? 0
  if (currentLevel >= maxLevel) return

  const { levels, cost } = getRelicBulkUpgradeInfo(
    relicId,
    currentLevel,
    store.artifactDust,
    amount
  )
  if (levels <= 0 || store.artifactDust < cost) return

  useGameStore.setState((s) => ({
    artifactDust: s.artifactDust - cost,
    relicLevels: {
      ...s.relicLevels,
      [relicId]: Math.min(maxLevel, (s.relicLevels[relicId] ?? 0) + levels)
    }
  }))

  playSound('purchase')

  // Relic level changes affect production
  useGameStore.getState().recalcPPS()
  markAchievementsDirty()
}

export function awardRelic(relicId: number, silent = false): void {
  const store = useGameStore.getState()
  if (store.unlockedRelics.includes(relicId)) return

  useGameStore.setState((s) => ({
    unlockedRelics: [...s.unlockedRelics, relicId],
    relicLevels: {
      ...s.relicLevels,
      [relicId]: Math.max(1, s.relicLevels[relicId] ?? 1)
    }
  }))

  const rarity = getRelicRarity(relicId)

  if (!silent) {
    playSound(`relic-${rarity}`)
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Relic Discovered',
      message: `${RELIC_MAP[relicId]?.name ?? 'Relic'} (${rarity}) has been added to your collection.`,
      autoDismissMs: 5000
    })
    dispatchRelicDiscovered()
  }

  useGameStore.getState().recalcPPS()
  markAchievementsDirty()
}