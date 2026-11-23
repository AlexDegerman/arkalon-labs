'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  CHALLENGE_BALANCE_MAP,
  getEffectiveTarget,
  isChallengeAccelerantActive
} from '@/lib/challengeDefs'
import { CHALLENGE_MAP } from '@/constants/challenges'
import { buildTier1ResetState } from '@/lib/prestigeCalc'
import type {
  ChallengeRestrictions,
  GameState,
  PreChallengeSnapshot
} from '@/types/game'
import { useMusicStore } from '@/app/stores/musicStore'
import { checkResearchSlotExpansion } from '@/lib/unlockWatcher'
import {
  dispatchChallengeEnter,
  dispatchChallengeComplete,
  dispatchChallengeFailed
} from '@/lib/dialogueDispatcher'
import { markUnlocksDirty, markAchievementsDirty } from '@/lib/dirtyFlags'
import { playSound } from '@/hooks/useSound'
import { formatPoints } from '@/lib/format'
import { RELIC_MAP } from '@/constants/relics'

// Challenge actions

function buildPreChallengeSnapshot(state: GameState): PreChallengeSnapshot {
  return {
    researchPoints: state.researchPoints.toString(),
    lifetimePoints: state.lifetimePoints.toString(),
    generators: state.generators.map((g) => ({
      quantity: g.quantity.toString(),
      efficiencyLevel: g.efficiencyLevel,
      costReductionLevel: g.costReductionLevel,
      synergyLevel: g.synergyLevel
    })),
    synthesizers: [...(state.synthesizers ?? [0, 0, 0, 0])],
    completedResearchNodes: [...state.completedResearchNodes],
    activeResearchSlots: state.activeResearchSlots.map((s) => ({ ...s })),
    researchQueue: [...state.researchQueue],
    infiniteResearchLevels: { ...state.infiniteResearchLevels },
    o6BypassUsed: Boolean(state.o6BypassUsed),
    activeMegaprojectId: state.activeMegaprojectId,
    megaprojectAllocationPercent: state.megaprojectAllocationPercent,
    megaprojectRPAbsorbed: state.megaprojectRPAbsorbed.toString(),
    activeAnomalyType: state.activeAnomalyType,
    anomalyTimeRemaining: state.anomalyTimeRemaining,
    timeToNextAnomalyCheck: state.timeToNextAnomalyCheck,
    manualOperationCycle: state.manualOperationCycle,
    lastPrestigeTime: state.stats.lastPrestigeTime,
    currentRunSeconds: state.stats.currentRunSeconds ?? 0,
    startedAt: Date.now()
  }
}

function restoreRunFromSnapshot(
  snapshot: PreChallengeSnapshot,
  freshStore: GameState,
  arEarned: number
): Partial<GameState> {
  const restoredGenerators = freshStore.generators.map((g, i) => ({
    quantity: BigInt(snapshot.generators[i]?.quantity ?? '0'),
    efficiencyLevel:
      snapshot.generators[i]?.efficiencyLevel ?? g.efficiencyLevel,
    costReductionLevel:
      snapshot.generators[i]?.costReductionLevel ?? g.costReductionLevel,
    synergyLevel: snapshot.generators[i]?.synergyLevel ?? g.synergyLevel
  }))

  return {
    researchPoints: BigInt(snapshot.researchPoints),
    lifetimePoints: BigInt(snapshot.lifetimePoints),
    arkalonResonance: freshStore.arkalonResonance + arEarned,
    generators: restoredGenerators,
    synthesizers: freshStore.synthesizers.map(
      (_, i) => snapshot.synthesizers?.[i] ?? 0
    ),
    completedResearchNodes: snapshot.completedResearchNodes ?? [],
    activeResearchSlots: snapshot.activeResearchSlots ?? [
      { nodeId: null, timerRemaining: 0 }
    ],
    researchQueue: snapshot.researchQueue ?? [],
    infiniteResearchLevels: snapshot.infiniteResearchLevels ?? {},
    o6BypassUsed: Boolean(snapshot.o6BypassUsed),
    activeMegaprojectId: snapshot.activeMegaprojectId ?? null,
    megaprojectAllocationPercent: snapshot.megaprojectAllocationPercent ?? 0,
    megaprojectRPAbsorbed: BigInt(snapshot.megaprojectRPAbsorbed ?? '0'),
    activeAnomalyType: snapshot.activeAnomalyType ?? null,
    anomalyTimeRemaining: snapshot.anomalyTimeRemaining ?? 0,
    timeToNextAnomalyCheck: snapshot.timeToNextAnomalyCheck ?? 180,
    manualOperationCycle: snapshot.manualOperationCycle ?? null,
    preChallengeSnapshot: null,
    stats: {
      ...freshStore.stats,
      lastPrestigeTime: snapshot.lastPrestigeTime,
      currentRunSeconds:
        snapshot.currentRunSeconds ?? freshStore.stats.currentRunSeconds ?? 0,
      totalResearchNodesCompleted:
        snapshot.completedResearchNodes?.length ??
        freshStore.stats.totalResearchNodesCompleted
    }
  }
}

