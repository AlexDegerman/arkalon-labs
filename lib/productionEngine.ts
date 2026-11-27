import type { GameState } from '@/types/game'
import {
  GENERATORS,
  MODULE_SYNERGIES,
  GENERATOR_CLASS
} from '@/constants/generators'
import {
  MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_CAP,
  MILESTONE_MIN_INTERVAL,
  MILESTONE_SHARPENER_REDUCTION,
  SUPERRECURSIVE_CORE_REDUCTION,
  SUPERRECURSIVE_CORE_MIN,
  AR_PRODUCTION_CAP,
  PHI_AR_PRODUCTION
} from '@/constants/game'
import {
  getTechMultiplierForGenerator,
  getTechLog10BonusForGenerator,
  getProductionExponentBonus
} from '@/lib/researchEffects'
import { MAX_RP_HARD_CAP } from '@/constants/game'
import { bigIntLog10 } from '@/lib/format'
import {
  getChallengeProductionMultiplier,
  getChallengeExponentBonus
} from '@/lib/challengeDefs'
import { AR_UPGRADES, getUpgradeCost, OS_UPGRADES } from '@/lib/prestigeUpgradeDefs'
import { getAnomalyBuffScale } from '@/lib/anomalyDefs'
import { getMegaprojectPhase } from '@/lib/megaprojectDefs'
import {
  getInfiniteLedgerReduction,
  getRelicDarkEnergyCostMultiplier,
  getRelicExponentBonus,
  getRelicPerGeneratorMultiplier,
  getRelicSynergyBonus,
  getSuperrecursiveCoreLevel
} from '@/lib/relicEffects'
import { getModuleLevelCap } from './moduleDefs'

// Precision scale factor: all intermediate multipliers are computed as
// integer numerators over SCALE_DENOM to avoid floating-point in the hot path
const SCALE_DENOM = 1_000_000n // 6 decimal places of precision

function getReducedInterval(
  baseInterval: number,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number,
  sc8Tiers = 0
): number {
  let interval = baseInterval
  // Each Milestone Sharpener level reduces by 1 (floor MILESTONE_MIN_INTERVAL)
  interval -= milestoneSharpenerLevel * MILESTONE_SHARPENER_REDUCTION
  // Superrecursive Core relic reduces by 2 per level (floor SUPERRECURSIVE_CORE_MIN)
  interval -= Math.floor(
    superrecursiveCoreLevel * SUPERRECURSIVE_CORE_REDUCTION
  )
  // SC8 reward: Milestones trigger 2 units earlier per tier
  interval -= 2 * sc8Tiers
  const floor =
    superrecursiveCoreLevel > 0
      ? SUPERRECURSIVE_CORE_MIN
      : MILESTONE_MIN_INTERVAL
  return Math.max(floor, interval)
}

