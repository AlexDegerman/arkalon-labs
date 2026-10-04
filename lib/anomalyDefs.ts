import type { AnomalyType } from '@/types/game'
import type { GameState } from '@/types/game'
import type { AnomalyResultPayload } from '@/types/anomalies'
import { ANOMALY_SPAWN_MIN_SECONDS, ANOMALY_SPAWN_MAX_SECONDS } from '@/constants/game'

export interface AnomalyDefinition {
  type: AnomalyType
  label: string
  description: string
  probability: number // 0-1 weight for weighted random selection
  baseDurationSeconds: number
  interactionType: 'click_node' | 'slider' | 'sector_order' | 'symbol_sequence'
  // Reward description shown in UI
  rewardDescription: string
}

export const ANOMALY_DEFINITIONS: AnomalyDefinition[] = [
  {
    type: 'quantum_surge',
    label: 'Quantum Surge',
    description: 'Click the shifting core node within 3 seconds of relocation.',
    probability: 0.35,
    baseDurationSeconds: 45,
    interactionType: 'click_node',
    rewardDescription: '2x-5x passive RP multiplier based on captures'
  },
  {
    type: 'temporal_distortion',
    label: 'Temporal Distortion',
    description: 'Keep the slider aligned in the shifting safe zone.',
    probability: 0.25,
    baseDurationSeconds: 30,
    interactionType: 'slider',
    rewardDescription: '5x research speed while aligned'
  },
  {
    type: 'containment_breach',
    label: 'Containment Breach',
    description: 'Select the 3-5 sectors in descending pressure order.',
    probability: 0.2,
    baseDurationSeconds: 20,
    interactionType: 'sector_order',
    rewardDescription: '30 minutes of passive RP as instant payout'
  },
  {
    type: 'arkalon_resonance',
    label: 'Arkalon Resonance',
    description: 'Match the symbol sequence shown.',
    probability: 0.2,
    baseDurationSeconds: 60,
    interactionType: 'symbol_sequence',
    rewardDescription: '25% tech cost reduction + 0-time research project'
  }
]

// Operation anomaly definitions (20% replacement of standard spawns)
export const OPERATION_ANOMALY_DEFINITIONS: AnomalyDefinition[] = [
  {
    type: 'operation_chrono_freeze',
    label: 'Chrono-Freeze Flux',
    description: 'Match frequency spikes with the slider.',
    probability: 0.25,
    baseDurationSeconds: 60,
    interactionType: 'slider',
    rewardDescription: 'Freeze research timer 5 min + 3x generation'
  },
  {
    type: 'operation_solar_flare',
    label: 'Solar Flare Overload',
    description: 'Click floating energy flares as they appear.',
    probability: 0.25,
    baseDurationSeconds: 40,
    interactionType: 'click_node',
    rewardDescription: '1% of next generator unlock cost per flare'
  },
  {
    type: 'operation_gravity_sink',
    label: 'Gravity Sink Collapse',
    description: 'Enter the 3 terminal sequences correctly.',
    probability: 0.25,
    baseDurationSeconds: 30,
    interactionType: 'sector_order',
    rewardDescription: '50% generator cost reduction for 2 minutes'
  },
  {
    type: 'operation_matrix_inversion',
    label: 'Matrix Inversion',
    description: 'Match logic symbol pairs in the grid.',
    probability: 0.25,
    baseDurationSeconds: 50,
    interactionType: 'symbol_sequence',
    rewardDescription: '5x AR bonus strength temporarily'
  }
]

// Weighted random selection from a list of definitions
function weightedRandom(defs: AnomalyDefinition[]): AnomalyDefinition {
  const totalWeight = defs.reduce((sum, d) => sum + d.probability, 0)
  let r = Math.random() * totalWeight
  for (const def of defs) {
    r -= def.probability
    if (r <= 0) return def
  }
  return defs[defs.length - 1]
}

// Selects the next anomaly to spawn
// 20% chance of operation anomaly when operations are unlocked
export function selectNextAnomaly(state: GameState): AnomalyDefinition {
  const opsUnlocked = state.unlocks.anomalousOperations

  if (opsUnlocked && Math.random() < 0.2) {
    return weightedRandom(OPERATION_ANOMALY_DEFINITIONS)
  }

  return weightedRandom(ANOMALY_DEFINITIONS)
}

// Returns the effective anomaly duration in seconds,
// applying E7, Anomaly Extender AR upgrade, Fractured Chrono-Hourglass relic,
// and challenge restrictions
export function getEffectiveDuration(
  def: AnomalyDefinition,
  state: GameState
): number {
  let duration = def.baseDurationSeconds

  // E7: anomalies last 2x longer
  if (state.completedResearchNodes.includes('E7')) {
    duration *= 2
  }

  // Anomaly Extender AR upgrade: +5 seconds per level
  const extenderLevel = state.arUpgrades.anomaly_extender
  if (extenderLevel > 0) {
    duration += 5 * extenderLevel
  }

  // Fractured Chrono-Hourglass relic (ID 2): +1.5s per level
  if (
    state.unlockedRelics.includes(2) &&
    state.relicSlots.some((s) => s.relicId === 2)
  ) {
    const relicLevel = state.relicLevels[2] ?? 0
    duration += 1.5 * relicLevel
  }

  // Anomalous Lens operation artifact: +15% frequency (shorter intervals)
  // affects spawn rate not duration

  // AC7 challenge: fixed 10-second duration
  const forcedDuration =
    state.activeChallengeRestrictions?.anomalyDurationOverrideSeconds
  if (forcedDuration !== null && forcedDuration !== undefined) {
    return forcedDuration
  }
  return Math.max(5, duration)
}

