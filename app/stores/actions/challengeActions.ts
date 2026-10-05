'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { CHALLENGE_BALANCE_MAP, getEffectiveTarget } from '@/lib/challengeDefs'
import { CHALLENGE_MAP } from '@/constants/challenges'
import { buildTier1ResetState } from '@/lib/prestigeCalc'
import {
  dispatchChallengeEnter,
  dispatchChallengeComplete
} from '@/lib/dialogueDispatcher'
import { markUnlocksDirty, markAchievementsDirty } from '@/lib/dirtyFlags'

// Challenge actions

// Enters a challenge run - starts a fresh Tier I prestige with restrictions
export function enterChallenge(challengeId: string): void {
  const store = useGameStore.getState()

  const def = CHALLENGE_BALANCE_MAP[challengeId]
  if (!def) return

  // Must have done at least one prestige
  if (store.stats.totalPrestigesTier1 === 0) return

  // AC/EC challenges require Tier II/III
  if (challengeId.startsWith('AC') && store.stats.totalPrestigesTier2 === 0)
    return
  if (challengeId.startsWith('EC') && store.stats.totalPrestigesTier3 === 0)
    return

  const currentTier = store.challengeRecords[challengeId]?.completedTiers ?? 0
  const maxTiers = CHALLENGE_MAP[challengeId]?.maxTiers ?? 5
  if (currentTier >= maxTiers) return

  const restrictions = def.buildRestrictions()

  // Apply same reset as Tier I prestige
  const resetPatch = buildTier1ResetState(store, 0)

  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    chronalFractures: s.chronalFractures,
    omniSpars: s.omniSpars,
    arUpgrades: s.arUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: { ...s.stats, lastPrestigeTime: Date.now() },
    // Challenge state
    activeChallengeId: challengeId,
    activeChallengeRestrictions: restrictions
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  dispatchChallengeEnter(challengeId)

  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'anomaly',
    title: `Challenge: ${CHALLENGE_MAP[challengeId]?.name ?? challengeId}`,
    message:
      CHALLENGE_MAP[challengeId]?.restrictionSummary ?? 'Restrictions active.',
    autoDismissMs: 6000
  })
}

// Exits a challenge run (completes or abandons)
export function exitChallenge(targetMet: boolean): void {
  const store = useGameStore.getState()
  if (!store.activeChallengeId) return

  const challengeId = store.activeChallengeId
  const currentRecord = store.challengeRecords[challengeId]
  const currentTier = currentRecord?.completedTiers ?? 0
  const currentBest = currentRecord?.bestRP ?? 0n

  const newTiers = targetMet ? currentTier + 1 : currentTier
  const newBest =
    store.lifetimePoints > currentBest ? store.lifetimePoints : currentBest

  useGameStore.setState((s) => ({
    activeChallengeId: null,
    activeChallengeRestrictions: null,
    challengeRecords: {
      ...s.challengeRecords,
      [challengeId]: {
        completedTiers: newTiers,
        bestRP: newBest
      }
    }
  }))

  if (targetMet) {
    dispatchChallengeComplete()
    applyChallengePermanentReward(challengeId, newTiers)
    useUIStore.getState().pushAlert({
      priority: 1,
      variant: 'unlock',
      title: 'Challenge Complete',
      message: `${CHALLENGE_MAP[challengeId]?.name} - Tier ${newTiers} completed. Reward applied.`,
      autoDismissMs: 6000
    })
  }

  // Reset to normal prestige state
  const resetPatch = buildTier1ResetState(store, 0)
  useGameStore.setState((s) => ({
    ...resetPatch,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    artifactDust: s.artifactDust,
    automation: s.automation,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    chronalFractures: s.chronalFractures,
    omniSpars: s.omniSpars,
    arUpgrades: s.arUpgrades
  }))

  useGameStore.getState().recalcPPS()
  markUnlocksDirty()
  markAchievementsDirty()
}

// Checks if the current challenge target has been met (called from tick)
export function checkChallengeCompletion(): void {
  const store = useGameStore.getState()
  if (!store.activeChallengeId) return

  const challengeId = store.activeChallengeId
  const def = CHALLENGE_BALANCE_MAP[challengeId]
  if (!def) return

  const currentTier = store.challengeRecords[challengeId]?.completedTiers ?? 0
  const hasAccelerant = store.arUpgrades.challenge_accelerant > 0
  const target = getEffectiveTarget(challengeId, currentTier + 1, hasAccelerant)

  if (store.lifetimePoints >= target) {
    exitChallenge(true)
  }
}

// Applies the permanent reward for completing a challenge tier
function applyChallengePermanentReward(
  challengeId: string,
  tier: number
): void {
  const store = useGameStore.getState()

  if (challengeId === 'SC11') {
    // +1 relic slot per tier (max 6)
    if (store.relicSlots.length < 6) {
      useGameStore.setState((s) => ({
        relicSlots: [...s.relicSlots, { relicId: null, cooldownRemaining: 0 }]
      }))
    }
  }

  if (challengeId === 'SC5' && tier >= 5) {
    // SC5 Tier 5: unlock Auto-Stabilize Anomaly
    useGameStore.setState((s) => ({
      automation: { ...s.automation, autoStabilizeAnomaly: false } // unlocked but off by default
    }))
  }

  if (challengeId === 'SC6' && tier >= 3) {
    // SC6 Tier 3: unlock Auto-Buy Optimal
    useGameStore.setState((s) => ({
      automation: { ...s.automation, autoBuyOptimal: false } // unlocked but off by default
    }))
  }

  if (challengeId === 'SC12' && tier >= 3) {
    // SC12 Tier 3: unlock Auto-Launch Probe
    useGameStore.setState((s) => ({
      automation: { ...s.automation, autoLaunchProbe: false }
    }))
  }

  if (challengeId === 'AC6') {
    // AC6 completion: unlock Auto-Equip Relic + free relic level
    useGameStore.setState((s) => ({
      automation: { ...s.automation, autoEquipRelic: false }
    }))
  }

  if (challengeId === 'AC6' && tier > 0) {
    // AC6: +1 free relic level to all unlocked relics
    useGameStore.setState((s) => {
      const newLevels = { ...s.relicLevels }
      for (const relicId of s.unlockedRelics) {
        newLevels[relicId] = Math.min(100, (newLevels[relicId] ?? 0) + 1)
      }
      return { relicLevels: newLevels }
    })
  }
}
