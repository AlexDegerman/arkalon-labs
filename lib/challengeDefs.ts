// Challenge balance parameters and restriction builders
// UI display metadata lives in constants/challenges.ts

import type { ChallengeRestrictions, GameState } from '@/types/game'

export type ReadinessBenchmark =
  | 'trivial'
  | 'prepared'
  | 'challenging'
  | 'brutal'
  | 'impossible'

export interface ReadinessInfo {
  benchmark: ReadinessBenchmark
  label: string
  cls: string
  hint: string
}

const HEAVY_CHALLENGE_SCALE: Record<string, bigint> = {
  AC4: 1_000n,
  AC6: 1_000n,
  EC1: 100_000n,
  EC4: 100_000n
}

export function getChallengeReadiness(
  targetRP: bigint,
  state: GameState,
  challengeId?: string
): ReadinessInfo {
  const peak = state.stats.peakLifetimePoints ?? state.lifetimePoints
  if (targetRP <= 0n) {
    return {
      benchmark: 'trivial',
      label: 'READY',
      cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      hint: 'Target already surpassed.'
    }
  }

  const penaltyScale = challengeId
    ? (HEAVY_CHALLENGE_SCALE[challengeId] ?? 1n)
    : 1n
  const effectiveBenchmark = targetRP * penaltyScale

  if (peak >= effectiveBenchmark * 10n) {
    return {
      benchmark: 'trivial',
      label: 'TRIVIAL',
      cls: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
      hint: 'Facility capacity vastly exceeds target.'
    }
  }
  if (peak >= effectiveBenchmark) {
    return {
      benchmark: 'prepared',
      label: 'READY',
      cls: 'text-cyan-300 border-cyan-400/40 bg-cyan-400/10',
      hint:
        penaltyScale > 1n
          ? 'Peak RP comfortably covers challenge restrictions.'
          : 'Peak lifetime RP has reached this target before.'
    }
  }
  if (peak >= effectiveBenchmark / 100n) {
    return {
      benchmark: 'challenging',
      label: 'DOABLE',
      cls: 'text-amber-300 border-amber-400/40 bg-amber-400/10',
      hint: 'Target is moderately above peak RP. Attainable with focus.'
    }
  }
  if (peak >= effectiveBenchmark / 100000n) {
    return {
      benchmark: 'brutal',
      label: 'BRUTAL',
      cls: 'text-orange-400 border-orange-500/40 bg-orange-500/10',
      hint: 'Target requires extensive progression or prestige perks.'
    }
  }
  return {
    benchmark: 'impossible',
    label: 'IMPOSSIBLE',
    cls: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    hint: 'Extreme gap. Further recalibrations strongly advised.'
  }
}

export interface ChallengeBalanceDef {
  id: string
  // Lifetime RP targets for each tier (index 0 = tier 1)
  tierTargets: bigint[]
  // Permanent reward multipliers per tier completion
  buildRestrictions: () => ChallengeRestrictions
}

const NO_RESTRICTIONS: ChallengeRestrictions = {
  maxGeneratorTier: null,
  maxGeneratorQuantity: null,
  techMatrixDisabled: false,
  modulesDisabled: false,
  anomaliesDisabled: false,
  excavationDisabled: false,
  generatorCostMultiplier: 1,
  researchTimerMultiplier: 1,
  milestonesDisabled: false,
  energyBranchLocked: false,
  arkalonBranchLocked: false,
  singleBranchOnly: false,
  singleResearchSlot: false,
  relicsDisabled: false,
  generatorProductionMultiplier: 1,
  moduleLevelCapOverride: null,
  onlyGeneratorType: null,
  autoPrestigeIntervalSeconds: null,
  anomalySpawnIntervalSeconds: null,
  anomalyDurationOverrideSeconds: null,
  noResearchTimerTick: false,
  noBaseGeneratorOutput: false,
  productionOnlyWhileResearching: false,
  prestigeUpgradesDisabled: false
}

