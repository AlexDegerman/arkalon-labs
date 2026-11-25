import type { AnomalyType, GameState } from '@/types/game'
import {
  ANOMALY_SPAWN_MIN_SECONDS,
  ANOMALY_SPAWN_MAX_SECONDS
} from '@/constants/game'
import { getCurrentCycle } from './operationDefs'
import { getMegaprojectPhase } from './megaprojectDefs'
import { getRelicEffectiveMultiplier } from './relicEffects'

export interface AnomalyDefinition {
  type: AnomalyType
  label: string
  description: string
  probability: number // 0-1 weight for weighted random selection
  baseDurationSeconds: number
  // Reward description shown in UI
  rewardDescription: string
}

export const ANOMALY_DEFINITIONS: AnomalyDefinition[] = [
  {
    type: 'quantum_surge',
    label: 'Quantum Surge',
    description:
      'Spatial energy surge overclocking all facility research engines.',
    probability: 0.35,
    baseDurationSeconds: 60,
    rewardDescription: '3x Global RP Production'
  },
  {
    type: 'temporal_distortion',
    label: 'Temporal Distortion',
    description:
      'Localized chronal distortion accelerating study speeds fivefold.',
    probability: 0.25,
    baseDurationSeconds: 45,
    rewardDescription: '5x Research Speed'
  },
  {
    type: 'containment_breach',
    label: 'Containment Breach',
    description:
      'Sub-atomic vacuum collapse venting contained energy into facility output.',
    probability: 0.2,
    baseDurationSeconds: 45,
    rewardDescription: '2.5x Global RP Production'
  },
  {
    type: 'arkalon_resonance',
    label: 'Arkalon Resonance',
    description:
      'Harmonic convergence synchronizing the Arkalon Core and accelerating yield.',
    probability: 0.2,
    baseDurationSeconds: 60,
    rewardDescription: '2x Global RP Production'
  }
]

// Operation anomaly definitions (20% replacement of standard spawns)
export const OPERATION_ANOMALY_DEFINITIONS: AnomalyDefinition[] = [
  {
    type: 'operation_chrono_freeze',
    label: 'Chrono-Freeze Flux',
    description:
      'Temporal crystal flux boosting generation and research throughput.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '2x RP Production & 3x Research Speed'
  },
  {
    type: 'operation_solar_flare',
    label: 'Solar Flare Overload',
    description:
      'Stellar flare radiation directly energizing power generators.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '3x Output to Energy Generators'
  },
  {
    type: 'operation_gravity_sink',
    label: 'Gravity Sink Collapse',
    description:
      'Gravitational compression channeling collapsed mass into facility output.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '2.5x Global RP Production'
  },
  {
    type: 'operation_matrix_inversion',
    label: 'Matrix Inversion',
    description:
      'Matrix polarity shift multiplying Arkalon Resonance efficiency.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '2x Arkalon Resonance Output'
  }
]

export const FUSED_ANOMALY_DEFINITIONS: AnomalyDefinition[] = [
  {
    type: 'fused_singularity_surge',
    label: 'Singularity Surge [Fused]',
    description:
      'Collapsing spatial horizon combining Quantum Surge and Containment Breach.',
    probability: 0.5,
    baseDurationSeconds: 60,
    rewardDescription: '4x Global RP Production'
  },
  {
    type: 'fused_chronal_breach',
    label: 'Chronal Resonance [Fused]',
    description:
      'Harmonic space-time disruption fusing Temporal Distortion and Arkalon Resonance.',
    probability: 0.5,
    baseDurationSeconds: 60,
    rewardDescription: '5x Research Speed & 2x RP'
  }
]

