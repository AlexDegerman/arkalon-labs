import type { GameState } from '@/types/game'
import type { OfflineProgressPayload } from '@/types/offline'
import {
  DEFAULT_OFFLINE_EFFICIENCY,
  DEFAULT_MAX_OFFLINE_SECONDS,
  CHRONOS_LOOM_OFFLINE_SECONDS,
  MAX_OFFLINE_SECONDS_HARD_CAP
} from '@/constants/game'
import { getRelicOfflineEfficiencyBonus } from './relicEffects'
import {
  getEffectiveConstructionCost,
  getMegaprojectPhase
} from './megaprojectDefs'
import { RESEARCH_NODE_MAP } from '@/constants/research'
import { recalculatePPS } from './productionEngine'
import {
  getActiveSlotCount,
  isNodeAvailable,
  getNodeCost,
  getEffectiveStudyTime
} from './researchNodes'
import { getSynthesizerRates } from './synthesizerDefs'
import {
  getAnomalyBuffScale,
  selectNextAnomaly,
  getEffectiveDuration,
  getNextSpawnInterval,
  getRawAnomalyDuration
} from './anomalyDefs'
import {
  getScanDuration,
  getVeteranRank,
  isZoneUnlocked,
  rollProbeResult,
  ZONE_MAP
} from './excavationDefs'
import { MAX_RP_HARD_CAP } from '@/constants/game'
import { buildTier1ResetState } from './prestigeCalc'
import {
  getEffectiveTarget,
  isChallengeAccelerantActive
} from './challengeDefs'

// Returns the player's current max offline window in seconds
// based on which upgrades and research nodes are active
function getMaxOfflineSeconds(state: GameState): number {
  const techDisabled = state.activeChallengeRestrictions?.techMatrixDisabled

  // R9: expands to 24 hours
  if (!techDisabled && state.completedResearchNodes.includes('R9')) {
    return MAX_OFFLINE_SECONDS_HARD_CAP
  }

  // Chronos Loom operation artifact: expands to 12 hours
  if (state.operationArtifactsUnlocked.includes('chronos_loom')) {
    return CHRONOS_LOOM_OFFLINE_SECONDS
  }

  return DEFAULT_MAX_OFFLINE_SECONDS
}

// Returns the offline efficiency multiplier (0.0 - 1.0)
function getOfflineEfficiency(state: GameState): number {
  const techDisabled = state.activeChallengeRestrictions?.techMatrixDisabled
  const completed = techDisabled ? [] : state.completedResearchNodes
  const sc9Tiers = state.challengeRecords['SC9']?.completedTiers ?? 0
  const sc9Bonus = sc9Tiers * 0.1 // SC9 reward: +10% offline efficiency per tier
  const relicBonus = getRelicOfflineEfficiencyBonus(state)
  const omegaPhaseBonus =
    getMegaprojectPhase('omega_singularity_sphere', state) >= 3 ? 0.15 : 0

  let efficiency = DEFAULT_OFFLINE_EFFICIENCY
  if (completed.includes('E1')) efficiency += 0.15
  if (completed.includes('E2')) efficiency += 0.2

  return Math.min(1.0, efficiency + relicBonus + sc9Bonus + omegaPhaseBonus)
}