// Tier target scaling: each tier multiplies the previous target by ~10x
function scaledTargets(base: bigint, tiers: number): bigint[] {
  return Array.from({ length: tiers }, (_, i) => base * 10n ** BigInt(i))
}

export const CHALLENGE_BALANCE: ChallengeBalanceDef[] = [
  {
    id: 'SC1',
    tierTargets: scaledTargets(1_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, maxGeneratorTier: 3 })
  },
  {
    id: 'SC2',
    tierTargets: scaledTargets(5_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, techMatrixDisabled: true })
  },
  {
    id: 'SC3',
    tierTargets: scaledTargets(10_000_000n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      arkalonBranchLocked: true
    })
  },
  {
    id: 'SC4',
    tierTargets: scaledTargets(20_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, modulesDisabled: true })
  },
  {
    id: 'SC5',
    tierTargets: scaledTargets(50_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, anomaliesDisabled: true })
  },
  {
    id: 'SC6',
    tierTargets: scaledTargets(50_000_000n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      maxGeneratorQuantity: 30n
    })
  },
  {
    id: 'SC7',
    tierTargets: scaledTargets(100_000_000n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      singleBranchOnly: true
    })
  },
  {
    id: 'SC8',
    tierTargets: scaledTargets(200_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, milestonesDisabled: true })
  },
  {
    id: 'SC9',
    tierTargets: scaledTargets(500_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, energyBranchLocked: true })
  },
  {
    id: 'SC10',
    tierTargets: scaledTargets(1_000_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, singleResearchSlot: true })
  },
  {
    id: 'SC11',
    tierTargets: scaledTargets(2_000_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, relicsDisabled: true })
  },
  {
    id: 'SC12',
    tierTargets: scaledTargets(1_000_000_000n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      maxGeneratorTier: 3,
      techMatrixDisabled: true,
      anomaliesDisabled: true
    })
  },
  {
    id: 'AC1',
    tierTargets: scaledTargets(10n ** 15n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      productionOnlyWhileResearching: true
    })
  },
  {
    id: 'AC2',
    tierTargets: scaledTargets(10n ** 12n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      prestigeUpgradesDisabled: true
    })
  },
  {
    id: 'AC3',
    tierTargets: scaledTargets(10n ** 10n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, noResearchTimerTick: true })
  },
  {
    id: 'AC4',
    tierTargets: scaledTargets(10n ** 18n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, maxGeneratorTier: 5 })
  },
  {
    id: 'AC5',
    tierTargets: scaledTargets(10n ** 20n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      generatorCostMultiplier: 10
    })
  },
  {
    id: 'AC6',
    tierTargets: scaledTargets(10n ** 16n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      noBaseGeneratorOutput: true
    })
  },
  {
    id: 'AC7',
    tierTargets: scaledTargets(10n ** 14n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      anomalySpawnIntervalSeconds: 60,
      anomalyDurationOverrideSeconds: 10
    })
  },
  {
    id: 'AC8',
    tierTargets: [10n ** 22n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      productionOnlyWhileResearching: true,
      noResearchTimerTick: true
    })
  },
  {
    id: 'EC1',
    tierTargets: scaledTargets(10n ** 100n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      maxGeneratorTier: 10,
      modulesDisabled: true,
      prestigeUpgradesDisabled: true
    })
  },
  {
    id: 'EC2',
    tierTargets: [10n ** 120n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      onlyGeneratorType: 0 // starts at generator 0 switching handled in UI
    })
  },
  {
    id: 'EC3',
    tierTargets: [10n ** 140n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      autoPrestigeIntervalSeconds: 300 // every 5 minutes
    })
  },
  {
    id: 'EC4',
    tierTargets: [10n ** 155n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      techMatrixDisabled: true,
      modulesDisabled: true,
      relicsDisabled: true,
      anomaliesDisabled: true,
      excavationDisabled: true
    })
  }
]

