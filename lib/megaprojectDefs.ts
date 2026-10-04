import type { MegaprojectId, GameState } from '@/types/game'

export interface MegaprojectDefinition {
  id: MegaprojectId
  name: string
  description: string
  constructionCost: bigint
  // Requirements checked before activation
  requiresGeneratorIndex?: number
  requiresGeneratorCount?: bigint
  requiresGeneratorIndex2?: number
  requiresGeneratorCount2?: bigint
  requiresLifetimeRP?: bigint
  requiresAR?: number
  requiresMegaproject?: MegaprojectId // must be completed first
  reward: string
  // What the megaproject unlocks or provides
  rewardType:
    | 'unlock_tier2_prestige'
    | 'arkalon_auto_research'
    | 'unlock_tier3_prestige_and_exponent'
}

export const MEGAPROJECTS: MegaprojectDefinition[] = [
  {
    id: 'chronos_array',
    name: 'Chronos Array',
    description:
      'A temporal lattice that stabilizes local spacetime for Timeline Severance operations.',
    constructionCost: 10n ** 27n,
    requiresGeneratorIndex: 2, // Quantum Computers
    requiresGeneratorCount: 100n,
    requiresGeneratorIndex2: 4, // Reality Engines
    requiresGeneratorCount2: 50n,
    requiresLifetimeRP: 10n ** 24n,
    reward: 'Unlocks Tier II prestige. Permanent 1.5x global multiplier.',
    rewardType: 'unlock_tier2_prestige'
  },
  {
    id: 'arkalon_matrix_mirror',
    name: 'Arkalon Matrix Mirror',
    description:
      'A reflective dimensional construct that interfaces with Arkalon to accelerate research.',
    constructionCost: 10n ** 48n,
    requiresAR: 200,
    requiresGeneratorIndex: 7, // Infinite Simulations
    requiresGeneratorCount: 100n,
    requiresMegaproject: 'chronos_array',
    requiresLifetimeRP: 10n ** 45n,
    reward:
      'Arkalon auto-completes Tier 1-2 research nodes during prestige runs.',
    rewardType: 'arkalon_auto_research'
  },
  {
    id: 'omega_singularity_sphere',
    name: 'Omega Singularity Sphere',
    description:
      'The ultimate construct: a stable singularity enabling Singular Synthesis.',
    constructionCost: 10n ** 84n,
    requiresGeneratorIndex: 14, // Stellar Harvesters
    requiresGeneratorCount: 50n,
    requiresGeneratorIndex2: 15, // Galactic Engines
    requiresGeneratorCount2: 25n,
    requiresMegaproject: 'arkalon_matrix_mirror',
    requiresLifetimeRP: 10n ** 80n,
    reward: 'Unlocks Tier III prestige. +0.25 to master production exponent.',
    rewardType: 'unlock_tier3_prestige_and_exponent'
  }
]

export const MEGAPROJECT_MAP: Record<MegaprojectId, MegaprojectDefinition> =
  Object.fromEntries(MEGAPROJECTS.map((m) => [m.id, m])) as Record<
    MegaprojectId,
    MegaprojectDefinition
  >

// Returns true if the player meets all requirements to activate a megaproject
export function meetsMegaprojectRequirements(
  id: MegaprojectId,
  state: GameState
): boolean {
  const def = MEGAPROJECT_MAP[id]
  if (!def) return false

  // Already completed
  if (state.completedMegaprojects.includes(id)) return false

  // Another megaproject is active
  if (state.activeMegaprojectId && state.activeMegaprojectId !== id)
    return false

  // Prerequisite megaproject
  if (
    def.requiresMegaproject &&
    !state.completedMegaprojects.includes(def.requiresMegaproject)
  ) {
    return false
  }

  // Generator requirements
  if (
    def.requiresGeneratorIndex !== undefined &&
    def.requiresGeneratorCount !== undefined
  ) {
    if (
      (state.generators[def.requiresGeneratorIndex]?.quantity ?? 0n) <
      def.requiresGeneratorCount
    ) {
      return false
    }
  }

  if (
    def.requiresGeneratorIndex2 !== undefined &&
    def.requiresGeneratorCount2 !== undefined
  ) {
    if (
      (state.generators[def.requiresGeneratorIndex2]?.quantity ?? 0n) <
      def.requiresGeneratorCount2
    ) {
      return false
    }
  }

  // Lifetime RP requirement
  if (def.requiresLifetimeRP && state.lifetimePoints < def.requiresLifetimeRP) {
    return false
  }

  // AR requirement
  if (def.requiresAR && state.arkalonResonance < def.requiresAR) {
    return false
  }

  return true
}

// Returns the effective construction cost with CF Megaproject Efficiency discount
export function getEffectiveConstructionCost(
  id: MegaprojectId,
  state: GameState
): bigint {
  const def = MEGAPROJECT_MAP[id]
  if (!def) return 0n

  const efficiencyLevel = state.cfUpgrades.megaproject_efficiency
  if (efficiencyLevel === 0) return def.constructionCost

  const discount = 1 - 0.1 * efficiencyLevel
  return BigInt(Math.floor(Number(def.constructionCost) * discount))
}

// Applies the megaproject reward to the game state
// Returns a partial state update
export function applyMegaprojectReward(
  id: MegaprojectId,
  _state: GameState
): Record<string, unknown> {
  const def = MEGAPROJECT_MAP[id]
  if (!def) return {}

  // Rewards are reflected in canPrestigeTier2/3 checks and productionEngine
  // The completedMegaprojects array is the source of truth
  // Additional state changes per reward type:
  switch (def.rewardType) {
    case 'unlock_tier2_prestige':
      // canPrestigeTier2 already checks completedMegaprojects.includes('chronos_array')
      return {}

    case 'arkalon_auto_research':
      // Handled in research completion logic
      return {}

    case 'unlock_tier3_prestige_and_exponent':
      // +0.25 production exponent applied via getProductionExponentBonus
      // canPrestigeTier3 checks completedMegaprojects.includes('omega_singularity_sphere')
      return {}

    default:
      return {}
  }
}