// Returns the next spawn check interval in seconds
// Range: 8-15 minutes, adjusted by Neural Pipeline and Anomalous Lens
export function getNextSpawnInterval(state: GameState): number {
  let minSeconds = ANOMALY_SPAWN_MIN_SECONDS
  let maxSeconds = ANOMALY_SPAWN_MAX_SECONDS

  // Neural Pipeline AR upgrade: +10% spawn frequency per level
  const pipelineLevel = state.arUpgrades.neural_pipeline
  if (pipelineLevel > 0) {
    const reductionFactor = Math.pow(0.9, pipelineLevel)
    minSeconds = Math.round(minSeconds * reductionFactor)
    maxSeconds = Math.round(maxSeconds * reductionFactor)
  }

  // Anomalous Lens operation artifact: +15% frequency
  if (state.operationArtifactsUnlocked.includes('anomalous_lens')) {
    minSeconds = Math.round(minSeconds * 0.85)
    maxSeconds = Math.round(maxSeconds * 0.85)
  }

  // Quantum Die relic (ID 6): -3s min interval per level (floor 60s)
  if (
    state.unlockedRelics.includes(6) &&
    state.relicSlots.some((s) => s.relicId === 6)
  ) {
    const relicLevel = state.relicLevels[6] ?? 0
    minSeconds = Math.max(60, minSeconds - 3 * relicLevel)
  }

  // AC7 challenge: fixed 60-second spawn interval
  const forcedInterval =
    state.activeChallengeRestrictions?.anomalySpawnIntervalSeconds
  if (forcedInterval !== null && forcedInterval !== undefined) {
    return forcedInterval
  }

  // SC5 challenge: no anomalies
  if (state.activeChallengeRestrictions?.anomaliesDisabled) {
    return maxSeconds * 100 // Effectively never spawn
  }

  return minSeconds + Math.random() * (maxSeconds - minSeconds)
}

// Builds the reward payload for a resolved anomaly
// interactionScore: 0.0-1.0 representing quality of player interaction
export function buildAnomalyReward(
  def: AnomalyDefinition,
  interactionScore: number,
  state: GameState
): AnomalyResultPayload {
  const e7Active = state.completedResearchNodes.includes('E7')
  const r4Active = state.completedResearchNodes.includes('R4')
  const pps = state.cachedPointsPerSecond

  let result: AnomalyResultPayload = {
    anomalyType: def.type,
    rpReward: 0n,
    ppsMultiplier: 0,
    ppsMultiplierDuration: 0,
    researchSpeedMultiplier: 1,
    researchSpeedDuration: 0,
    instantRPPayout: 0n,
    grantFreeResearch: false,
    techCostReductionPercent: 0,
    dustDropped: 0,
    relicDropped: 0,
    researchTimeReduction: r4Active ? 600 : 0, // R4: -10 minutes
    wasMaxReward: interactionScore >= 1.0
  }

  switch (def.type) {
    case 'quantum_surge': {
      // 2x-5x PPS multiplier based on interaction score
      const captures = Math.round(1 + interactionScore * 4)
      const multiplier = Math.min(5, 2 + (captures - 1))
      const duration = e7Active ? 60 : 30
      result.ppsMultiplier = multiplier
      result.ppsMultiplierDuration = duration
      result.dustDropped = Math.floor(interactionScore * 3)
      break
    }

    case 'temporal_distortion': {
      // 5x research speed while aligned - reward is duration of alignment
      const alignedDuration = Math.round(
        interactionScore * (e7Active ? 60 : 30)
      )
      result.researchSpeedMultiplier = 5
      result.researchSpeedDuration = alignedDuration
      result.dustDropped = Math.floor(interactionScore * 2)
      break
    }

    case 'containment_breach': {
      // 30 minutes of passive RP as instant payout
      const payoutMinutes = e7Active ? 60 : 30
      result.instantRPPayout =
        (pps *
          BigInt(payoutMinutes * 60) *
          BigInt(Math.round(interactionScore * 100))) /
        100n
      result.dustDropped = Math.floor(interactionScore * 4)
      break
    }

    case 'arkalon_resonance': {
      result.techCostReductionPercent = 25
      result.grantFreeResearch = interactionScore >= 0.8
      result.dustDropped = Math.floor(interactionScore * 5)
      break
    }

    // Operation anomalies - rewards applied in Commit 15.2
    case 'operation_chrono_freeze':
    case 'operation_solar_flare':
    case 'operation_gravity_sink':
    case 'operation_matrix_inversion':
      result.dustDropped = Math.floor(interactionScore * 3)
      break
  }

  // E7: double base payout
  if (e7Active) {
    result.instantRPPayout *= 2n
    result.rpReward *= 2n
  }

  // Relic drop check (5-15% depending on zone)
  result.relicDropped = rollRelicDrop(def.type, interactionScore, state)

  return result
}

// Rolls for a relic drop based on anomaly type and interaction quality
function rollRelicDrop(
  type: AnomalyType,
  score: number,
  state: GameState
): number {
  const relicDropChances: Partial<Record<AnomalyType, number>> = {
    temporal_distortion: 0.05, // Fractured Chrono-Hourglass
    quantum_surge: 0.05, // Quantum Die
    containment_breach: 0.05, // Singularity Lens
    arkalon_resonance: 0.05 // Planck Shell
  }

  const relicRewards: Partial<Record<AnomalyType, number>> = {
    temporal_distortion: 2,
    quantum_surge: 6,
    containment_breach: 10,
    arkalon_resonance: 15
  }

  const dropChance = relicDropChances[type] ?? 0
  const relicId = relicRewards[type] ?? 0

  if (!relicId) return 0
  if (state.unlockedRelics.includes(relicId)) return 0
  if (Math.random() < dropChance * score) return relicId
  return 0
}