export const CHALLENGE_BALANCE_MAP: Record<string, ChallengeBalanceDef> =
  Object.fromEntries(CHALLENGE_BALANCE.map((c) => [c.id, c]))

// Returns the RP target for a given challenge and tier (1-based)
export function getChallengeTarget(challengeId: string, tier: number): bigint {
  const def = CHALLENGE_BALANCE_MAP[challengeId]
  if (!def) return 0n
  const idx = Math.min(tier - 1, def.tierTargets.length - 1)
  return def.tierTargets[idx]
}

// Returns the cumulative production multiplier from all completed challenge rewards
// Called from productionEngine.ts
export function getChallengeProductionMultiplier(state: {
  challengeRecords: Record<string, { completedTiers: number }>
}): number {
  let multiplier = 1

  // SC1: +5% global RP per tier completed (plus 2x/tier to Tiers 1-3 in engine)
  const sc1Tiers = state.challengeRecords['SC1']?.completedTiers ?? 0
  if (sc1Tiers > 0) multiplier *= 1 + 0.05 * sc1Tiers

  // SC2: +10% global production per tier completed
  const sc2Tiers = state.challengeRecords['SC2']?.completedTiers ?? 0
  if (sc2Tiers > 0) multiplier *= 1 + 0.1 * sc2Tiers

  // SC12: +3% to ALL permanent multipliers per tier
  const sc12Tiers = state.challengeRecords['SC12']?.completedTiers ?? 0
  if (sc12Tiers > 0) multiplier *= 1 + 0.03 * sc12Tiers

  // EC1: 1.25x compounding global RP per tier completed
  const ec1Tiers = state.challengeRecords['EC1']?.completedTiers ?? 0
  if (ec1Tiers > 0) multiplier *= Math.pow(1.25, ec1Tiers)

  // +2% per unique Extreme Challenge completed
  const ecCompleted = ['EC1', 'EC2', 'EC3', 'EC4'].filter(
    (id) => (state.challengeRecords[id]?.completedTiers ?? 0) > 0
  ).length
  if (ecCompleted > 0) multiplier *= 1 + 0.02 * ecCompleted

  return multiplier
}

// Returns additional production exponent bonus from challenge rewards
export function getChallengeExponentBonus(state: {
  challengeRecords: Record<string, { completedTiers: number }>
}): number {
  let bonus = 0

  // AC1: +0.5% per tier (as exponent)
  const ac1Tiers = state.challengeRecords['AC1']?.completedTiers ?? 0
  bonus += 0.005 * ac1Tiers

  // AC8: +0.1 exponent on completion
  const ac8Done = (state.challengeRecords['AC8']?.completedTiers ?? 0) > 0
  if (ac8Done) bonus += 0.1

  // EC1: +0.01 exponent per tier completed
  const ec1Tiers = state.challengeRecords['EC1']?.completedTiers ?? 0
  if (ec1Tiers > 0) bonus += 0.01 * ec1Tiers

  // EC2: +0.05 master exponent bonus on completion
  const ec2Done = (state.challengeRecords['EC2']?.completedTiers ?? 0) > 0
  if (ec2Done) bonus += 0.05

  return bonus
}

// Returns true if Challenge Accelerant applies to the given challenge
export function isChallengeAccelerantActive(
  challengeId: string,
  state: Pick<GameState, 'arUpgrades' | 'activeChallengeRestrictions'>
): boolean {
  if ((state.arUpgrades.challenge_accelerant ?? 0) <= 0) return false
  if (state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
    return false
  }
  if (
    CHALLENGE_BALANCE_MAP[challengeId]?.buildRestrictions()
      .prestigeUpgradesDisabled
  ) {
    return false
  }
  return true
}

// Applies challenge-accelerant reduction (25% if purchased and active)
export function getEffectiveTarget(
  challengeId: string,
  tier: number,
  hasAccelerant: boolean
): bigint {
  const base = getChallengeTarget(challengeId, tier)
  if (!hasAccelerant) return base
  return (base * 3n) / 4n
}