// Returns the display label for an anomaly type
export function getAnomalyLabel(type: AnomalyType): string {
  const def = [
    ...ANOMALY_DEFINITIONS,
    ...OPERATION_ANOMALY_DEFINITIONS,
    ...FUSED_ANOMALY_DEFINITIONS
  ].find((d) => d.type === type)
  return def?.label ?? type
}

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
// 20% chance of active cycle operation anomaly when operations are unlocked
// 20% chance of fused anomaly in Era 5+ (>= 10^60 lifetime RP)
export function selectNextAnomaly(state: GameState): AnomalyDefinition {
  const opsUnlocked = state.unlocks.anomalousOperations

  if (opsUnlocked && Math.random() < 0.2) {
    const effectiveCycleNumber =
      state.manualOperationCycle ?? state.currentOperationCycle
    const currentCycle = getCurrentCycle(effectiveCycleNumber)
    const cycleDef = OPERATION_ANOMALY_DEFINITIONS.find(
      (d) => d.type === currentCycle.anomalyType
    )
    if (cycleDef) return cycleDef
  }

  if (state.lifetimePoints >= 10n ** 60n && Math.random() < 0.2) {
    return weightedRandom(FUSED_ANOMALY_DEFINITIONS)
  }

  const picked = weightedRandom(ANOMALY_DEFINITIONS)

  // Temporal Distortion is a no-op without research; reroll to Quantum Surge
  if (
    picked.type === 'temporal_distortion' &&
    (state.activeChallengeRestrictions?.techMatrixDisabled ||
      state.completedResearchNodes.filter((id) => !id.includes('_INF'))
        .length >= 40)
  ) {
    return ANOMALY_DEFINITIONS.find((d) => d.type === 'quantum_surge') ?? picked
  }
  return picked

}

// Uncapped anomaly duration from all permanent sources
export function getRawAnomalyDuration(
  def: AnomalyDefinition,
  state: GameState
): number {
  let duration = def.baseDurationSeconds

  // E7: anomalies last 1.5x longer
  if (state.completedResearchNodes.includes('E7')) {
    duration *= 1.5
  }

  // Anomaly Extender AR upgrade: +3 seconds per level (amplified by AC2)
  const extenderLevel = state.activeChallengeRestrictions
    ?.prestigeUpgradesDisabled
    ? 0
    : state.arUpgrades.anomaly_extender
  if (extenderLevel > 0) {
    const ac2Tiers = state.challengeRecords['AC2']?.completedTiers ?? 0
    const arEffectivenessMult = 1 + 0.2 * ac2Tiers
    duration += 3 * extenderLevel * arEffectivenessMult
  }

  // Fractured Chrono-Hourglass relic (ID 2): +0.5s per level, capped at +50s
  if (
    !state.activeChallengeRestrictions?.relicsDisabled &&
    state.unlockedRelics.includes(2) &&
    state.relicSlots.some((s) => s.relicId === 2)
  ) {
    const relicLevel = state.relicLevels[2] ?? 0
    duration += Math.min(
      50,
      0.5 * relicLevel * getRelicEffectiveMultiplier(2, state)
    )
  }

  // Temporal Compression Siphon: +1s per level (capped at 30)
  const temporalLevel = Math.min(30, state.cosmicTemporalLevel ?? 0)
  if (temporalLevel > 0) {
    duration += temporalLevel
  }

  // Arkalon Matrix Mirror Phase 3: +5s anomaly duration
  if (getMegaprojectPhase('arkalon_matrix_mirror', state) >= 3) {
    duration += 5
  }

  // SC5 reward: +3s anomaly duration per tier
  const sc5Tiers = state.challengeRecords['SC5']?.completedTiers ?? 0
  if (sc5Tiers > 0) {
    duration += 3 * sc5Tiers
  }

  // Reality Warden achievement capstone: +10s anomaly duration
  if (state.achievements?.includes('anomaly_50')) {
    duration += 10
  }
  return duration
}