function simulateOfflineProbes(
  state: GameState,
  elapsedSeconds: number
): NonNullable<OfflineProgressPayload['cachedProbeResult']> & {
  probesCompletedCount: number
  opEarned: number
} {
  if (
    state.activeChallengeRestrictions?.excavationDisabled ||
    state.probes.length === 0 ||
    elapsedSeconds <= 0
  ) {
    return {
      probes: state.probes,
      dustEarned: 0,
      opEarned: 0,
      newRelics: [],
      relic9PityGain: 0,
      probesCompletedCount: 0
    }
  }

  const autoLaunch =
    state.automation.autoLaunchProbe &&
    (state.challengeRecords['SC12']?.completedTiers ?? 0) >= 3 &&
    state.unlocks.excavation
  const desiredZone = state.autoLaunchZone ?? 'safe'
  const autoZone = isZoneUnlocked(desiredZone, state) ? desiredZone : 'safe'
  const speedBonus = getSynthesizerRates(state).probeSpeedBonus
  const unlockedSet = new Set(state.unlockedRelics)
  const newRelics: number[] = []
  let dustEarned = 0
  let opEarned = 0
  let probesCompletedCount = 0
  let relic9PityGain = 0
  let runningRelic9Pity = state.stats.relic9PityCount ?? 0

  if (!autoLaunch) {
    const probes: GameState['probes'] = []
    for (const orig of state.probes) {
      const probe = { ...orig }
      if (probe.status === 'scanning') {
        if (probe.timerRemaining > elapsedSeconds) {
          probe.timerRemaining = Math.max(
            0,
            probe.timerRemaining - elapsedSeconds
          )
          probes.push(probe)
        } else {
          const remainingAfterScan = elapsedSeconds - probe.timerRemaining
          probe.timerRemaining = 0
          const isRiskZone = probe.zone !== null && probe.zone !== 'safe'
          if (isRiskZone && !unlockedSet.has(9)) {
            relic9PityGain++
            runningRelic9Pity++
          }
          const res = rollProbeResult(
            probe,
            {
              unlockedRelics: Array.from(unlockedSet),
              lifetimePoints: state.lifetimePoints,
              achievements: state.achievements,
              dysonSwarmLevel: state.dysonSwarmLevel,
              unlocks: state.unlocks
            },
            speedBonus
          )
          dustEarned += res.dustEarned
          opEarned += res.opEarned
          if (res.relicDropped > 0 && !unlockedSet.has(res.relicDropped)) {
            unlockedSet.add(res.relicDropped)
            newRelics.push(res.relicDropped)
          }
          if (isRiskZone && !unlockedSet.has(9) && runningRelic9Pity >= 8) {
            unlockedSet.add(9)
            newRelics.push(9)
          }
          if (res.needsRepair) {
            let repairDur = ZONE_MAP[res.zone].repairSeconds || 600
            if (probe.subsystem === 'shielding') {
              repairDur = Math.round(repairDur * 0.5)
            }
            const remRepair = Math.max(0, repairDur - remainingAfterScan)
            if (remRepair <= 0) {
              probe.status = 'idle'
              probe.zone = null
              probe.scanDuration = undefined
              probe.repairTimerRemaining = 0
            } else {
              probe.status = 'repairing'
              probe.zone = null
              probe.scanDuration = undefined
              probe.repairDuration = repairDur
              probe.repairTimerRemaining = remRepair
            }
          } else {
            probesCompletedCount++
            const newExp = (probe.expeditionsCompleted ?? 0) + 1
            probe.expeditionsCompleted = newExp
            probe.veteranRank = getVeteranRank(newExp).rank
            probe.status = 'idle'
            probe.zone = null
            probe.scanDuration = undefined
          }
          probes.push(probe)
        }
        continue
      }
      if (probe.status === 'repairing') {
        const remRepair = Math.max(
          0,
          probe.repairTimerRemaining - elapsedSeconds
        )
        if (remRepair <= 0) {
          probe.status = 'idle'
          probe.zone = null
          probe.repairTimerRemaining = 0
        } else {
          probe.repairTimerRemaining = remRepair
        }
      }
      probes.push(probe)
    }

    return {
      probes,
      dustEarned,
      opEarned,
      newRelics,
      relic9PityGain,
      probesCompletedCount
    }
  }

  const updatedProbes: GameState['probes'] = []
  for (const orig of state.probes) {
    const p = { ...orig }
    let tLeft = elapsedSeconds

    for (let iter = 0; iter < 500 && tLeft > 0; iter++) {
      if (p.status === 'repairing') {
        if (p.repairTimerRemaining > tLeft) {
          p.repairTimerRemaining = Math.max(0, p.repairTimerRemaining - tLeft)
          tLeft = 0
        } else {
          tLeft -= p.repairTimerRemaining
          p.repairTimerRemaining = 0
          p.status = 'idle'
          p.zone = null
        }
        continue
      }

      if (p.status === 'idle') {
        const sub = p.subsystem ?? 'none'
        const dur = getScanDuration(autoZone, sub, speedBonus)
        if (tLeft < dur) {
          p.status = 'scanning'
          p.zone = autoZone
          p.scanDuration = dur
          p.timerRemaining = dur - tLeft
          tLeft = 0
        } else {
          tLeft -= dur
          const isRiskZone = autoZone !== 'safe'
          if (isRiskZone && !unlockedSet.has(9)) {
            relic9PityGain++
            runningRelic9Pity++
          }
          const res = rollProbeResult(
            { ...p, status: 'scanning', zone: autoZone },
            {
              unlockedRelics: Array.from(unlockedSet),
              lifetimePoints: state.lifetimePoints,
              achievements: state.achievements,
              dysonSwarmLevel: state.dysonSwarmLevel,
              unlocks: state.unlocks
            },
            speedBonus
          )
          dustEarned += res.dustEarned
          opEarned += res.opEarned
          if (res.relicDropped > 0 && !unlockedSet.has(res.relicDropped)) {
            unlockedSet.add(res.relicDropped)
            newRelics.push(res.relicDropped)
          }
          if (isRiskZone && !unlockedSet.has(9) && runningRelic9Pity >= 8) {
            unlockedSet.add(9)
            newRelics.push(9)
          }
          if (res.needsRepair) {
            let repairDur = ZONE_MAP[res.zone].repairSeconds || 600
            if (p.subsystem === 'shielding') {
              repairDur = Math.round(repairDur * 0.5)
            }
            p.status = 'repairing'
            p.zone = null
            p.scanDuration = undefined
            p.repairTimerRemaining = repairDur
            p.repairDuration = repairDur
          } else {
            probesCompletedCount++
            const newExp = (p.expeditionsCompleted ?? 0) + 1
            p.expeditionsCompleted = newExp
            p.veteranRank = getVeteranRank(newExp).rank
            p.status = 'idle'
            p.zone = null
            p.timerRemaining = 0
          }
        }
        continue
      }

      if (p.status === 'scanning') {
        if (p.timerRemaining > tLeft) {
          p.timerRemaining = Math.max(0, p.timerRemaining - tLeft)
          tLeft = 0
        } else {
          tLeft -= p.timerRemaining
          p.timerRemaining = 0
          const isRiskZone = p.zone !== null && p.zone !== 'safe'
          if (isRiskZone && !unlockedSet.has(9)) {
            relic9PityGain++
            runningRelic9Pity++
          }
          const res = rollProbeResult(
            p,
            {
              unlockedRelics: Array.from(unlockedSet),
              lifetimePoints: state.lifetimePoints,
              achievements: state.achievements,
              dysonSwarmLevel: state.dysonSwarmLevel,
              unlocks: state.unlocks
            },
            speedBonus
          )
          dustEarned += res.dustEarned
          opEarned += res.opEarned
          if (res.relicDropped > 0 && !unlockedSet.has(res.relicDropped)) {
            unlockedSet.add(res.relicDropped)
            newRelics.push(res.relicDropped)
          }
          if (isRiskZone && !unlockedSet.has(9) && runningRelic9Pity >= 8) {
            unlockedSet.add(9)
            newRelics.push(9)
          }
          if (res.needsRepair) {
            let repairDur = ZONE_MAP[res.zone].repairSeconds || 600
            if (p.subsystem === 'shielding') {
              repairDur = Math.round(repairDur * 0.5)
            }
            p.status = 'repairing'
            p.zone = null
            p.scanDuration = undefined
            p.repairTimerRemaining = repairDur
            p.repairDuration = repairDur
          } else {
            probesCompletedCount++
            const newExp = (p.expeditionsCompleted ?? 0) + 1
            p.expeditionsCompleted = newExp
            p.veteranRank = getVeteranRank(newExp).rank
            p.status = 'idle'
            p.zone = null
            p.scanDuration = undefined
          }
        }
      }
    }

    updatedProbes.push(p)
  }

  return {
    probes: updatedProbes,
    dustEarned,
    opEarned,
    newRelics,
    relic9PityGain,
    probesCompletedCount
  }
}

