// Challenge balance parameters and restriction builders
// UI display metadata lives in constants/challenges.ts

import type { ChallengeRestrictions } from '@/types/game'

export interface ChallengeBalanceDef {
  id: string
  // Lifetime RP targets for each tier (index 0 = tier 1)
  tierTargets: bigint[]
  // Permanent reward multipliers per tier completion
  buildRestrictions: () => ChallengeRestrictions
}

const NO_RESTRICTIONS: ChallengeRestrictions = {
  maxGeneratorTier: null,
  techMatrixDisabled: false,
  arkalonClickDisabled: false,
  modulesDisabled: false,
  anomaliesDisabled: false,
  generatorCostMultiplier: 1,
  researchTimerMultiplier: 1,
  milestonesDisabled: false,
  energyBranchLocked: false,
  singleResearchSlot: false,
  relicsDisabled: false,
  generatorProductionMultiplier: 1,
  moduleLevelCapOverride: null,
  onlyGeneratorType: null,
  autoPrestigeIntervalSeconds: null,
  noResearchTimerTick: false,
  noBaseGeneratorOutput: false
}

// Tier target scaling: each tier multiplies the previous target by ~10x
function scaledTargets(base: bigint, tiers: number): bigint[] {
  return Array.from({ length: tiers }, (_, i) => base * 10n ** BigInt(i))
}

export const CHALLENGE_BALANCE: ChallengeBalanceDef[] = [
  {
    id: 'SC1',
    tierTargets: scaledTargets(1_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, maxGeneratorTier: 3 })
  },
  {
    id: 'SC2',
    tierTargets: scaledTargets(5_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, techMatrixDisabled: true })
  },
  {
    id: 'SC3',
    tierTargets: scaledTargets(10_000_000n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      arkalonClickDisabled: true
    })
  },
  {
    id: 'SC4',
    tierTargets: scaledTargets(20_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, modulesDisabled: true })
  },
  {
    id: 'SC5',
    tierTargets: scaledTargets(50_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, anomaliesDisabled: true })
  },
  {
    id: 'SC6',
    tierTargets: scaledTargets(100_000_000n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      generatorCostMultiplier: 3
    })
  },
  {
    id: 'SC7',
    tierTargets: scaledTargets(200_000_000n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      researchTimerMultiplier: 5
    })
  },
  {
    id: 'SC8',
    tierTargets: scaledTargets(500_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, milestonesDisabled: true })
  },
  {
    id: 'SC9',
    tierTargets: scaledTargets(1_000_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, energyBranchLocked: true })
  },
  {
    id: 'SC10',
    tierTargets: scaledTargets(2_000_000_000n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, singleResearchSlot: true })
  },
  {
    id: 'SC11',
    tierTargets: scaledTargets(5_000_000_000n, 3),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, relicsDisabled: true })
  },
  {
    id: 'SC12',
    tierTargets: scaledTargets(1_000_000_000n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      maxGeneratorTier: 3,
      techMatrixDisabled: true,
      anomaliesDisabled: true
    })
  },
  {
    id: 'AC1',
    tierTargets: scaledTargets(10n ** 15n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      generatorProductionMultiplier: 0.1
    })
  },
  {
    id: 'AC2',
    tierTargets: scaledTargets(10n ** 12n, 5),
    // AR upgrades disabled handled in buyPrestigeUpgrade check
    buildRestrictions: () => ({ ...NO_RESTRICTIONS })
  },
  {
    id: 'AC3',
    tierTargets: scaledTargets(10n ** 10n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, noResearchTimerTick: true })
  },
  {
    id: 'AC4',
    tierTargets: scaledTargets(10n ** 18n, 5),
    buildRestrictions: () => ({ ...NO_RESTRICTIONS, maxGeneratorTier: 5 })
  },
  {
    id: 'AC5',
    tierTargets: scaledTargets(10n ** 20n, 3),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      generatorCostMultiplier: 10,
      moduleLevelCapOverride: 10 // doubled from 5
    })
  },
  {
    id: 'AC6',
    tierTargets: scaledTargets(10n ** 16n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      noBaseGeneratorOutput: true
    })
  },
  {
    id: 'AC7',
    tierTargets: scaledTargets(10n ** 14n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      autoPrestigeIntervalSeconds: 60
    })
  },
  {
    id: 'AC8',
    tierTargets: [10n ** 22n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      generatorProductionMultiplier: 0.1,
      noResearchTimerTick: true
    })
  },
  {
    id: 'EC1',
    tierTargets: scaledTargets(10n ** 100n, 5),
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      maxGeneratorTier: 10,
      modulesDisabled: true
    })
  },
  {
    id: 'EC2',
    tierTargets: [10n ** 120n],
    buildRestrictions: () => ({
      ...NO_RESTRICTIONS,
      onlyGeneratorType: 0 // starts at generator 0; switching handled in UI
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
      arkalonClickDisabled: false // clicks still work
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

// Returns true if the player has met the target for the current challenge tier
export function hasMetChallengeTarget(
  challengeId: string,
  currentTier: number,
  lifetimePoints: bigint
): boolean {
  const target = getChallengeTarget(challengeId, currentTier + 1)
  return lifetimePoints >= target
}

// Returns the cumulative production multiplier from all completed challenge rewards
// Called from productionEngine.ts
export function getChallengeProductionMultiplier(state: {
  challengeRecords: Record<string, { completedTiers: number }>;
}): number {
  let multiplier = 1;

  // SC2: +3% global production per tier completed
  const sc2Tiers = state.challengeRecords['SC2']?.completedTiers ?? 0;
  if (sc2Tiers > 0) multiplier *= (1 + 0.03 * sc2Tiers);

  // SC12: +1% to ALL permanent multipliers per tier
  const sc12Tiers = state.challengeRecords['SC12']?.completedTiers ?? 0;
  if (sc12Tiers > 0) multiplier *= (1 + 0.01 * sc12Tiers);

  // AC1: +0.5% production exponent per tier (handled in exponent bonus)
  // AC8: +0.1 production exponent (handled in exponent bonus)

  // EC1: +2% per completed EC to ALL production
  const ecCompleted = ['EC1', 'EC2', 'EC3', 'EC4'].filter(
    (id) => (state.challengeRecords[id]?.completedTiers ?? 0) > 0
  ).length;
  if (ecCompleted > 0) multiplier *= (1 + 0.02 * ecCompleted);

  return multiplier;
}

// Returns additional production exponent bonus from challenge rewards
export function getChallengeExponentBonus(state: {
  challengeRecords: Record<string, { completedTiers: number }>;
}): number {
  let bonus = 0;

  // AC1: +0.5% per tier (as exponent)
  const ac1Tiers = state.challengeRecords['AC1']?.completedTiers ?? 0;
  bonus += 0.005 * ac1Tiers;

  // AC8: +0.1 exponent on completion
  const ac8Done = (state.challengeRecords['AC8']?.completedTiers ?? 0) > 0;
  if (ac8Done) bonus += 0.1;

  return bonus;
}

// Applies challenge-accelerant reduction (25% if purchased)
export function getEffectiveTarget(
  tier: number,
  hasAccelerant: boolean
): bigint {
  const base = getChallengeTarget(challengeId, tier)
  if (!hasAccelerant) return base
  return BigInt(Math.floor(Number(base) * 0.75))
}
