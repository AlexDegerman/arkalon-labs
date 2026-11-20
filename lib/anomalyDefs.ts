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
    rewardDescription: '4x Global RP Production'
  },
  {
    type: 'temporal_distortion',
    label: 'Temporal Distortion',
    description:
      'Localized chronal distortion accelerating study speeds tenfold.',
    probability: 0.25,
    baseDurationSeconds: 45,
    rewardDescription: '10x Research Speed'
  },
  {
    type: 'containment_breach',
    label: 'Containment Breach',
    description:
      'Sub-atomic vacuum collapse doubling output and halving equipment construction costs.',
    probability: 0.2,
    baseDurationSeconds: 45,
    rewardDescription: '2x RP Production & 50% Generator Cost Reduction'
  },
  {
    type: 'arkalon_resonance',
    label: 'Arkalon Resonance',
    description:
      'Harmonic convergence synchronizing the Arkalon Core and accelerating yield.',
    probability: 0.2,
    baseDurationSeconds: 60,
    rewardDescription: '3x Production & 25% Tech Cost Reduction'
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
    baseDurationSeconds: 75,
    rewardDescription: '3x RP Production & 5x Research Speed'
  },
  {
    type: 'operation_solar_flare',
    label: 'Solar Flare Overload',
    description:
      'Stellar flare radiation directly energizing power generators.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '5x Output to Energy Generators'
  },
  {
    type: 'operation_gravity_sink',
    label: 'Gravity Sink Collapse',
    description:
      'Gravitational compression boosting output and reducing structural expansion costs.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '2x RP Production & 50% Generator Cost Reduction'
  },
  {
    type: 'operation_matrix_inversion',
    label: 'Matrix Inversion',
    description:
      'Matrix polarity shift multiplying Arkalon Resonance efficiency.',
    probability: 0.25,
    baseDurationSeconds: 60,
    rewardDescription: '3x Arkalon Resonance Multiplier'
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
    rewardDescription: '4x RP Production & 50% Generator Cost Discount'
  },
  {
    type: 'fused_chronal_breach',
    label: 'Chronal Resonance [Fused]',
    description:
      'Harmonic space-time disruption fusing Temporal Distortion and Arkalon Resonance.',
    probability: 0.5,
    baseDurationSeconds: 60,
    rewardDescription: '10x Research Speed & 3x RP & 25% Tech Discount'
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

  return weightedRandom(ANOMALY_DEFINITIONS)
}

// Returns the effective anomaly duration in seconds,
// applying E7, Anomaly Extender AR upgrade, Fractured Chrono-Hourglass relic,
// SC5 tiers, Matrix Mirror Phase 3, and challenge restrictions
export function getEffectiveDuration(
  def: AnomalyDefinition,
  state: GameState
): number {
  let duration = def.baseDurationSeconds

  // E7: anomalies last 2x longer
  if (state.completedResearchNodes.includes('E7')) {
    duration *= 2
  }

  // Anomaly Extender AR upgrade: +5 seconds per level (amplified by AC2)
  const extenderLevel = state.arUpgrades.anomaly_extender
  if (extenderLevel > 0) {
    const ac2Tiers = state.challengeRecords['AC2']?.completedTiers ?? 0
    const arEffectivenessMult = 1 + 0.2 * ac2Tiers
    duration += 5 * extenderLevel * arEffectivenessMult
  }

  // Fractured Chrono-Hourglass relic (ID 2): +1.5s per level
  if (
    !state.activeChallengeRestrictions?.relicsDisabled &&
    state.unlockedRelics.includes(2) &&
    state.relicSlots.some((s) => s.relicId === 2)
  ) {
    const relicLevel = state.relicLevels[2] ?? 0
    duration += 1.5 * relicLevel * getRelicEffectiveMultiplier(2, state)
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

  // SC5 reward: +5s anomaly duration per tier
  const sc5Tiers = state.challengeRecords['SC5']?.completedTiers ?? 0
  if (sc5Tiers > 0) {
    duration += 5 * sc5Tiers
  }

  // Reality Warden achievement capstone: +10s anomaly duration
  if (state.achievements?.includes('anomaly_50')) {
    duration += 10
  }

  // AC7 challenge: fixed 10-second duration
  const forcedDuration =
    state.activeChallengeRestrictions?.anomalyDurationOverrideSeconds
  if (forcedDuration !== null && forcedDuration !== undefined) {
    return forcedDuration
  }
  return Math.max(5, duration)
}

// Returns the next spawn check interval in seconds
// Range: 3-6 minutes, adjusted by Neural Pipeline, Anomalous Lens, and Quantum Die
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
    !state.activeChallengeRestrictions?.relicsDisabled &&
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
    return maxSeconds * 100
  }

  return minSeconds + Math.random() * (maxSeconds - minSeconds)
}

// Returns cumulative buff strength multiplier from C6, SC5, and AC7
export function getAnomalyBuffScale(state: GameState): number {
  let scale = 1

  if (
    !state.activeChallengeRestrictions?.techMatrixDisabled &&
    state.completedResearchNodes.includes('C6')
  ) {
    scale += 0.25
  }

  const sc5Tiers = state.challengeRecords['SC5']?.completedTiers ?? 0
  if (sc5Tiers > 0) scale += 0.25 * sc5Tiers

  const ac7Tiers = state.challengeRecords['AC7']?.completedTiers ?? 0
  if (ac7Tiers > 0) scale += 0.5 * ac7Tiers

  return scale
}