// Calculates offline RP accumulation, stepped across research completions & anomaly expiry
// Called once on game load or long-gap catchup before the tick loop starts
export function calculateOfflineProgress(
  state: GameState,
  lastSavedTimeMs: number,
  nowMs: number,
  efficiencyOverride?: number
): OfflineProgressPayload {
  const actualElapsed = Math.max(0, (nowMs - lastSavedTimeMs) / 1000)
  const maxOffline = getMaxOfflineSeconds(state)
  const cappedElapsed = Math.min(actualElapsed, maxOffline)
  let ec3CollapseTriggered = false
  let ec3CollapseCount = 0
  let ec3FinalPrestigeTimeMs = nowMs
  let ec3PostCollapseRunSeconds = 0
  let rpTimeBudget = cappedElapsed

  // EC3 forced 5-minute collapse: cap Window 1 RP at remainingInCycle while full cappedElapsed runs probes/synthesizers
  const forcedInterval =
    state.activeChallengeRestrictions?.autoPrestigeIntervalSeconds
  if (forcedInterval && state.activeChallengeId) {
    const preOfflineRunSec =
      state.stats.currentRunSeconds ??
      Math.max(
        0,
        (lastSavedTimeMs - (state.stats.lastPrestigeTime || lastSavedTimeMs)) /
          1000
      )
    const remainingInCycle = Math.max(0, forcedInterval - preOfflineRunSec)
    if (cappedElapsed >= remainingInCycle) {
      rpTimeBudget = remainingInCycle
      ec3CollapseTriggered = true
      const afterFirst = cappedElapsed - remainingInCycle
      ec3CollapseCount = 1 + Math.floor(afterFirst / forcedInterval)
      const intoFinalWindowSec = afterFirst % forcedInterval
      ec3PostCollapseRunSeconds = Math.floor(intoFinalWindowSec)
      ec3FinalPrestigeTimeMs = nowMs - Math.floor(intoFinalWindowSec * 1000)
    }
  }

  const efficiency = efficiencyOverride ?? getOfflineEfficiency(state)
  const effBn = BigInt(Math.round(efficiency * 1000))

  const researchTimersFrozen =
    state.activeChallengeRestrictions?.noResearchTimerTick ?? false
  const techDisabled = state.activeChallengeRestrictions?.techMatrixDisabled
  const autoQueueUnlocked =
    state.automation.autoResearchQueue &&
    state.arUpgrades.auto_research_queue > 0 &&
    !state.activeChallengeRestrictions?.prestigeUpgradesDisabled

  let remainingElapsed = cappedElapsed
  let activeAnomalyType = state.activeAnomalyType
  let anomalyTimeRemaining = activeAnomalyType
    ? Math.max(0, state.anomalyTimeRemaining)
    : 0
  let anomalySpawnRawDuration = state.anomalySpawnRawDuration
  let timeToNextAnomalyCheck = state.timeToNextAnomalyCheck

  const currentCompleted = [...state.completedResearchNodes]
  const currentQueue = [...state.researchQueue]
  const slots = state.activeResearchSlots.map((s) => ({ ...s }))
  const slotCount = getActiveSlotCount(state)
  const completedNames: string[] = []
  let newlyCompletedCount = 0

  let currentRP = state.researchPoints
  let simLifetime = state.lifetimePoints
  let totalNetRP = 0n
  let synthDustExact = 0
  let synthOpExact = 0
  let anomaliesResolvedCount = 0
  let megaprojectRPEarned = 0n
  let playerSiphonedRP = 0n
  let megaprojectCompletedId: import('@/types/game').MegaprojectId | null = null
  let activeMegaprojectId = state.activeMegaprojectId
  let megaprojectRPAbsorbed = state.megaprojectRPAbsorbed
  let dysonSwarmLevel = state.dysonSwarmLevel ?? 0
  const completedMegaprojects = [...state.completedMegaprojects]

  const simState: GameState = {
    ...state,
    lifetimePoints: simLifetime,
    completedResearchNodes: currentCompleted,
    activeResearchSlots: slots,
    researchQueue: currentQueue,
    activeAnomalyType,
    anomalyTimeRemaining,
    activeMegaprojectId,
    megaprojectRPAbsorbed,
    completedMegaprojects,
    dysonSwarmLevel
  }

  const anomaliesEnabled =
    state.unlocks.anomalies &&
    !state.activeChallengeRestrictions?.anomaliesDisabled

  for (let step = 0; step < 4096 && remainingElapsed > 1e-6; step++) {
    const isFinalStep = step === 4095
    if (
      !activeAnomalyType &&
      anomaliesEnabled &&
      !isFinalStep &&
      timeToNextAnomalyCheck <= 0
    ) {
      const def = selectNextAnomaly(simState)
      activeAnomalyType = def.type
      anomalyTimeRemaining = getEffectiveDuration(def, simState)
      anomalySpawnRawDuration = getRawAnomalyDuration(def, simState)
      timeToNextAnomalyCheck = getNextSpawnInterval(simState)
    }
    // Coalesced tail runs at baseline so a frozen anomaly cannot boost hours of RP
    if (isFinalStep && activeAnomalyType) {
      activeAnomalyType = null
      anomalyTimeRemaining = 0
      anomalySpawnRawDuration = 0
      anomaliesResolvedCount++
    }

    const buffScale = getAnomalyBuffScale({
      ...simState,
      activeAnomalyType,
      anomalyTimeRemaining,
      anomalySpawnRawDuration
    })
    const anomalyResearchSpeed =
      activeAnomalyType === 'temporal_distortion' ||
      activeAnomalyType === 'fused_chronal_breach'
        ? 5 * buffScale
        : activeAnomalyType === 'operation_chrono_freeze'
          ? 3 * buffScale
          : 1

    const r4Boost =
      !techDisabled && currentCompleted.includes('R4') && activeAnomalyType
        ? 2
        : 1
    const researchSpeedMult = researchTimersFrozen
      ? activeAnomalyType
        ? 5 * anomalyResearchSpeed * r4Boost
        : 0
      : anomalyResearchSpeed * r4Boost

    let dt = remainingElapsed

    if (step < 16) {
      dt = Math.min(dt, Math.max(600, remainingElapsed / (16 - step)))
    }

    if (step < 4095) {
      if (activeAnomalyType && anomalyTimeRemaining > 0) {
        dt = Math.min(dt, anomalyTimeRemaining)
      } else if (anomaliesEnabled && timeToNextAnomalyCheck > 0) {
        dt = Math.min(dt, timeToNextAnomalyCheck)
      }

      if (researchSpeedMult > 0) {
        for (let i = 0; i < Math.min(slotCount, slots.length); i++) {
          const s = slots[i]
          if (s.nodeId && s.timerRemaining > 0) {
            dt = Math.min(dt, s.timerRemaining / researchSpeedMult)
          }
        }
      }
    }

    simState.researchPoints = currentRP
    simState.lifetimePoints = simLifetime
    simState.activeAnomalyType = activeAnomalyType
    simState.anomalyTimeRemaining = anomalyTimeRemaining
    simState.anomalySpawnRawDuration = anomalySpawnRawDuration
    simState.activeMegaprojectId = activeMegaprojectId
    simState.megaprojectRPAbsorbed = megaprojectRPAbsorbed
    simState.dysonSwarmLevel = dysonSwarmLevel

    const segPPS = recalculatePPS(simState)
    const segRates = getSynthesizerRates(simState)
    synthDustExact += segRates.dustPerSec * dt * efficiency
    synthOpExact += segRates.opPerSec * dt * efficiency

    const rpDt = Math.min(dt, rpTimeBudget)
    rpTimeBudget = Math.max(0, rpTimeBudget - rpDt)
    const dtMs = BigInt(Math.round(rpDt * 1000))
    const segEarned = (segPPS * dtMs * effBn) / 1_000_000n

    let segSiphoned = 0n
    if (activeMegaprojectId && state.megaprojectAllocationPercent > 0) {
      const allocPercent = BigInt(state.megaprojectAllocationPercent)
      const rawAllocated = (segEarned * allocPercent) / 100n
      const absorptionMult =
        getMegaprojectPhase('chronos_array', simState) >= 3 ? 120n : 100n
      const effectiveAllocated = (rawAllocated * absorptionMult) / 100n
      const cost = getEffectiveConstructionCost(activeMegaprojectId, simState)
      const needed =
        cost > megaprojectRPAbsorbed ? cost - megaprojectRPAbsorbed : 0n

      if (effectiveAllocated >= needed) {
        megaprojectRPEarned += needed
        segSiphoned = (needed * 100n) / absorptionMult
        if (activeMegaprojectId === 'dyson_swarm') {
          dysonSwarmLevel += 1
          megaprojectRPAbsorbed = 0n
        } else {
          megaprojectCompletedId = activeMegaprojectId
          completedMegaprojects.push(activeMegaprojectId)
          activeMegaprojectId = null
          megaprojectRPAbsorbed = 0n
        }
      } else {
        megaprojectRPEarned += effectiveAllocated
        segSiphoned = rawAllocated
        megaprojectRPAbsorbed += effectiveAllocated
      }
    }

    const segNet = segEarned - segSiphoned
    currentRP =
      currentRP + segNet > MAX_RP_HARD_CAP
        ? MAX_RP_HARD_CAP
        : currentRP + segNet
    simLifetime =
      simLifetime + segEarned > MAX_RP_HARD_CAP
        ? MAX_RP_HARD_CAP
        : simLifetime + segEarned
    totalNetRP =
      totalNetRP + segNet > MAX_RP_HARD_CAP
        ? MAX_RP_HARD_CAP
        : totalNetRP + segNet
    playerSiphonedRP += segSiphoned

    // Advance anomaly timer and track resolved count
    if (activeAnomalyType) {
      anomalyTimeRemaining = Math.max(0, anomalyTimeRemaining - dt)
      if (anomalyTimeRemaining <= 1e-6) {
        activeAnomalyType = null
        anomalyTimeRemaining = 0
        anomalySpawnRawDuration = 0
        anomaliesResolvedCount++
      }
    } else if (state.unlocks.anomalies) {
      timeToNextAnomalyCheck = Math.max(0, timeToNextAnomalyCheck - dt)
    }

    // Advance research slots and resolve any completions
    if (researchSpeedMult > 0) {
      const progressed = dt * researchSpeedMult
      for (let i = 0; i < Math.min(slotCount, slots.length); i++) {
        const s = slots[i]
        if (!s.nodeId) continue
        s.timerRemaining = Math.max(0, s.timerRemaining - progressed)
        if (s.timerRemaining <= 1e-6) {
          const finishedId = s.nodeId
          if (finishedId !== '__CALIBRATION__') {
            if (!currentCompleted.includes(finishedId)) {
              currentCompleted.push(finishedId)
              newlyCompletedCount++
              const def = RESEARCH_NODE_MAP[finishedId]
              if (def) completedNames.push(def.label)
            }
          }
          slots[i] = { nodeId: null, timerRemaining: 0 }

          if (autoQueueUnlocked && currentQueue.length > 0) {
            const otherBranches = new Set(
              slots
                .filter((sl, idx) => idx !== i && sl.nodeId !== null)
                .map((sl) => RESEARCH_NODE_MAP[sl.nodeId!]?.branch)
                .filter(Boolean)
            )
            simState.researchPoints = currentRP
            const qIdx = currentQueue.findIndex((id) => {
              const node = RESEARCH_NODE_MAP[id]
              if (!node || otherBranches.has(node.branch)) return false
              if (!isNodeAvailable(id, simState)) return false
              return currentRP >= getNodeCost(id, simState)
            })
            if (qIdx !== -1) {
              const nextId = currentQueue[qIdx]
              currentRP -= getNodeCost(nextId, simState)
              currentQueue.splice(qIdx, 1)
              slots[i] = {
                nodeId: nextId,
                timerRemaining: getEffectiveStudyTime(nextId, simState)
              }
            }
          }
        }
      }
    }

    remainingElapsed -= dt
  }

  const probeSim = simulateOfflineProbes(
    { ...state, lifetimePoints: simLifetime },
    cappedElapsed
  )

  const dustEarned = Math.floor(synthDustExact) + probeSim.dustEarned
  const operationPointsEarned = Math.floor(synthOpExact) + probeSim.opEarned

  if (ec3CollapseTriggered && state.activeChallengeId && forcedInterval) {
    const ec3Tier =
      (state.challengeRecords[state.activeChallengeId]?.completedTiers ?? 0) + 1
    const ec3Target = getEffectiveTarget(
      state.activeChallengeId,
      ec3Tier,
      isChallengeAccelerantActive(state.activeChallengeId, state)
    )
    if (state.lifetimePoints + totalNetRP + playerSiphonedRP >= ec3Target) {
      ec3CollapseTriggered = false
    } else if (ec3CollapseCount >= 2) {
      const postResetPatch = buildTier1ResetState(
        { ...state, completedResearchNodes: currentCompleted },
        0,
        true,
        true
      )
      const postCollapseState: GameState = {
        ...state,
        ...postResetPatch
      }
      const postCollapsePPS = recalculatePPS(postCollapseState)
      const fullWindowEarned =
        (postCollapsePPS * BigInt(Math.round(forcedInterval * 1000)) * effBn) /
        1_000_000n
      if (
        (postCollapseState.lifetimePoints ?? 0n) + fullWindowEarned >=
        ec3Target
      ) {
        ec3CollapseTriggered = false
        totalNetRP =
          totalNetRP + fullWindowEarned > MAX_RP_HARD_CAP
            ? MAX_RP_HARD_CAP
            : totalNetRP + fullWindowEarned
      }
    }
  }

  return {
    elapsedSeconds: cappedElapsed,
    actualElapsedSeconds: actualElapsed,
    rpEarned: totalNetRP,
    efficiencyApplied: efficiency,
    maxOfflineWindowSeconds: maxOffline,
    megaprojectRPEarned,
    megaprojectRPSiphoned: playerSiphonedRP,
    megaprojectCompletedId,
    researchCompletedNames: completedNames,
    probesCompletedCount: probeSim.probesCompletedCount,
    dustEarned,
    operationPointsEarned,
    cachedResearchResult: {
      completedResearchNodes: currentCompleted,
      activeResearchSlots: slots,
      researchQueue: currentQueue,
      researchPointsAfterSpend: currentRP,
      newlyCompletedCount
    },
    cachedProbeResult: {
      probes: probeSim.probes,
      dustEarned: probeSim.dustEarned,
      newRelics: probeSim.newRelics,
      relic9PityGain: probeSim.relic9PityGain
    },
    cachedDysonSwarmLevel: dysonSwarmLevel,
    cachedMegaprojectRPAbsorbed: megaprojectRPAbsorbed,
    cachedFinalAnomalyState: {
      activeAnomalyType,
      anomalyTimeRemaining,
      anomalySpawnRawDuration,
      timeToNextAnomalyCheck
    },
    ec3CollapseTriggered,
    ec3CollapseCount,
    ec3FinalPrestigeTimeMs,
    ec3PostCollapseRunSeconds,
    anomaliesResolvedCount
  }
}