// Returns the effective anomaly duration in seconds,
// applying E7, Anomaly Extender AR upgrade, Fractured Chrono-Hourglass relic,
// SC5 tiers, Matrix Mirror Phase 3, and challenge restrictions
export function getEffectiveDuration(
  def: AnomalyDefinition,
  state: GameState
): number {
  // AC7 challenge: fixed 10-second duration
  const forcedDuration =
    state.activeChallengeRestrictions?.anomalyDurationOverrideSeconds
  if (forcedDuration !== null && forcedDuration !== undefined) {
    return forcedDuration
  }

  // Hard ceiling keeps anomalies a temporary bonus, not a permanent layer
  return Math.max(5, Math.min(180, getRawAnomalyDuration(def, state)))
}

// Returns the next spawn check interval in seconds
// Range: 3-6 minutes, adjusted by Neural Pipeline, Anomalous Lens, and Quantum Die
export function getNextSpawnInterval(state: GameState): number {
  let minSeconds = ANOMALY_SPAWN_MIN_SECONDS
  let maxSeconds = ANOMALY_SPAWN_MAX_SECONDS

  // Neural Pipeline AR upgrade: +5% spawn frequency per level
  const pipelineLevel = state.activeChallengeRestrictions
    ?.prestigeUpgradesDisabled
    ? 0
    : state.arUpgrades.neural_pipeline
  if (pipelineLevel > 0) {
    const reductionFactor = Math.pow(0.95, pipelineLevel)
    minSeconds = Math.round(minSeconds * reductionFactor)
    maxSeconds = Math.round(maxSeconds * reductionFactor)
  }

  // Anomalous Lens operation artifact: +10% frequency
  if (state.operationArtifactsUnlocked.includes('anomalous_lens')) {
    minSeconds = Math.round(minSeconds * 0.9)
    maxSeconds = Math.round(maxSeconds * 0.9)
  }

  // Quantum Die relic (ID 6): -1s spawn interval per level (min floor 120s)
  if (
    !state.activeChallengeRestrictions?.relicsDisabled &&
    state.unlockedRelics.includes(6) &&
    state.relicSlots.some((s) => s.relicId === 6)
  ) {
    const relicLevel = state.relicLevels[6] ?? 0
    minSeconds = Math.max(120, minSeconds - relicLevel)
    maxSeconds = Math.max(minSeconds + 30, maxSeconds - relicLevel)
  }

  // AC7 challenge: fixed 60-second spawn interval
  const forcedInterval =
    state.activeChallengeRestrictions?.anomalySpawnIntervalSeconds
  if (forcedInterval !== null && forcedInterval !== undefined) {
    return forcedInterval
  }

  // SC5 challenge: no anomalies
  if (state.activeChallengeRestrictions?.anomaliesDisabled) {
    return maxSeconds * 100
  }

  return minSeconds + Math.random() * (maxSeconds - minSeconds)
}

// Returns cumulative buff strength multiplier from C6, SC5, and AC7,
// plus duration overflow past the 180s ceiling (+2% buff per excess second)
export function getAnomalyBuffScale(state: GameState): number {
  let scale = 1

  if (
    !state.activeChallengeRestrictions?.techMatrixDisabled &&
    state.completedResearchNodes.includes('C6')
  ) {
    scale += 0.25
  }

  const sc5Tiers = state.challengeRecords['SC5']?.completedTiers ?? 0

  if (sc5Tiers > 0) scale += 0.1 * sc5Tiers

  const ac7Tiers = state.challengeRecords['AC7']?.completedTiers ?? 0
  if (ac7Tiers > 0) scale += 0.15 * ac7Tiers

  const capped = Math.min(2, scale)

  const forcedDuration =
    state.activeChallengeRestrictions?.anomalyDurationOverrideSeconds

  if (
    !state.activeAnomalyType ||
    (forcedDuration !== null && forcedDuration !== undefined)
  ) {
    return capped
  }

  const overflow = Math.max(0, state.anomalySpawnRawDuration - 180)
  
  return capped + 0.02 * overflow
}