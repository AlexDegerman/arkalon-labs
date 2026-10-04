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
  getProductionExponentBonus
} from '@/lib/researchEffects'
import {
  getChallengeProductionMultiplier,
  getChallengeExponentBonus
} from '@/lib/challengeDefs'

// Precision scale factor: all intermediate multipliers are computed as
// integer numerators over SCALE_DENOM to avoid floating-point in the hot path
const SCALE_DENOM = 1_000_000n // 6 decimal places of precision

// Returns the effective milestone interval for a given generator index,
// accounting for Milestone Sharpener AR upgrade and Superrecursive Core relic
function getMilestoneInterval(
  generatorIndex: number,
  quantity: bigint,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number
): number {
  // Research Desk uses smaller intervals up to 50
  if (generatorIndex === 0 && quantity <= BigInt(RESEARCH_DESK_MILESTONE_CAP)) {
    return RESEARCH_DESK_MILESTONE_INTERVAL
  }

  let interval = MILESTONE_INTERVAL

  // Each Milestone Sharpener level reduces by 1 (floor MILESTONE_MIN_INTERVAL)
  interval -= milestoneSharpenerLevel * MILESTONE_SHARPENER_REDUCTION

  // Superrecursive Core relic reduces by 2 per level (floor SUPERRECURSIVE_CORE_MIN)
  interval -= superrecursiveCoreLevel * SUPERRECURSIVE_CORE_REDUCTION

  return Math.max(
    generatorIndex === 0
      ? RESEARCH_DESK_MILESTONE_INTERVAL
      : MILESTONE_MIN_INTERVAL,
    interval
  )
}

// Computes 2^(floor(quantity / interval)) milestone multiplier as a bigint ratio
// Returns [numerator, SCALE_DENOM] pair
function milestoneMultiplier(quantity: bigint, interval: number): bigint {
  const steps = Number(quantity) / interval
  const doublings = Math.floor(steps)
  if (doublings <= 0) return SCALE_DENOM
  // 2^doublings as bigint
  return SCALE_DENOM * (1n << BigInt(doublings))
}

// Computes the total output multiplier from generator modules
// Returns a float multiplier (applied via BigInt approximation)
function computeModuleEfficiencyMultiplier(
  generatorIndex: number,
  efficiencyLevel: number
): number {
  // Each level: output * 1.25^level
  return Math.pow(1.25, efficiencyLevel)
}

// Computes synergy bonus multiplier for a target generator
// Returns a float multiplicative bonus (1.0 + sum of bonuses)
// Synergy only applies when the source generator has synergyLevel >= 1
function computeSynergyMultiplier(
  targetIndex: number,
  state: GameState
): number {
  let bonus = 0;

  for (const synergy of MODULE_SYNERGIES) {
    if (synergy.targetIndex !== targetIndex) continue;

    const sourceGen = state.generators[synergy.sourceIndex];
    if (!sourceGen || sourceGen.synergyLevel === 0) continue;

    const sourceQty = Number(sourceGen.quantity);
    // bonusPerSourcePerLevel * synergyLevel * sourceQuantity
    let synergyBonus =
      sourceQty * synergy.bonusPerSourcePerLevel * sourceGen.synergyLevel;

    // Matter-Data Bridge relic (ID 13): +5% cross-generator synergy per level
    // Applied in Phase 9; stub here
    const bridgeLevel = 0;
    if (bridgeLevel > 0) {
      synergyBonus *= 1 + 0.05 * bridgeLevel;
    }

    bonus += synergyBonus;
  }

  return 1 + bonus;
}

// Returns a summary of active synergy bonuses affecting a generator
// Used by the modules UI tooltip
export function getSynergyBonusSummary(
  targetIndex: number,
  state: GameState
): Array<{ sourceName: string; bonus: number; synergyName: string }> {
  const { GENERATORS: gens } = require('@/constants/generators');
  const results: Array<{ sourceName: string; bonus: number; synergyName: string }> = [];

  for (const synergy of MODULE_SYNERGIES) {
    if (synergy.targetIndex !== targetIndex) continue;

    const sourceGen = state.generators[synergy.sourceIndex];
    if (!sourceGen || sourceGen.synergyLevel === 0) continue;

    const sourceQty = Number(sourceGen.quantity);
    const bonus =
      sourceQty * synergy.bonusPerSourcePerLevel * sourceGen.synergyLevel * 100;

    results.push({
      sourceName: gens[synergy.sourceIndex]?.name ?? `Gen ${synergy.sourceIndex}`,
      bonus,
      synergyName: synergy.name,
    });
  }

  return results;
}

