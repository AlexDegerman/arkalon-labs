'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'
import {
  canPrestigeTier1,
  calculateARGain,
  buildTier1ResetState,
  canPrestigeTier2,
  calculateCFGain,
  buildTier2ResetState,
  canPrestigeTier3,
  calculateOSGain,
  buildTier3ResetState
} from '@/lib/prestigeCalc'
import {
  AR_UPGRADES,
  CF_UPGRADES,
  OS_UPGRADES,
  getUpgradeCost
} from '@/lib/prestigeUpgradeDefs'
import { checkResearchSlotExpansion } from '@/lib/unlockWatcher'
import { dispatchPrestigeComplete } from '@/lib/dialogueDispatcher'
import { markUnlocksDirty } from '@/lib/dirtyFlags'

// Prestige actions

// Performs a Tier I Reality Recalibration prestige
export function triggerTierI(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier1(store)) return

  const arGained = calculateARGain(store)
  const resetPatch = buildTier1ResetState(store, arGained)

  // Anomalous Operations unlock on first prestige
  const firstPrestige = store.stats.totalPrestigesTier1 === 0

  useGameStore.setState((s) => ({
    ...resetPatch,
    // Retain all unlocks except reset per design
    unlocks: {
      ...s.unlocks,
      anomalousOperations: firstPrestige ? true : s.unlocks.anomalousOperations
    },
    stats: {
      ...s.stats,
      totalPrestigesTier1: s.stats.totalPrestigesTier1 + 1,
      lastPrestigeTime: Date.now()
    },
    // Retain settings, achievements, relics, automation, operations
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    chronalFractures: s.chronalFractures,
    omniSpars: s.omniSpars,
    arUpgrades: s.arUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 3000)

  dispatchPrestigeComplete(1)
  useUIStore.getState().triggerPrestigeAnimation()

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Reality Recalibrated',
    message: `Earned ${arGained} Arkalon Resonance. Rebuilding in parallel dimension.`,
    autoDismissMs: 6000
  })

  if (firstPrestige) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Anomalous Operations Active',
      message: 'Global 90-day operation cycle has begun.',
      autoDismissMs: 5000
    })
  }
}

// Performs a Tier II Timeline Severance prestige
export function triggerTierII(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier2(store)) return

  const cfGained = calculateCFGain(store)
  const resetPatch = buildTier2ResetState(store, cfGained)

  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    omniSpars: s.omniSpars,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: {
      ...s.stats,
      totalPrestigesTier2: s.stats.totalPrestigesTier2 + 1,
      lastPrestigeTime: Date.now()
    }
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 3000)

  dispatchPrestigeComplete(2)
  useUIStore.getState().triggerPrestigeAnimation()

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Timeline Severed',
    message: `Earned ${cfGained} Chronal Fractures. New timeline initializing.`,
    autoDismissMs: 6000
  })
}

// Performs a Tier III Singular Synthesis prestige
export function triggerTierIII(): void {
  const store = useGameStore.getState()
  if (!canPrestigeTier3(store)) return

  const osGained = calculateOSGain(store)
  const resetPatch = buildTier3ResetState(store, osGained)

  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationMultiplierLevel: s.operationMultiplierLevel,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    osUpgrades: s.osUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: {
      ...s.stats,
      totalPrestigesTier3: s.stats.totalPrestigesTier3 + 1,
      lastPrestigeTime: Date.now()
    }
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useMusicStore.getState().setContext('prestige')
  setTimeout(() => useMusicStore.getState().setContext('idle'), 4000)

  dispatchPrestigeComplete(3)
  useUIStore.getState().triggerPrestigeAnimation()

  useUIStore.getState().pushAlert({
    priority: 0,
    variant: 'prestige',
    title: 'Singular Synthesis Complete',
    message: `Earned ${osGained} Omni-Spars. The Omega Construct begins.`,
    autoDismissMs: 6000
  })
}

// Prestige upgrade purchase action
export function buyPrestigeUpgrade(
  upgradeId: string,
  currency: 'ar' | 'cf' | 'os'
): void {
  const store = useGameStore.getState()
  const allDefs = [...AR_UPGRADES, ...CF_UPGRADES, ...OS_UPGRADES]
  const def = allDefs.find((d: any) => d.id === upgradeId)
  if (!def) return

  // Get current level from appropriate slice
  let currentLevel = 0
  if (currency === 'ar') {
    currentLevel = (store.arUpgrades as any)[upgradeId] ?? 0
  } else if (currency === 'cf') {
    currentLevel = (store.cfUpgrades as any)[upgradeId] ?? 0
  } else {
    currentLevel = (store.osUpgrades as any)[upgradeId] ?? 0
  }

  if (currentLevel >= def.maxLevel) return

  const cost = getUpgradeCost(def, currentLevel)

  // Check currency
  if (currency === 'ar' && store.arkalonResonance < cost) return
  if (currency === 'cf' && store.chronalFractures < cost) return
  if (currency === 'os' && store.omniSpars < cost) return

  // Deduct currency and increment level
  useGameStore.setState((s) => {
    const newLevel = currentLevel + 1
    if (currency === 'ar') {
      return {
        arkalonResonance: s.arkalonResonance - cost,
        arUpgrades: { ...s.arUpgrades, [upgradeId]: newLevel },
        // Activate automation if relevant upgrade purchased
        automation:
          upgradeId === 'auto_buy_basic'
            ? { ...s.automation, autoBuyBasic: true }
            : upgradeId === 'auto_research_queue'
              ? { ...s.automation, autoResearchQueue: true }
              : s.automation
      }
    } else if (currency === 'cf') {
      return {
        chronalFractures: s.chronalFractures - cost,
        cfUpgrades: { ...s.cfUpgrades, [upgradeId]: newLevel },
        automation:
          upgradeId === 'auto_module_buyer'
            ? { ...s.automation, autoModuleBuy: true }
            : s.automation
      }
    } else {
      return {
        omniSpars: s.omniSpars - cost,
        osUpgrades: { ...s.osUpgrades, [upgradeId]: newLevel },
        automation:
          upgradeId === 'the_automated_lab'
            ? { ...s.automation, autoPrestigeTierI: true }
            : upgradeId === 'automated_timeline_severance'
              ? { ...s.automation, autoPrestigeTierII: true }
              : s.automation
      }
    }
  })

  // Research slot expansion check for deep_research_slots
  if (upgradeId === 'deep_research_slots') {
    checkResearchSlotExpansion(useGameStore.getState())
  }

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
}