// Enters a challenge run - snapshots active run and resets for restricted run
export function enterChallenge(challengeId: string): void {
  const store = useGameStore.getState()
  if (store.activeChallengeId) return

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

  const snapshot = buildPreChallengeSnapshot(store)
  const restrictions = def.buildRestrictions()

  // Challenge runs start clean: no prestige seed bonuses or retained research
  const resetPatch = buildTier1ResetState(store, 0, true)
  let initialCompletedNodes = resetPatch.completedResearchNodes ?? []
  if (restrictions.techMatrixDisabled || restrictions.singleBranchOnly) {
    initialCompletedNodes = []
  } else {
    if (restrictions.energyBranchLocked) {
      initialCompletedNodes = initialCompletedNodes.filter(
        (id) => !id.startsWith('E')
      )
    }
    if (restrictions.arkalonBranchLocked) {
      initialCompletedNodes = initialCompletedNodes.filter(
        (id) => !id.startsWith('O')
      )
    }
  }

  const needsResearchBootstrap =
    restrictions.productionOnlyWhileResearching &&
    !restrictions.techMatrixDisabled
  const sc2InstantTier1 =
    (store.challengeRecords['SC2']?.completedTiers ?? 0) >= 1
  const bootstrapRP = needsResearchBootstrap
    ? sc2InstantTier1
      ? 6_000n
      : 200n
    : resetPatch.researchPoints

  useGameStore.setState((s) => ({
    ...resetPatch,
    ...(needsResearchBootstrap
      ? { researchPoints: bootstrapRP, lifetimePoints: bootstrapRP }
      : {}),
    completedResearchNodes: initialCompletedNodes,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    relicSlots: s.relicSlots,
    artifactDust: s.artifactDust,
    automation: s.automation,
    currentOperationPoints: s.currentOperationPoints,
    operationArtifactsUnlocked: s.operationArtifactsUnlocked,
    currentOperationCycle: s.currentOperationCycle,
    cfUpgrades: s.cfUpgrades,
    osUpgrades: s.osUpgrades,
    chronalFractures: s.chronalFractures,
    omniSpars: s.omniSpars,
    arUpgrades: s.arUpgrades,
    challengeRecords: s.challengeRecords,
    completedMegaprojects: s.completedMegaprojects,
    unlocks: s.unlocks,
    stats: { ...s.stats, lastPrestigeTime: Date.now(), currentRunSeconds: 0 },
    // Challenge state
    activeChallengeId: challengeId,
    challengeActiveSeconds: 0,
    preChallengeSnapshot: snapshot,
    activeChallengeRestrictions: restrictions
  }))

  useMusicStore.getState().setContext('idle')
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

// Enters the custom post-EC4 Mutator Sandbox
export function enterSandboxChallenge(
  restrictions: ChallengeRestrictions,
  targetRP: bigint
): void {
  const store = useGameStore.getState()

  if (store.activeChallengeId) return
  if (targetRP <= 0n) return

  if ((store.challengeRecords['EC4']?.completedTiers ?? 0) < 1) return

  const snapshot = buildPreChallengeSnapshot(store)
  const resetPatch = buildTier1ResetState(store, 0, true)
  let initialCompletedNodes = resetPatch.completedResearchNodes ?? []
  if (restrictions.techMatrixDisabled || restrictions.singleBranchOnly) {
    initialCompletedNodes = []
  } else {
    if (restrictions.energyBranchLocked) {
      initialCompletedNodes = initialCompletedNodes.filter(
        (id) => !id.startsWith('E')
      )
    }
    if (restrictions.arkalonBranchLocked) {
      initialCompletedNodes = initialCompletedNodes.filter(
        (id) => !id.startsWith('O')
      )
    }
  }

  const needsResearchBootstrap =
    restrictions.productionOnlyWhileResearching &&
    !restrictions.techMatrixDisabled
  const sc2InstantTier1 =
    (store.challengeRecords['SC2']?.completedTiers ?? 0) >= 1
  const bootstrapRP = needsResearchBootstrap
    ? sc2InstantTier1
      ? 6_000n
      : 200n
    : resetPatch.researchPoints

  useGameStore.setState((s) => ({
    ...resetPatch,
    ...(needsResearchBootstrap
      ? { researchPoints: bootstrapRP, lifetimePoints: bootstrapRP }
      : {}),
    completedResearchNodes: initialCompletedNodes,
    settings: s.settings,
    achievements: s.achievements,
    unlockedRelics: s.unlockedRelics,
    relicLevels: s.relicLevels,
    relicSlots: s.relicSlots,
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
    stats: { ...s.stats, lastPrestigeTime: Date.now(), currentRunSeconds: 0 },
    activeChallengeId: 'SANDBOX',
    challengeActiveSeconds: 0,
    preChallengeSnapshot: snapshot,
    sandboxTargetRP: targetRP,
    activeChallengeRestrictions: restrictions
  }))

  useMusicStore.getState().setContext('idle')
  useGameStore.getState().recalcPPS()
  markUnlocksDirty()

  useUIStore.getState().pushAlert({
    priority: 1,
    variant: 'anomaly',
    title: 'Mutator Sandbox Engaged',
    message: `Custom simulation active. Goal: ${targetRP.toString()} RP.`,
    autoDismissMs: 6000
  })
}

// Exits a challenge run and restores the pre-challenge run snapshot
export function exitChallenge(targetMet: boolean): void {
  const store = useGameStore.getState()
  if (!store.activeChallengeId) return

  const challengeId = store.activeChallengeId

  if (challengeId === 'SANDBOX') {
    const isSuccess = targetMet
    const prevBest = store.sandboxBestRP ?? 0n
    const newBest =
      store.lifetimePoints > prevBest ? store.lifetimePoints : prevBest

    useGameStore.setState((s) => ({
      activeChallengeId: null,
      challengeActiveSeconds: 0,
      sandboxTargetRP: 0n,
      activeChallengeRestrictions: null,
      sandboxBestRP: newBest,
      sandboxCompletions: isSuccess
        ? (s.sandboxCompletions ?? 0) + 1
        : s.sandboxCompletions
    }))

    const freshSandbox = useGameStore.getState()
    const hasSnapshot = Boolean(freshSandbox.preChallengeSnapshot)
    const startedAt =
      freshSandbox.preChallengeSnapshot?.startedAt ??
      freshSandbox.stats.lastPrestigeTime
    const durationSeconds = Math.max(
      1,
      Math.floor((Date.now() - (startedAt || Date.now())) / 1000)
    )

    if (isSuccess) {
      playSound('fanfare')
      useUIStore.getState().setChallengeCompletePayload({
        challengeId: 'SANDBOX',
        name: 'Mutator Sandbox',
        category: 'sandbox',
        tierCompleted: freshSandbox.sandboxCompletions ?? 1,
        maxTiers: freshSandbox.sandboxCompletions ?? 1,
        restrictionSummary: 'Custom simulation constraints active.',
        rewardDescription: 'Sandbox completion record updated.',
        arEarned: 0,
        targetReached: store.sandboxTargetRP ?? store.lifetimePoints,
        durationSeconds,
        runRestored: hasSnapshot
      })
      useUIStore.getState().setChallengeCompleteModalOpen(true)
    } else {
      playSound('fail')
      dispatchChallengeFailed()
      useUIStore.getState().pushAlert({
        priority: 2,
        variant: 'info',
        title: 'Sandbox Ended',
        message: `Peak RP this run: ${formatPoints(store.lifetimePoints)} (Best: ${formatPoints(newBest)})`,
        autoDismissMs: 5000
      })
    }
    
    if (freshSandbox.preChallengeSnapshot) {
      const restorePatch = restoreRunFromSnapshot(
        freshSandbox.preChallengeSnapshot,
        freshSandbox,
        0
      )
      useGameStore.setState(restorePatch)
    } else {
      useGameStore.setState({ preChallengeSnapshot: null })
      useUIStore.getState().pushAlert({
        priority: 0,
        variant: 'info',
        title: 'Snapshot Unavailable',
        message:
          'Pre-challenge snapshot was missing; current run state was preserved without reset.',
        autoDismissMs: 6000
      })
    }
    useMusicStore
      .getState()
      .setContext(
        useGameStore.getState().activeAnomalyType ? 'anomaly' : 'idle'
      )
    useGameStore.getState().recalcPPS()
    checkResearchSlotExpansion(useGameStore.getState())
    markUnlocksDirty()
    return
  }

  const currentRecord = store.challengeRecords[challengeId]
  const currentTier = currentRecord?.completedTiers ?? 0
  const currentBest = currentRecord?.bestRP ?? 0n

  const newTiers = targetMet ? currentTier + 1 : currentTier
  const newBest =
    store.lifetimePoints > currentBest ? store.lifetimePoints : currentBest
  const startedAt =
    store.preChallengeSnapshot?.startedAt ?? store.stats.lastPrestigeTime
  const activeChallengeSec = store.challengeActiveSeconds ?? 0
  const durationSeconds = Math.max(
    1,
    activeChallengeSec > 0
      ? activeChallengeSec
      : Math.floor((Date.now() - (startedAt || Date.now())) / 1000)
  )

  useGameStore.setState((s) => {
    const prevBestTime = s.stats.bestChallengeTimes?.[challengeId]
    const nextBestTimes =
      targetMet &&
      (prevBestTime === undefined || durationSeconds < prevBestTime)
        ? {
            ...(s.stats.bestChallengeTimes ?? {}),
            [challengeId]: durationSeconds
          }
        : (s.stats.bestChallengeTimes ?? {})

    return {
      activeChallengeId: null,
      challengeActiveSeconds: 0,
      activeChallengeRestrictions: null,
      challengeRecords: {
        ...s.challengeRecords,
        [challengeId]: {
          completedTiers: newTiers,
          bestRP: newBest
        }
      },
      stats: {
        ...s.stats,
        bestChallengeTimes: nextBestTimes
      }
    }
  })

  const freshStore = useGameStore.getState()
  const arEarned = 0
  const hasSnapshot = Boolean(freshStore.preChallengeSnapshot)

  if (targetMet) {
    playSound('fanfare')
    dispatchChallengeComplete()
    applyChallengePermanentReward(challengeId, newTiers)

    const def = CHALLENGE_MAP[challengeId]
    const hasAccelerant = isChallengeAccelerantActive(challengeId, store)
    const targetReached = getEffectiveTarget(
      challengeId,
      newTiers,
      hasAccelerant
    )

    useUIStore.getState().setChallengeCompletePayload({
      challengeId,
      name: def?.name ?? challengeId,
      category: def?.category ?? 'standard',
      tierCompleted: newTiers,
      maxTiers: def?.maxTiers ?? 3,
      restrictionSummary: def?.restrictionSummary ?? '',
      rewardDescription: def?.rewardDescription ?? 'Permanent bonus applied.',
      arEarned,
      targetReached,
      durationSeconds,
      runRestored: hasSnapshot
    })
    useUIStore.getState().setChallengeCompleteModalOpen(true)
  } else {
    playSound('fail')
    dispatchChallengeFailed()
  }

  const latestStore = useGameStore.getState()
  if (latestStore.preChallengeSnapshot) {
    const restorePatch = restoreRunFromSnapshot(
      latestStore.preChallengeSnapshot,
      latestStore,
      arEarned
    )
    useGameStore.setState(restorePatch)
  } else {
    useGameStore.setState({ preChallengeSnapshot: null })
    useUIStore.getState().pushAlert({
      priority: 0,
      variant: 'info',
      title: 'Snapshot Unavailable',
      message:
        'Pre-challenge snapshot was missing; current run state was preserved without reset.',
      autoDismissMs: 6000
    })
  }
  useMusicStore
    .getState()
    .setContext(useGameStore.getState().activeAnomalyType ? 'anomaly' : 'idle')
  useGameStore.getState().recalcPPS()
  checkResearchSlotExpansion(useGameStore.getState())
  markUnlocksDirty()
  markAchievementsDirty()
}

// Checks if the current challenge target has been met (called from tick)
export function checkChallengeCompletion(): void {
  const store = useGameStore.getState()
  if (!store.activeChallengeId) return

  const challengeId = store.activeChallengeId
  if (challengeId === 'SANDBOX') {
    const target = store.sandboxTargetRP ?? 0n
    if (target > 0n && store.lifetimePoints >= target) {
      exitChallenge(true)
    }
    return
  }

  const def = CHALLENGE_BALANCE_MAP[challengeId]
  if (!def) return

  const currentTier = store.challengeRecords[challengeId]?.completedTiers ?? 0
  const hasAccelerant = isChallengeAccelerantActive(challengeId, store)
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
  if (challengeId === 'SC11') {
    // +1 relic slot per tier (max 6)
    useGameStore.setState((s) => {
      if (s.relicSlots.length < 6) {
        return {
          relicSlots: [...s.relicSlots, { relicId: null }]
        }
      }
      return s
    })
  }

  if (challengeId === 'AC6' && tier > 0) {
    // AC6: +1 free relic level to all unlocked relics
    useGameStore.setState((s) => {
      const newLevels = { ...s.relicLevels }
      for (const relicId of s.unlockedRelics) {
        const maxLevel = RELIC_MAP[relicId]?.maxLevel ?? 100
        newLevels[relicId] = Math.min(maxLevel, (newLevels[relicId] ?? 0) + 1)
      }
      return { relicLevels: newLevels }
    })
  }
}