// Computes the effective output of a single generator type in milliRP/sec * SCALE_DENOM
function computeGeneratorOutput(
  index: number,
  state: GameState,
  techMultiplier: number,
  milestoneSharpenerLevel: number,
  superrecursiveCoreLevel: number
): bigint {
  const gen = state.generators[index]
  if (!gen || gen.quantity === 0n) return 0n

  const def = GENERATORS[index]
  if (!def) return 0n

  // Challenge restriction: no base output
  if (state.activeChallengeRestrictions?.noBaseGeneratorOutput) {
    // Only relics provide production in this mode base = 0
    // Relic effects are applied as a separate pass (Phase 9)
    return 0n
  }

  // Challenge restriction: generator tier limit
  const maxTier = state.activeChallengeRestrictions?.maxGeneratorTier
  if (maxTier !== null && maxTier !== undefined && index >= maxTier) return 0n

  // Challenge restriction: only one generator type
  const onlyType = state.activeChallengeRestrictions?.onlyGeneratorType
  if (onlyType !== null && onlyType !== undefined && index !== onlyType)
    return 0n

  // Base output in milliRP/sec (stored as baseOutput / 1000 RP/sec)
  let baseOutput = def.baseOutput * gen.quantity

  // Milestone multiplier
  const interval = getMilestoneInterval(
    index,
    gen.quantity,
    milestoneSharpenerLevel,
    superrecursiveCoreLevel
  )
  const milestoneScale = milestoneMultiplier(gen.quantity, interval)
  // milestoneScale is already multiplied by SCALE_DENOM apply:
  baseOutput = (baseOutput * milestoneScale) / SCALE_DENOM

  // Efficiency module multiplier (float -> bigint approximation)
  if (gen.efficiencyLevel > 0) {
    const effMult = computeModuleEfficiencyMultiplier(
      index,
      gen.efficiencyLevel
    )
    baseOutput = BigInt(Math.round(Number(baseOutput) * effMult))
  }

  // Challenge: generator production multiplier (e.g. AC1 = 0.1)
  const prodMult =
    state.activeChallengeRestrictions?.generatorProductionMultiplier ?? 1
  if (prodMult !== 1) {
    baseOutput = BigInt(Math.round(Number(baseOutput) * prodMult))
  }

  // Synergy multiplier
  const synergyMult = computeSynergyMultiplier(index, state)
  if (synergyMult !== 1) {
    baseOutput = BigInt(Math.round(Number(baseOutput) * synergyMult))
  }

  // Tech multiplier (per-generator research effects)
  if (techMultiplier !== 1) {
    baseOutput = BigInt(Math.round(Number(baseOutput) * techMultiplier))
  }

  // Per-generator relic multiplier
  const { getRelicPerGeneratorMultiplier } = require('@/lib/relicEffects')
  const relicGenMult = getRelicPerGeneratorMultiplier(index, state)
  if (relicGenMult !== 1) {
    baseOutput = BigInt(Math.round(Number(baseOutput) * relicGenMult))
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

// Computes the AR production bonus
// Super-Symmetry: +10% per unspent AR held (capped at AR_PRODUCTION_CAP)
// PHI_AR_PRODUCTION: +10% per unspent AR (base)
function computeARBonus(state: GameState): number {
  const unspentAR = Math.min(state.arkalonResonance, AR_PRODUCTION_CAP)
  if (unspentAR === 0) return 1

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
  if (
    state.completedResearchNodes.includes('O7') &&
    totalPrestiges > 0
  ) {
    perARBonus *= 1 + 0.01 * totalPrestiges
  }

  let arBonus = 1 + perARBonus * unspentAR

  // Super-Symmetry: additional +10% per unspent AR
  if (state.arUpgrades.super_symmetry > 0) {
    arBonus += 0.1 * unspentAR
  }

  // E5: +0.5% per unspent AR
  if (state.completedResearchNodes.includes('E5')) {
    arBonus += 0.005 * unspentAR
  }

  // Resonance Amplification CF upgrade: +1.5x per CF held on AR yields
  // (affects prestige reward, not production multiplier directly)

  return arBonus
}

// Computes relic passive multipliers via relicEffects.ts
function computeRelicMultiplier(state: GameState): number {
  const { computeRelicProductionMultiplier } = require('@/lib/relicEffects');
  return computeRelicProductionMultiplier(state);
}

// Computes the Lambda prestige scaling factor from CF and OS upgrades
function computeLambda(state: GameState): number {
  let lambda = 1

  // Exponential Catalyst: +0.05 to production exponent per OS held
  if (state.osUpgrades.exponential_catalyst > 0) {
    lambda *= Math.pow(10, 0.05 * state.omniSpars)
  }

  // Dimensional Transcendence affects cost factors, not PPS directly

  return lambda
}

// Computes generator priming AR upgrade bonus
// +2% base output to all generators per level
function computeGeneratorPrimingBonus(state: GameState): number {
  return 1 + 0.02 * state.arUpgrades.generator_priming
}

// Master PPS recalculation
// Called only when inputs change - NEVER from the tick loop
// Returns total RP/sec as bigint (in whole RP, not milliRP)
export function recalculatePPS(state: GameState): bigint {
  const milestoneSharpenerLevel = state.arUpgrades.milestone_sharpener

  // Superrecursive Core relic level (relic ID 11, index 10)
  const superrecursiveCoreLevel =
    state.unlockedRelics.includes(11) &&
    state.relicSlots.some((s) => s.relicId === 11)
      ? (state.relicLevels[11] ?? 0)
      : 0

  const arBonus = computeARBonus(state)
  const relicMultiplier = computeRelicMultiplier(state)
  const lambda = computeLambda(state)
  const primingBonus = computeGeneratorPrimingBonus(state)

  let totalMilliRP = 0n

  for (let i = 0; i < 20; i++) {
    // Per-generator tech multiplier (replaces global multiplier)
    const techMult = computeTechMultiplierForGenerator(i, state)
    const output = computeGeneratorOutput(
      i,
      state,
      techMult,
      milestoneSharpenerLevel,
      superrecursiveCoreLevel
    )
    totalMilliRP += output
  }

  // Apply global multipliers as float then convert
  let totalFloat = Number(totalMilliRP)
  totalFloat *= arBonus
  totalFloat *= relicMultiplier
  totalFloat *= lambda
  totalFloat *= primingBonus

  // Challenge completion permanent multipliers
  const challengeMult = getChallengeProductionMultiplier(state)
  if (challengeMult !== 1) totalFloat *= challengeMult

  // Apply production exponent bonus: output ^ (1 + bonus)
  // Includes research node bonus and relic (Tachyon Prism) bonus
  const { getRelicExponentBonus } = require('@/lib/relicEffects')
  const exponentBonus =
    getProductionExponentBonus(state) +
    getRelicExponentBonus(state) +
    getChallengeExponentBonus(state)
  if (exponentBonus > 0 && totalFloat > 1) {
    totalFloat = Math.pow(totalFloat, 1 + exponentBonus)
  }

  // Convert from milliRP/sec to RP/sec (divide by 1000)
  const totalRP = BigInt(Math.floor(totalFloat / 1000))

  return totalRP
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

  const gen = state.generators[generatorIndex]
  let growthFactor = def.growthFactor

  // Cost reduction module: -0.015 per level
  if (gen.costReductionLevel > 0) {
    growthFactor = Math.max(1.01, growthFactor - 0.015 * gen.costReductionLevel)
  }

  // C9: -0.015 to cost scaling for generators above tier 10
  if (generatorIndex >= 10 && state.completedResearchNodes.includes('C9')) {
    growthFactor = Math.max(1.01, growthFactor - 0.015)
  }

  // E6: -0.02 to energy generator cost growth
  if (
    GENERATOR_CLASS[generatorIndex] === 'energy' &&
    state.completedResearchNodes.includes('E6')
  ) {
    growthFactor = Math.max(1.01, growthFactor - 0.02)
  }

  // OS Dimensional Transcendence: -0.05 to all (floor 1.01)
  if (state.osUpgrades.dimensional_transcendence > 0) {
    growthFactor = Math.max(1.01, growthFactor - 0.05)
  }

  // O5: 0.01% cost reduction per Arkalon Interface owned
  let costReductionMultiplier = 1
  if (state.completedResearchNodes.includes('O5')) {
    const aiCount = Number(state.generators[6].quantity)
    costReductionMultiplier = Math.max(0, 1 - 0.0001 * aiCount)
  }

  // Challenge cost multiplier
  const challengeMult =
    state.activeChallengeRestrictions?.generatorCostMultiplier ?? 1

  const cost = BigInt(
    Math.ceil(
      Number(def.baseCost) *
        Math.pow(growthFactor, Number(quantity)) *
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