// Applies cached offline progress payload without re-running simulations
export function applyOfflineProgress(
  state: GameState,
  payload: OfflineProgressPayload
): Partial<GameState> {
  const elapsed = payload.elapsedSeconds

  const researchSim = payload.cachedResearchResult ?? {
    completedResearchNodes: state.completedResearchNodes,
    activeResearchSlots: state.activeResearchSlots,
    researchQueue: state.researchQueue,
    researchPointsAfterSpend: state.researchPoints + payload.rpEarned,
    newlyCompletedCount: 0
  }

  const probeResult = payload.cachedProbeResult ?? {
    probes: state.probes,
    dustEarned: 0,
    newRelics: [],
    relic9PityGain: 0
  }

  let activeMegaprojectId = state.activeMegaprojectId
  let megaprojectAllocationPercent = state.megaprojectAllocationPercent
  let megaprojectRPAbsorbed =
    payload.cachedMegaprojectRPAbsorbed ?? state.megaprojectRPAbsorbed
  let completedMegaprojects = state.completedMegaprojects
  const dysonSwarmLevel =
    payload.cachedDysonSwarmLevel ?? state.dysonSwarmLevel ?? 0

  if (
    payload.megaprojectCompletedId &&
    payload.megaprojectCompletedId !== 'dyson_swarm'
  ) {
    if (!completedMegaprojects.includes(payload.megaprojectCompletedId)) {
      completedMegaprojects = [
        ...completedMegaprojects,
        payload.megaprojectCompletedId
      ]
    }
    activeMegaprojectId = null
    megaprojectAllocationPercent = 0
    megaprojectRPAbsorbed = 0n
  } else if (
    payload.cachedMegaprojectRPAbsorbed === undefined &&
    payload.megaprojectRPEarned &&
    payload.megaprojectRPEarned > 0n
  ) {
    megaprojectRPAbsorbed += payload.megaprojectRPEarned
  }

  const finalAnomaly = payload.cachedFinalAnomalyState ?? {
    activeAnomalyType: state.activeAnomalyType,
    anomalyTimeRemaining: state.anomalyTimeRemaining,
    anomalySpawnRawDuration: state.anomalySpawnRawDuration,
    timeToNextAnomalyCheck: state.timeToNextAnomalyCheck
  }

  const nextRelic4Pity =
    (state.stats.relic4PityCount ?? 0) + researchSim.newlyCompletedCount
  const nextUnlockedRelics = [...state.unlockedRelics]
  const nextRelicLevels = { ...state.relicLevels }

  for (const rId of probeResult.newRelics) {
    if (!nextUnlockedRelics.includes(rId)) {
      nextUnlockedRelics.push(rId)
      nextRelicLevels[rId] = Math.max(1, nextRelicLevels[rId] ?? 1)
    }
  }
  if (nextRelic4Pity >= 25 && !nextUnlockedRelics.includes(4)) {
    nextUnlockedRelics.push(4)
    nextRelicLevels[4] = Math.max(1, nextRelicLevels[4] ?? 1)
  }

  const nextAnomaliesResolved =
    state.stats.totalAnomaliesResolved + (payload.anomaliesResolvedCount ?? 0)
  if (nextAnomaliesResolved >= 10 && !nextUnlockedRelics.includes(6)) {
    nextUnlockedRelics.push(6)
    nextRelicLevels[6] = Math.max(1, nextRelicLevels[6] ?? 1)
  }

  // Parity with online research completion relic drops (Relics 2, 14, 16)
  const standardCompletedCount = researchSim.completedResearchNodes.filter(
    (id) => !id.includes('_INF')
  ).length
  if (standardCompletedCount >= 10 && !nextUnlockedRelics.includes(2)) {
    nextUnlockedRelics.push(2)
    nextRelicLevels[2] = Math.max(1, nextRelicLevels[2] ?? 1)
  }
  if (
    researchSim.completedResearchNodes.includes('O8') &&
    !nextUnlockedRelics.includes(16)
  ) {
    nextUnlockedRelics.push(16)
    nextRelicLevels[16] = Math.max(1, nextRelicLevels[16] ?? 1)
  }
  for (const id of researchSim.completedResearchNodes) {
    if (
      !state.completedResearchNodes.includes(id) &&
      (RESEARCH_NODE_MAP[id]?.studyTimeSeconds ?? 0) >= 86400 &&
      !nextUnlockedRelics.includes(14)
    ) {
      nextUnlockedRelics.push(14)
      nextRelicLevels[14] = Math.max(1, nextRelicLevels[14] ?? 1)
    }
  }

  const totalPointsGained =
    payload.rpEarned +
    (payload.megaprojectRPSiphoned ?? payload.megaprojectRPEarned ?? 0n)

  if (payload.ec3CollapseTriggered && state.activeChallengeId) {
    const preCollapseLifetime =
      state.lifetimePoints + totalPointsGained > MAX_RP_HARD_CAP
        ? MAX_RP_HARD_CAP
        : state.lifetimePoints + totalPointsGained
    const nextPeakLifetime =
      preCollapseLifetime > (state.stats.peakLifetimePoints ?? 0n)
        ? preCollapseLifetime
        : (state.stats.peakLifetimePoints ?? 0n)
    const preCollapseState: GameState = {
      ...state,
      lifetimePoints: preCollapseLifetime
    }
    const resetPatch = buildTier1ResetState(preCollapseState, 0, true, true)
    return {
      ...resetPatch,
      artifactDust: state.artifactDust + (payload.dustEarned ?? 0),
      currentOperationPoints:
        state.currentOperationPoints + (payload.operationPointsEarned ?? 0),
      probes: probeResult.probes,
      unlockedRelics: nextUnlockedRelics,
      relicLevels: nextRelicLevels,
      activeChallengeId: state.activeChallengeId,
      challengeActiveSeconds:
        (state.challengeActiveSeconds ?? 0) +
        Math.floor(payload.elapsedSeconds),
      activeChallengeRestrictions: state.activeChallengeRestrictions,
      stats: {
        ...state.stats,
        peakLifetimePoints: nextPeakLifetime,
        allTimePoints: (() => {
          const raw =
            (state.stats.allTimePoints ?? state.lifetimePoints) +
            totalPointsGained
          return raw > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : raw
        })(),
        allTimeDust:
          (state.stats.allTimeDust ?? state.artifactDust) +
          (payload.dustEarned ?? 0),
        totalAnomaliesResolved: nextAnomaliesResolved,
        o10EverCompleted:
          Boolean(state.stats.o10EverCompleted) ||
          researchSim.completedResearchNodes.includes('O10'),
        relic4PityCount: nextRelic4Pity,
        relic9PityCount:
          (state.stats.relic9PityCount ?? 0) + probeResult.relic9PityGain,
        totalResearchNodesCompleted:
          state.stats.totalResearchNodesCompleted +
          researchSim.newlyCompletedCount,
        lastPrestigeTime: payload.ec3FinalPrestigeTimeMs ?? Date.now(),
        currentRunSeconds: payload.ec3PostCollapseRunSeconds ?? 0
      }
    }
  }

  const clampedRP =
    researchSim.researchPointsAfterSpend > MAX_RP_HARD_CAP
      ? MAX_RP_HARD_CAP
      : researchSim.researchPointsAfterSpend
  const clampedLifetime =
    state.lifetimePoints + totalPointsGained > MAX_RP_HARD_CAP
      ? MAX_RP_HARD_CAP
      : state.lifetimePoints + totalPointsGained
  const nextPeakLifetime =
    clampedLifetime > (state.stats.peakLifetimePoints ?? 0n)
      ? clampedLifetime
      : (state.stats.peakLifetimePoints ?? 0n)
  const rawAllTime =
    (state.stats.allTimePoints ?? state.lifetimePoints) + totalPointsGained
  const clampedAllTime =
    rawAllTime > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : rawAllTime

  return {
    researchPoints: clampedRP,
    lifetimePoints: clampedLifetime,
    artifactDust: state.artifactDust + (payload.dustEarned ?? 0),
    currentOperationPoints:
      state.currentOperationPoints + (payload.operationPointsEarned ?? 0),
    completedResearchNodes: researchSim.completedResearchNodes,
    activeResearchSlots: researchSim.activeResearchSlots,
    researchQueue: researchSim.researchQueue,
    probes: probeResult.probes,
    unlockedRelics: nextUnlockedRelics,
    relicLevels: nextRelicLevels,
    activeMegaprojectId,
    megaprojectAllocationPercent,
    megaprojectRPAbsorbed,
    completedMegaprojects,
    dysonSwarmLevel,
    activeAnomalyType: finalAnomaly.activeAnomalyType,
    anomalyTimeRemaining: finalAnomaly.anomalyTimeRemaining,
    anomalySpawnRawDuration: finalAnomaly.anomalySpawnRawDuration,
    timeToNextAnomalyCheck: finalAnomaly.timeToNextAnomalyCheck,
    ...(state.activeChallengeId
      ? {
          challengeActiveSeconds:
            (state.challengeActiveSeconds ?? 0) +
            Math.floor(payload.elapsedSeconds)
        }
      : {}),
    stats: {
      ...state.stats,
      peakLifetimePoints: nextPeakLifetime,
      allTimePoints: clampedAllTime,
      allTimeDust:
        (state.stats.allTimeDust ?? state.artifactDust) +
        (payload.dustEarned ?? 0),
      totalAnomaliesResolved: nextAnomaliesResolved,
      o10EverCompleted:
        Boolean(state.stats.o10EverCompleted) ||
        researchSim.completedResearchNodes.includes('O10'),
      relic4PityCount: nextRelic4Pity,
      relic9PityCount:
        (state.stats.relic9PityCount ?? 0) + probeResult.relic9PityGain,
      totalResearchNodesCompleted: researchSim.completedResearchNodes.length,
      currentRunSeconds:
        (state.stats.currentRunSeconds ?? 0) +
        Math.floor(payload.elapsedSeconds)
    }
  }
}