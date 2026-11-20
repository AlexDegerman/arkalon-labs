'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  getRelicBulkUpgradeInfo,
  getRelicSlotCount,
  getSwapCooldownSeconds,
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
  if (!targetRelics || targetRelics.length === 0) {
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
  const cooldown = getSwapCooldownSeconds(store)
  const usedIds = new Set<number>()
  let triggeredCooldown = false
  let blockedByCooldown = false

  const newSlots = Array.from({ length: slotCount }, (_, i) => {
    const current = store.relicSlots[i] ?? {
      relicId: null,
      cooldownRemaining: 0
    }
    const rawDesired = targetRelics[i] ?? null
    const desiredId =
      rawDesired !== null &&
      store.unlockedRelics.includes(rawDesired) &&
      !usedIds.has(rawDesired)
        ? rawDesired
        : null

    if (current.relicId === desiredId) {
      if (desiredId !== null) usedIds.add(desiredId)
      return { ...current }
    }

    if (current.relicId !== null) {
      if (cooldown > 0) {
        triggeredCooldown = true
        return { relicId: null, cooldownRemaining: cooldown }
      }
      if (desiredId !== null) usedIds.add(desiredId)
      return { relicId: desiredId, cooldownRemaining: 0 }
    }

    if (current.cooldownRemaining > 0) {
      if (desiredId !== null) blockedByCooldown = true
      return { ...current }
    }

    if (desiredId !== null) usedIds.add(desiredId)
    return { relicId: desiredId, cooldownRemaining: 0 }
  })

  useGameStore.setState({ relicSlots: newSlots })
  playSound('equip')
  useGameStore.getState().recalcPPS()
  markAchievementsDirty()

  if (triggeredCooldown || blockedByCooldown) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'info',
      title: 'Socket Recalibration',
      message: triggeredCooldown
        ? `Replaced sockets entered ${cooldown}s cooldown. Re-apply preset when ready or unlock Relic Preservation.`
        : 'Some sockets are still cooling down. Re-apply preset after recalibration completes.',
      autoDismissMs: 3500
    })
  }
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
    newSlots[availableSlotIndex] = {
      relicId,
      cooldownRemaining: 0
    }
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

  const cooldown = getSwapCooldownSeconds(store)

  useGameStore.setState((s) => {
    const newSlots = [...s.relicSlots]
    newSlots[slotIndex] = {
      relicId: null,
      cooldownRemaining: cooldown
    }
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