// Computes cumulative milestone steps; Desk keeps its 10..50 steps and adds post-50 steps above 50
export function getCumulativeMilestoneSteps(
  generatorIndex: number,
  quantity: bigint,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number,
  sc8Tiers = 0
): number {
  const q = Number(quantity)
  const stdInterval = getReducedInterval(
    MILESTONE_INTERVAL,
    milestoneSharpenerLevel,
    superrecursiveCoreLevel,
    sc8Tiers
  )

  if (generatorIndex === 0) {
    const earlyInterval = getReducedInterval(
      RESEARCH_DESK_MILESTONE_INTERVAL,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    const earlyQty = Math.min(q, RESEARCH_DESK_MILESTONE_CAP)
    const earlySteps = Math.floor(earlyQty / earlyInterval)
    const postSteps =
      q > RESEARCH_DESK_MILESTONE_CAP
        ? Math.floor((q - RESEARCH_DESK_MILESTONE_CAP) / stdInterval)
        : 0
    return earlySteps + postSteps
  }

  return Math.floor(q / stdInterval)
}

// Returns current count, next threshold, and cumulative doubling steps at that threshold
export function getNextMilestoneInfo(
  generatorIndex: number,
  quantity: bigint,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number,
  sc8Tiers = 0
): { current: number; next: number; doublings: number } {
  const q = Number(quantity)
  const stdInterval = getReducedInterval(
    MILESTONE_INTERVAL,
    milestoneSharpenerLevel,
    superrecursiveCoreLevel,
    sc8Tiers
  )

  if (generatorIndex === 0) {
    const earlyInterval = getReducedInterval(
      RESEARCH_DESK_MILESTONE_INTERVAL,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    const maxEarlySteps = Math.floor(
      RESEARCH_DESK_MILESTONE_CAP / earlyInterval
    )

    if (q < RESEARCH_DESK_MILESTONE_CAP) {
      const currentEarlySteps = Math.floor(q / earlyInterval)
      const nextThreshold = (currentEarlySteps + 1) * earlyInterval
      if (nextThreshold <= RESEARCH_DESK_MILESTONE_CAP) {
        return {
          current: q,
          next: nextThreshold,
          doublings: currentEarlySteps + 1
        }
      }
    }

    const postQty = Math.max(0, q - RESEARCH_DESK_MILESTONE_CAP)
    const postSteps = Math.floor(postQty / stdInterval)
    return {
      current: q,
      next: RESEARCH_DESK_MILESTONE_CAP + (postSteps + 1) * stdInterval,
      doublings: maxEarlySteps + postSteps + 1
    }
  }

  const steps = Math.floor(q / stdInterval)
  return {
    current: q,
    next: (steps + 1) * stdInterval,
    doublings: steps + 1
  }
}

const MILESTONE_FULL_DOUBLE_CAP = 8
const MILESTONE_TAPER_BASE = 1.08
const MILESTONE_EXP_STEP_CAP = 100

// Safely multiplies a BigInt by any float without overflowing BigInt(Infinity)
function multiplyBigIntByFloat(value: bigint, factor: number): bigint {
  if (value <= 0n || !Number.isFinite(factor) || factor <= 0) {
    return !Number.isFinite(factor) ? value : 0n
  }
  if (factor === 1) return value
  if (factor <= 1e11 && factor >= 1e-4) {
    return (value * BigInt(Math.round(factor * 10000))) / 10000n
  }
  const log10F = Math.log10(factor)
  const exp = Math.floor(log10F)
  const mantissaScaled = BigInt(Math.round(Math.pow(10, log10F - exp) * 1e9))
  if (exp >= 9) {
    return value * mantissaScaled * 10n ** BigInt(Math.min(1000, exp - 9))
  }
  return (value * mantissaScaled) / 10n ** BigInt(9 - exp)
}

// Computes 2^steps up to 8 milestones, 1.08^extra up to step 100, then linear taper to avoid endless blowup
function milestoneMultiplier(steps: number): bigint {
  if (steps <= 0) return SCALE_DENOM
  if (steps <= MILESTONE_FULL_DOUBLE_CAP) {
    return SCALE_DENOM * (1n << BigInt(steps))
  }
  const fullScale = 1n << BigInt(MILESTONE_FULL_DOUBLE_CAP)
  const cappedSteps = Math.min(steps, MILESTONE_EXP_STEP_CAP)
  const extraSteps = cappedSteps - MILESTONE_FULL_DOUBLE_CAP
  const extraScaled = BigInt(
    Math.round(Math.pow(MILESTONE_TAPER_BASE, extraSteps) * 1_000_000)
  )
  let mult = (SCALE_DENOM * fullScale * extraScaled) / 1_000_000n
  if (steps > MILESTONE_EXP_STEP_CAP) {
    const linearFactor = 100n + 5n * BigInt(steps - MILESTONE_EXP_STEP_CAP)
    mult = (mult * linearFactor) / 100n
  }
  return mult
}

export function getMilestoneMultiplier(steps: number): bigint {
  return milestoneMultiplier(steps) / SCALE_DENOM
}

// Computes the total output multiplier from generator modules
// Returns a float multiplier (applied via BigInt approximation)
function computeModuleEfficiencyMultiplier(efficiencyLevel: number): number {
  // Each level: output * 1.25^level
  return Math.pow(1.25, efficiencyLevel)
}

export interface CenturyMutation {
  threshold: bigint
  name: string
  multiplier: bigint
  description: string
  badge: string
}

export const CENTURY_MUTATIONS: CenturyMutation[] = [
  {
    threshold: 100n,
    name: 'Overclock Synthesis',
    multiplier: 2n,
    description: '2x Base Output & Growth Factor -0.005',
    badge: 'M100'
  },
  {
    threshold: 250n,
    name: 'Sub-harmonic Resonance',
    multiplier: 3n,
    description: '3x Output & +10% Cross-Synergies',
    badge: 'M250'
  },
  {
    threshold: 500n,
    name: 'Dimensional Singularity',
    multiplier: 5n,
    description: '5x Output & Global Class Output +5%',
    badge: 'M500'
  },
  {
    threshold: 1000n,
    name: 'Trans-Finite Ascendance',
    multiplier: 10n,
    description: '10x Output & +0.01 Production Exponent',
    badge: 'M1000'
  }
]

// Computes synergy bonus multiplier for a target generator
// Returns a float multiplicative bonus (1.0 + sum of bonuses)
// Synergy only applies when the source generator has synergyLevel >= 1
function computeSynergyMultiplier(
  targetIndex: number,
  state: GameState
): number {
  if (state.activeChallengeRestrictions?.modulesDisabled) return 1
  let bonus = 0
  const isAC5 = state.activeChallengeId === 'AC5'
  const relicBonus = getRelicSynergyBonus(state)
  for (const synergy of MODULE_SYNERGIES) {
    if (synergy.targetIndex !== targetIndex) continue
    const sourceGen = state.generators[synergy.sourceIndex]
    if (!sourceGen || sourceGen.synergyLevel === 0) continue
    const sourceQty = Number(sourceGen.quantity)
    const effectiveSynergyLevel = isAC5
      ? sourceGen.synergyLevel * 2
      : sourceGen.synergyLevel
    const mutationSynergyMult =
      sourceGen.quantity >= 250n &&
      !state.activeChallengeRestrictions?.milestonesDisabled
        ? 1.1
        : 1
    const moduleCap = getModuleLevelCap(state)
    const overclockSynergyMult =
      sourceGen.efficiencyLevel >= moduleCap &&
      sourceGen.costReductionLevel >= moduleCap &&
      sourceGen.synergyLevel >= moduleCap
        ? 1.25
        : 1
    bonus +=
      sourceQty *
      synergy.bonusPerSourcePerLevel *
      effectiveSynergyLevel *
      relicBonus *
      mutationSynergyMult *
      overclockSynergyMult
  }
  return 1 + bonus
}

// Computes the effective output of a single generator type in milliRP/sec * SCALE_DENOM
function computeGeneratorOutput(
  index: number,
  state: GameState,
  techMultiplier: number,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number,
  sc8Tiers = 0
): bigint {
  const gen = state.generators[index]
  if (!gen || gen.quantity === 0n) return 0n

  const def = GENERATORS[index]
  if (!def) return 0n

  // SC1/AC4/EC1: generator tier limit
  const maxTier = state.activeChallengeRestrictions?.maxGeneratorTier
  if (maxTier !== null && maxTier !== undefined && index >= maxTier) return 0n

  // EC2: only one generator type
  const onlyType = state.activeChallengeRestrictions?.onlyGeneratorType
  if (onlyType !== null && onlyType !== undefined && index !== onlyType)
    return 0n

  // Base output in milliRP/sec
  let baseOutput = def.baseOutput * gen.quantity

  // AC6: only relics provide production (2% of base output per equipped relic level)
  if (state.activeChallengeRestrictions?.noBaseGeneratorOutput) {
    const totalRelicLevels = state.relicSlots.reduce(
      (sum, s) => sum + (s.relicId ? (state.relicLevels[s.relicId] ?? 0) : 0),
      0
    )
    if (totalRelicLevels <= 0) return 0n
    baseOutput = (baseOutput * BigInt(totalRelicLevels * 20)) / 1000n
  }

  // SC8: milestone multipliers disabled
  const milestonesDisabled =
    state.activeChallengeRestrictions?.milestonesDisabled ?? false
  if (!milestonesDisabled) {
    const steps = getCumulativeMilestoneSteps(
      index,
      gen.quantity,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    const milestoneScale = milestoneMultiplier(steps)
    baseOutput = (baseOutput * milestoneScale) / SCALE_DENOM

    // Century Milestone Mutations
    if (gen.quantity >= 100n) baseOutput *= 2n
    if (gen.quantity >= 250n) baseOutput *= 3n
    if (gen.quantity >= 500n) baseOutput *= 5n
    if (gen.quantity >= 1000n) baseOutput *= 10n

    // M500 Global Class Output: +5% per generator of the same class at 500+ units
    const genClass = GENERATOR_CLASS[index]
    const m500ClassCount = state.generators.filter(
      (g, idx) => GENERATOR_CLASS[idx] === genClass && g.quantity >= 500n
    ).length
    if (m500ClassCount > 0) {
      baseOutput = (baseOutput * BigInt(100 + 5 * m500ClassCount)) / 100n
    }
  }

  // SC1 reward: 2x compounding base output to Tiers 1-3 per tier
  const sc1Tiers = state.challengeRecords['SC1']?.completedTiers ?? 0
  if (index < 3 && sc1Tiers > 0) {
    baseOutput *= 2n ** BigInt(sc1Tiers)
  }

  // AC4 reward: Tiers 1-5 base output tripled per tier
  const ac4Tiers = state.challengeRecords['AC4']?.completedTiers ?? 0
  if (index < 5 && ac4Tiers > 0) {
    baseOutput *= 3n ** BigInt(ac4Tiers)
  }

  // Efficiency module multiplier (float -> bigint approximation)
  const modulesDisabled =
    state.activeChallengeRestrictions?.modulesDisabled ?? false
  if (gen.efficiencyLevel > 0 && !modulesDisabled) {
    // AC5 challenge: module levels doubled during run
    const isAC5 = state.activeChallengeId === 'AC5'
    const effectiveEffLevel = isAC5
      ? gen.efficiencyLevel * 2
      : gen.efficiencyLevel
    const effMult = computeModuleEfficiencyMultiplier(effectiveEffLevel)
    baseOutput = multiplyBigIntByFloat(baseOutput, effMult)
  }

  // Solar flare operation anomaly: 3x (scaled) to energy-class generators
  if (
    state.activeAnomalyType === 'operation_solar_flare' &&
    GENERATOR_CLASS[index] === 'energy'
  ) {
    const buffScale = getAnomalyBuffScale(state)
    baseOutput = multiplyBigIntByFloat(baseOutput, 3 * buffScale)
  }

  // Challenge: generator production multiplier (e.g. AC1 = 0.1)
  const prodMult =
    state.activeChallengeRestrictions?.generatorProductionMultiplier ?? 1
  if (prodMult !== 1) {
    baseOutput = multiplyBigIntByFloat(baseOutput, prodMult)
  }

  // Chassis Overclock (Full Set Bonus: all 3 modules at cap)
  const moduleCap = getModuleLevelCap(state)
  if (
    !modulesDisabled &&
    gen.efficiencyLevel >= moduleCap &&
    gen.costReductionLevel >= moduleCap &&
    gen.synergyLevel >= moduleCap
  ) {
    baseOutput *= 2n
  }

  // Synergy multiplier
  const synergyMult = computeSynergyMultiplier(index, state)
  if (synergyMult !== 1) {
    baseOutput = multiplyBigIntByFloat(baseOutput, synergyMult)
  }

  // Tech multiplier (per-generator research effects + safe log10 infinite research scaling)
  if (techMultiplier !== 1) {
    baseOutput = multiplyBigIntByFloat(baseOutput, techMultiplier)
  }
  const techLog10 = getTechLog10BonusForGenerator(index, state)
  if (techLog10 > 0) {
    const exp = Math.min(1000, Math.floor(techLog10))
    const mantissaScaled = BigInt(
      Math.round(Math.pow(10, techLog10 - Math.floor(techLog10)) * 1e6)
    )
    baseOutput = (baseOutput * mantissaScaled * 10n ** BigInt(exp)) / 1_000_000n
  }

  // Per-generator relic multiplier
  const relicGenMult = getRelicPerGeneratorMultiplier(index, state)
  if (relicGenMult !== 1) {
    baseOutput = multiplyBigIntByFloat(baseOutput, relicGenMult)
  }

  return baseOutput
}

  // Per-generator tech multiplier - delegates to researchEffects.ts
function computeTechMultiplierForGenerator(
  generatorIndex: number,
  state: GameState
): number {
  return getTechMultiplierForGenerator(generatorIndex, state)
}

export function getARCap(state: GameState): number {
  return AR_PRODUCTION_CAP + (state.arUpgrades.arkalon_harmonic_cap ?? 0) * 500
}

export function getCountedAR(state: GameState): number {
  const spentAR = AR_UPGRADES.reduce((sum, def) => {
    const lvl = state.arUpgrades[def.id as keyof typeof state.arUpgrades] ?? 0
    let invested = 0
    for (let l = 0; l < lvl; l++) invested += getUpgradeCost(def, l)
    return sum + invested
  }, 0)

  const effectiveCap = getARCap(state)
  const totalHeld = Math.max(
    state.resonanceMemoryAR ?? 0,
    state.arkalonResonance + spentAR
  )
  return Math.min(totalHeld, effectiveCap)
}

// Computes the AR production bonus using total AR earned + Resonance Memory floor
export function computeARBonus(state: GameState): number {
  const ec4Doubling =
    (state.challengeRecords['EC4']?.completedTiers ?? 0) > 0 ? 2 : 1
  if (state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
    return ec4Doubling
  }
  const matrixInversionMultiplier =
    state.activeAnomalyType === 'operation_matrix_inversion'
      ? 2 * getAnomalyBuffScale(state)
      : 1

  const countedAR = getCountedAR(state)
  if (countedAR === 0) return ec4Doubling

  // Base AR efficiency per unit
  let perARBonus = PHI_AR_PRODUCTION

  // O_INF: +5% AR multiplier strength per level
  const oInfLevel = state.infiniteResearchLevels['O_INF'] ?? 0
  if (oInfLevel > 0) {
    perARBonus *= 1 + 0.05 * oInfLevel
  }

  // O7: +1% AR effectiveness per total prestige completed
  const totalPrestiges =
    state.stats.totalPrestigesTier1 +
    state.stats.totalPrestigesTier2 +
    state.stats.totalPrestigesTier3
  if (state.completedResearchNodes.includes('O7') && totalPrestiges > 0) {
    perARBonus *= 1 + 0.01 * totalPrestiges
  }

  let arBonus = 1 + perARBonus * countedAR

  // AC2 reward: AR upgrade effectiveness +20% per tier
  const ac2Tiers = state.challengeRecords['AC2']?.completedTiers ?? 0
  const arEffectivenessMult = 1 + 0.2 * ac2Tiers

  // Super-Symmetry: additional +10% per counted AR
  if (state.arUpgrades.super_symmetry > 0) {
    arBonus += 0.1 * countedAR * arEffectivenessMult
  }

  // E5: +0.5% per counted AR
  if (state.completedResearchNodes.includes('E5')) {
    arBonus += 0.005 * countedAR
  }

  // Matrix Inversion doubles only the AR-derived bonus, not the base multiplier
  arBonus = 1 + (arBonus - 1) * matrixInversionMultiplier

  // EC4 reward: Arkalon global multiplier permanently doubled
  arBonus *= ec4Doubling
  
  return arBonus
}

// Computes generator priming AR upgrade bonus (compounding 1.35^level, amplified by AC2)
function computeGeneratorPrimingBonus(state: GameState): number {
  if (state.activeChallengeRestrictions?.prestigeUpgradesDisabled) return 1
  if (state.arUpgrades.generator_priming <= 0) return 1
  const ac2Tiers = state.challengeRecords['AC2']?.completedTiers ?? 0
  const arEffectivenessMult = 1 + 0.2 * ac2Tiers
  return Math.pow(
    1 + 0.35 * arEffectivenessMult,
    state.arUpgrades.generator_priming
  )
}

// Master PPS recalculation
// Called only when inputs change - NEVER from the tick loop
// Returns total RP/sec as bigint (in whole RP, not milliRP)
export function recalculatePPS(state: GameState): bigint {
  // AC1: Telemetry Starvation - generators produce RP only while research is active
  if (state.activeChallengeRestrictions?.productionOnlyWhileResearching) {
    const hasActiveResearch = state.activeResearchSlots.some(
      (s) => s.nodeId !== null && s.timerRemaining > 0
    )
    if (!hasActiveResearch) return 0n
  }

  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled
  const milestoneSharpenerLevel = prestigeDisabled
    ? 0
    : state.arUpgrades.milestone_sharpener
  const superrecursiveCoreLevel = getSuperrecursiveCoreLevel(state)
  const arBonus = computeARBonus(state)
  const primingBonus = computeGeneratorPrimingBonus(state)

  let totalMilliRP = 0n

  const sc8Tiers = state.challengeRecords['SC8']?.completedTiers ?? 0

  for (let i = 0; i < 20; i++) {
    const techMult = computeTechMultiplierForGenerator(i, state)
    const output = computeGeneratorOutput(
      i,
      state,
      techMult,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    totalMilliRP += output
  }

  let globalMult = arBonus * primingBonus

  // Chronos Array megaproject: permanent 1.5x global multiplier
  if (state.completedMegaprojects.includes('chronos_array')) {
    globalMult *= 1.5
  }

  // Active Dyson Swarm phased global output bonuses
  if (state.activeMegaprojectId === 'dyson_swarm') {
    const swarmPhase = getMegaprojectPhase('dyson_swarm', state)
    if (swarmPhase >= 3) globalMult *= 1.075
    else if (swarmPhase >= 2) globalMult *= 1.05
    else if (swarmPhase >= 1) globalMult *= 1.025
  }

  // Arkalon Dyson Swarm: +10% compounding global RP per swarm level
  const swarmLevel = state.dysonSwarmLevel ?? 0
  if (swarmLevel > 0) {
    globalMult *= Math.pow(1.1, swarmLevel)
  }

  // Cosmic Singularity Attunement: +1% permanent global RP per level
  const attunementLevel = state.cosmicAttunementLevel ?? 0
  if (attunementLevel > 0) {
    globalMult *= 1 + 0.01 * attunementLevel
  }

  // Active anomaly production booster
  const anomalyBuffScale = getAnomalyBuffScale(state)
  if (state.activeAnomalyType === 'fused_singularity_surge') {
    globalMult *= 4 * anomalyBuffScale
  } else if (state.activeAnomalyType === 'quantum_surge') {
    globalMult *= 3 * anomalyBuffScale
  } else if (
    state.activeAnomalyType === 'containment_breach' ||
    state.activeAnomalyType === 'operation_gravity_sink'
  ) {
    globalMult *= 2.5 * anomalyBuffScale
  } else if (
    state.activeAnomalyType === 'arkalon_resonance' ||
    state.activeAnomalyType === 'operation_chrono_freeze' ||
    state.activeAnomalyType === 'fused_chronal_breach'
  ) {
    globalMult *= 2 * anomalyBuffScale
  }

  // Challenge completion permanent multipliers
  const challengeMult = getChallengeProductionMultiplier(state)
  if (challengeMult !== 1) globalMult *= challengeMult

  const achievements = state.achievements ?? []
  let achievementMult = 1 + 0.01 * achievements.length
  if (achievements.includes('gen_1000')) achievementMult *= 1.1
  if (achievements.includes('challenge_all_standard')) achievementMult *= 1.25
  globalMult *= achievementMult

  let totalRP: bigint
  if (!isFinite(globalMult) || globalMult > 1e15) {
    const safeLog = isFinite(globalMult) ? Math.log10(globalMult) : 308
    const exp = Math.floor(safeLog)
    const mantissa = Math.pow(10, safeLog - exp)
    const scaled = BigInt(Math.round(mantissa * 1e9))
    totalRP =
      exp >= 12
        ? totalMilliRP * scaled * 10n ** BigInt(exp - 12)
        : (totalMilliRP * scaled) / 10n ** BigInt(12 - exp)
  } else {
    totalRP =
      globalMult > 1e11
        ? (totalMilliRP * BigInt(Math.round(globalMult))) / 1000n
        : (totalMilliRP * BigInt(Math.round(globalMult * 10000))) / 10000000n
  }
  if (totalRP <= 0n && totalMilliRP > 0n) totalRP = 1n

  // Quantum Overdrive: 2^level applied directly in BigInt
  if (!prestigeDisabled && (state.arUpgrades.quantum_overdrive ?? 0) > 0) {
    totalRP <<= BigInt(state.arUpgrades.quantum_overdrive)
  }

  // Apply production exponent bonus: output ^ (1 + exponentBonus)
  // Includes research node bonus, relic bonus, challenge rewards, and EC4 achievement capstone
  const ec4AchExp = state.achievements?.includes('challenge_ec4') ? 0.02 : 0
  const exponentBonus =
    getProductionExponentBonus(state) +
    getRelicExponentBonus(state) +
    getChallengeExponentBonus(state) +
    ec4AchExp

  let finalRP = totalRP

  if (totalRP > 1n) {
    const log10Base = bigIntLog10(totalRP)
    let log10Val =
      exponentBonus > 0 ? log10Base * (1 + exponentBonus) : log10Base

    // Endless Mode softcap above 1e308 RP/sec; hard-bounded below MAX_RP_HARD_CAP
    if (log10Val > 308) {
      log10Val = Math.min(999.9, 308 + Math.pow(log10Val - 308, 0.88))
    }

    if (exponentBonus > 0 || log10Base > 308) {
      if (log10Val > 15) {
        const exp = Math.floor(log10Val)
        const mantissa = Math.pow(10, log10Val - exp)
        const mantissaScaled = BigInt(Math.floor(mantissa * 1e12))
        if (exp >= 12) {
          finalRP = mantissaScaled * 10n ** BigInt(exp - 12)
        } else {
          finalRP = mantissaScaled / 10n ** BigInt(12 - exp)
        }
      } else {
        finalRP = BigInt(Math.floor(Math.pow(10, log10Val)))
      }
      if (log10Base <= 308 && finalRP < totalRP) {
        finalRP = totalRP
      }
    }
  }
  return finalRP > MAX_RP_HARD_CAP ? MAX_RP_HARD_CAP : finalRP
}

export function getEffectiveGrowthFactor(
  generatorIndex: number,
  state: GameState,
  quantityOverride?: bigint
): number {
  const def = GENERATORS[generatorIndex]
  if (!def) return 1.15

  const gen = state.generators[generatorIndex]
  const effectiveQty = quantityOverride ?? gen?.quantity ?? 0n
  let growthFactor = def.growthFactor

  const modulesDisabled =
    state.activeChallengeRestrictions?.modulesDisabled ?? false
  if (gen && gen.costReductionLevel > 0 && !modulesDisabled) {
    const isAC5 = state.activeChallengeId === 'AC5'
    const effectiveCostLevel = isAC5
      ? gen.costReductionLevel * 2
      : gen.costReductionLevel
    growthFactor = Math.max(1.01, growthFactor - 0.015 * effectiveCostLevel)
  }

  const techDisabled = state.activeChallengeRestrictions?.techMatrixDisabled
  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled

  if (
    !state.activeChallengeRestrictions?.milestonesDisabled &&
    effectiveQty >= 100n
  ) {
    growthFactor = Math.max(1.01, growthFactor - 0.005)
  }

  // Node C1: reduces Research Desk growth factor by 0.02
  if (
    !techDisabled &&
    generatorIndex === 0 &&
    state.completedResearchNodes.includes('C1')
  ) {
    growthFactor = Math.max(1.01, growthFactor - 0.02)
  }

  const sc6Tiers = state.challengeRecords['SC6']?.completedTiers ?? 0
  if (sc6Tiers > 0) {
    growthFactor = Math.max(1.01, growthFactor - 0.01 * sc6Tiers)
  }

  if (
    !techDisabled &&
    generatorIndex >= 10 &&
    state.completedResearchNodes.includes('C9')
  ) {
    growthFactor = Math.max(1.01, growthFactor - 0.015)
  }

  if (
    !techDisabled &&
    GENERATOR_CLASS[generatorIndex] === 'energy' &&
    state.completedResearchNodes.includes('E6')
  ) {
    growthFactor = Math.max(1.01, growthFactor - 0.02)
  }

  if (!prestigeDisabled && state.osUpgrades.dimensional_transcendence > 0) {
    growthFactor = Math.max(1.01, growthFactor - 0.05)
  }

  if (
    !state.activeChallengeRestrictions?.relicsDisabled &&
    generatorIndex < 5 &&
    state.unlockedRelics.includes(4) &&
    state.relicSlots.some((s) => s.relicId === 4)
  ) {
    growthFactor = Math.max(
      1.01,
      growthFactor -
        getInfiniteLedgerReduction(state.relicLevels[4] ?? 0, state)
    )
  }

  return growthFactor
}

// Returns the effective cost of a generator purchase accounting for
// cost reduction module and research effects
export function generatorEffectiveCost(
  generatorIndex: number,
  quantity: bigint,
  state: GameState
): bigint {
  const def = GENERATORS[generatorIndex]
  if (!def) return 0n

  const growthFactor = getEffectiveGrowthFactor(generatorIndex, state, quantity)

  // O5: 0.01% cost reduction per Arkalon Interface owned (capped at 90%)
  let costReductionMultiplier = 1
  if (state.completedResearchNodes.includes('O5')) {
    const aiCount = Number(state.generators[6].quantity)
    costReductionMultiplier = Math.max(0.1, 1 - 0.0001 * aiCount)
  }

  // Node R1: reduces initial unlock purchase cost for Server Cluster and Quantum Computer by 15%
  if (
    quantity === 0n &&
    (generatorIndex === 1 || generatorIndex === 2) &&
    state.completedResearchNodes.includes('R1')
  ) {
    costReductionMultiplier *= 0.85
  }

  const relic17Mult = getRelicDarkEnergyCostMultiplier(generatorIndex, state)
  if (relic17Mult < 1) {
    costReductionMultiplier *= relic17Mult
  }

  // Challenge cost multiplier
  const challengeMult =
    state.activeChallengeRestrictions?.generatorCostMultiplier ?? 1

  const q = Number(quantity)
  const log10Base = Math.log10(Number(def.baseCost))
  const log10Mult = Math.log10(costReductionMultiplier * challengeMult)
  const log10Total = log10Base + q * Math.log10(growthFactor) + log10Mult

  if (log10Total > 15) {
    const exp = Math.floor(log10Total)
    const mantissa = Math.pow(10, log10Total - exp)
    const scaled = BigInt(Math.ceil(mantissa * 1e12))
    return scaled * 10n ** BigInt(Math.max(0, exp - 12))
  }

  const cost = BigInt(
    Math.ceil(
      Number(def.baseCost) *
        Math.pow(growthFactor, q) *
        costReductionMultiplier *
        challengeMult
    )
  )

  return cost
}

// Returns PPS contribution of a single additional generator purchase
// Used for "cost efficiency" tooltip and auto-buy-optimal automation
export function marginalPPS(generatorIndex: number, state: GameState): bigint {
  const gen = state.generators[generatorIndex]
  const def = GENERATORS[generatorIndex]
  if (!def) return 0n

  // Simulate adding 1 more unit
  const simulatedGen = { ...gen, quantity: gen.quantity + 1n }
  const simulatedState: GameState = {
    ...state,
    generators: state.generators.map((g, i) =>
      i === generatorIndex ? simulatedGen : g
    )
  }

  return recalculatePPS(simulatedState) - state.cachedPointsPerSecond
}

export function getExponentSources(
  state: GameState
): Array<{ label: string; value: number }> {
  const sources: Array<{ label: string; value: number }> = []
  const techDisabled = state.activeChallengeRestrictions?.techMatrixDisabled
  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled

  if (!techDisabled) {
    if (state.completedResearchNodes.includes('C5')) {
      sources.push({ label: 'Node C5 (Hilbert-Space)', value: 0.1 })
    }
    if (state.completedResearchNodes.includes('R10')) {
      sources.push({ label: 'Node R10 (Collapser Core)', value: 0.5 })
    }
  }

  if (!state.activeChallengeRestrictions?.milestonesDisabled) {
    const ascCount = state.generators.filter((g) => g.quantity >= 1000n).length
    if (ascCount > 0) {
      sources.push({
        label: `M1000 Mutations (${ascCount})`,
        value: 0.01 * ascCount
      })
    }
  }

  if (!prestigeDisabled) {
    if (state.osUpgrades.exponential_catalyst > 0) {
      const spentOS = OS_UPGRADES.reduce((sum, def) => {
        const lvl =
          state.osUpgrades[def.id as keyof typeof state.osUpgrades] ?? 0
        let invested = 0
        for (let l = 0; l < lvl; l++) invested += getUpgradeCost(def, l)
        return sum + invested
      }, 0)
      const totalOS = Math.max(1, state.omniSpars + spentOS)
      sources.push({
        label: 'OS Exponential Catalyst',
        value: Math.min(0.75, 0.15 + 0.08 * Math.log10(1 + totalOS))
      })
    }
    const resComp = state.arUpgrades.resonance_compression ?? 0
    if (resComp > 0) {
      sources.push({
        label: `AR Resonance Compression (Lv${resComp})`,
        value: 0.02 * resComp
      })
    }
  }

  if (state.completedMegaprojects.includes('omega_singularity_sphere')) {
    sources.push({ label: 'Omega Singularity Sphere', value: 0.3 })
  } else if (
    state.activeMegaprojectId === 'omega_singularity_sphere' &&
    getMegaprojectPhase('omega_singularity_sphere', state) >= 2
  ) {
    sources.push({ label: 'Omega Sphere (Phase 2)', value: 0.05 })
  }

  const swarmLevel = state.dysonSwarmLevel ?? 0
  if (swarmLevel > 0) {
    sources.push({
      label: `Arkalon Dyson Swarm (Lv${swarmLevel})`,
      value: 0.5 * (1 - Math.exp(-0.04 * swarmLevel))
    })
  }

  const relicExp = getRelicExponentBonus(state)
  if (relicExp > 0) {
    sources.push({ label: 'Relic 8 (Tachyon Prism)', value: relicExp })
  }

  const chalExp = getChallengeExponentBonus(state)
  if (chalExp > 0) {
    sources.push({ label: 'Challenge Rewards', value: chalExp })
  }

  if (state.achievements?.includes('challenge_ec4')) {
    sources.push({ label: 'Achievement: The Final Watcher', value: 0.02 })
  }

  return sources
}

export interface ProductionBreakdown {
  finalPPS: bigint
  isSoftcapped: boolean
  baseTotalMilliRP: bigint
  achievementCount: number
  achievementMultiplier: number
  arMultiplier: number
  arCounted: number
  arCap: number
  arMemory: number
  relicMultiplier: number
  activeRelicCount: number
  primingMultiplier: number
  challengeMultiplier: number
  activeAnomalyBooster: { name: string; multiplier: number } | null
  exponentBonus: number
  exponentSources: Array<{ label: string; value: number }>
  topGenerators: Array<{ name: string; percentOfBase: number }>
}

export function getProductionBreakdown(state: GameState): ProductionBreakdown {
  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled ?? false
  const milestoneSharpenerLevel = prestigeDisabled
    ? 0
    : state.arUpgrades.milestone_sharpener
  const superrecursiveCoreLevel = getSuperrecursiveCoreLevel(state)
  const sc8Tiers = state.challengeRecords['SC8']?.completedTiers ?? 0

  let baseTotal = 0n
  const generatorOutputs: Array<{ name: string; outputMilliRP: bigint }> = []

  for (let i = 0; i < 20; i++) {
    const techMult = computeTechMultiplierForGenerator(i, state)
    const out = computeGeneratorOutput(
      i,
      state,
      techMult,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    if (out > 0n) {
      baseTotal += out
      generatorOutputs.push({
        name: GENERATORS[i]?.name ?? `Gen ${i + 1}`,
        outputMilliRP: out
      })
    }
  }

  const topGenerators = generatorOutputs
    .sort((a, b) => (b.outputMilliRP > a.outputMilliRP ? 1 : -1))
    .slice(0, 5)
    .map((g) => ({
      ...g,
      percentOfBase:
        baseTotal > 0n ? Number((g.outputMilliRP * 100n) / baseTotal) : 0
    }))

  const buffScale = getAnomalyBuffScale(state)
  let anomalyBooster: { name: string; multiplier: number } | null = null
    if (state.activeAnomalyType === 'quantum_surge') {
      anomalyBooster = { name: 'Quantum Surge', multiplier: 3 * buffScale }
    } else if (state.activeAnomalyType === 'fused_singularity_surge') {
      anomalyBooster = {
        name: 'Singularity Surge [Fused]',
        multiplier: 4 * buffScale
      }
    } else if (state.activeAnomalyType === 'fused_chronal_breach') {
      anomalyBooster = {
        name: 'Chronal Resonance [Fused]',
        multiplier: 2 * buffScale
      }
    } else if (state.activeAnomalyType === 'arkalon_resonance') {
      anomalyBooster = { name: 'Arkalon Resonance', multiplier: 2 * buffScale }
    } else if (state.activeAnomalyType === 'operation_chrono_freeze') {
      anomalyBooster = { name: 'Chrono-Freeze Flux', multiplier: 2 * buffScale }
    } else if (state.activeAnomalyType === 'containment_breach') {
      anomalyBooster = {
        name: 'Containment Breach',
        multiplier: 2.5 * buffScale
      }
    } else if (state.activeAnomalyType === 'operation_gravity_sink') {
      anomalyBooster = {
        name: 'Gravity Sink Collapse',
        multiplier: 2.5 * buffScale
      }
    } else if (state.activeAnomalyType === 'operation_solar_flare') {
      anomalyBooster = {
        name: 'Solar Flare Overload (Energy)',
        multiplier: 3 * buffScale
      }
    } else if (state.activeAnomalyType === 'operation_matrix_inversion') {
      anomalyBooster = {
        name: 'Matrix Inversion (AR)',
        multiplier: 2 * buffScale
      }
    }

  const achievements = state.achievements ?? []
  const achievementCount = achievements.length
  let achievementMultiplier = 1 + 0.01 * achievementCount
  if (achievements.includes('gen_1000')) achievementMultiplier *= 1.1
  if (achievements.includes('challenge_all_standard'))
    achievementMultiplier *= 1.25
  const ec4AchExp = achievements.includes('challenge_ec4') ? 0.02 : 0

  return {
    finalPPS: state.cachedPointsPerSecond,
    isSoftcapped: state.cachedPointsPerSecond >= 10n ** 308n,
    baseTotalMilliRP: baseTotal,
    achievementCount,
    achievementMultiplier,
    arMultiplier: computeARBonus(state),
    arCounted: getCountedAR(state),
    arCap: getARCap(state),
    arMemory: state.resonanceMemoryAR ?? 0,
    relicMultiplier: (() => {
      let baseWithoutRelics = 0n
      let baseWithRelics = 0n
      for (let i = 0; i < 20; i++) {
        const gen = state.generators[i]
        if (!gen || gen.quantity === 0n) continue
        const def = GENERATORS[i]
        if (!def) continue
        const relicGenMult = getRelicPerGeneratorMultiplier(i, state)
        const genBase = def.baseOutput * gen.quantity
        baseWithoutRelics += genBase
        baseWithRelics +=
          (genBase * BigInt(Math.round(relicGenMult * 1000))) / 1000n
      }
      if (baseWithoutRelics <= 0n) return 1
      const scaledRatio = (baseWithRelics * 10000n) / baseWithoutRelics
      return Number(scaledRatio) / 10000
    })(),
    activeRelicCount: state.relicSlots.filter((s) => s.relicId !== null).length,
    primingMultiplier: computeGeneratorPrimingBonus(state),
    challengeMultiplier: getChallengeProductionMultiplier(state),
    activeAnomalyBooster: anomalyBooster,
    exponentBonus:
      getProductionExponentBonus(state) +
      getRelicExponentBonus(state) +
      getChallengeExponentBonus(state) +
      ec4AchExp,
    exponentSources: getExponentSources(state),
    topGenerators
  }
}

export function computeProductionShares(state: GameState): number[] {
  if (state.activeChallengeRestrictions?.productionOnlyWhileResearching) {
    const hasActiveResearch = state.activeResearchSlots.some(
      (s) => s.nodeId !== null && s.timerRemaining > 0
    )
    if (!hasActiveResearch) return Array(20).fill(0)
  }

  const prestigeDisabled =
    state.activeChallengeRestrictions?.prestigeUpgradesDisabled
  const milestoneSharpenerLevel = prestigeDisabled
    ? 0
    : state.arUpgrades.milestone_sharpener
  const superrecursiveCoreLevel = getSuperrecursiveCoreLevel(state)
  const sc8Tiers = state.challengeRecords['SC8']?.completedTiers ?? 0

  const outputs = new Array<bigint>(20)
  let totalMilli = 0n

  for (let i = 0; i < 20; i++) {
    const techMult = computeTechMultiplierForGenerator(i, state)
    const out = computeGeneratorOutput(
      i,
      state,
      techMult,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel,
      sc8Tiers
    )
    outputs[i] = out
    totalMilli += out
  }

  if (totalMilli <= 0n) return Array(20).fill(0)

  return outputs.map(
    (out) => Math.round(Number((out * 10000n) / totalMilli)) / 100
  )
}
