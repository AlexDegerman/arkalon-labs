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
    | 'infinite_dyson_swarm'
}

export interface MegaprojectPhasePerk {
  phase: 1 | 2 | 3 | 4
  percentThreshold: number
  title: string
  description: string
}

export const MEGAPROJECT_PHASE_PERKS: Record<MegaprojectId, MegaprojectPhasePerk[]> = {
  chronos_array: [
    {
      phase: 1,
      percentThreshold: 25,
      title: 'Chronal Dilation',
      description: '-10% Reality study time'
    },
    {
      phase: 2,
      percentThreshold: 50,
      title: 'Tachyon Condenser',
      description: '+15% Quantum & Reality output'
    },
    {
      phase: 3,
      percentThreshold: 75,
      title: 'Spacetime Siphon',
      description: '+20% Megaproject absorption'
    },
    {
      phase: 4,
      percentThreshold: 100,
      title: 'Array Operational',
      description: 'Enables Tier II (at 10^35 RP) + 1.5x RP'
    }
  ],
  arkalon_matrix_mirror: [
    {
      phase: 1,
      percentThreshold: 25,
      title: 'Optical Alignment',
      description: '+25% Arkalon Interface output'
    },
    {
      phase: 2,
      percentThreshold: 50,
      title: 'Quantum Reflection',
      description: '-10% all research node costs'
    },
    {
      phase: 3,
      percentThreshold: 75,
      title: 'Harmonic Synthesis',
      description: '+5s anomaly duration'
    },
    {
      phase: 4,
      percentThreshold: 100,
      title: 'Deep Sync Active',
      description: 'Auto-completes T1-T2 research on reset'
    }
  ],
  omega_singularity_sphere: [
    {
      phase: 1,
      percentThreshold: 25,
      title: 'Horizon Containment',
      description: '+50% Singularity Reactor output'
    },
    {
      phase: 2,
      percentThreshold: 50,
      title: 'Gravitational Lens',
      description: '+0.05 production exponent'
    },
    {
      phase: 3,
      percentThreshold: 75,
      title: 'Hawking Radiator',
      description: '+15% offline efficiency'
    },
    {
      phase: 4,
      percentThreshold: 100,
      title: 'Synthesis Operational',
      description: 'Enables Tier III (at 10^85 RP) + 0.25 Exp'
    }
  ],
  dyson_swarm: [
    {
      phase: 1,
      percentThreshold: 25,
      title: 'Array Launch',
      description: '+2.5% global RP output'
    },
    {
      phase: 2,
      percentThreshold: 50,
      title: 'Solar Concentrator',
      description: '+5% global RP output'
    },
    {
      phase: 3,
      percentThreshold: 75,
      title: 'Microwave Relay',
      description: '+7.5% global RP output'
    },
    {
      phase: 4,
      percentThreshold: 100,
      title: 'Array Integrated',
      description: 'Asymptotic Exp (+0.50 cap) & +10% Global RP'
    }
  ]
}

export const MEGAPROJECTS: MegaprojectDefinition[] = [
  {
    id: 'chronos_array',
    name: 'Chronos Array',
    description:
      'A temporal lattice that stabilizes local spacetime for Timeline Severance operations.',
    constructionCost: 5n * 10n ** 25n,
    requiresGeneratorIndex: 2, // Quantum Computers
    requiresGeneratorCount: 100n,
    requiresGeneratorIndex2: 4, // Reality Engines
    requiresGeneratorCount2: 50n,
    requiresLifetimeRP: 10n ** 24n,
    reward:
      'Enables Tier II Prestige (at 100.00 Decillion RP). Permanent 1.5x global multiplier.',
    rewardType: 'unlock_tier2_prestige'
  },
  {
    id: 'arkalon_matrix_mirror',
    name: 'Arkalon Matrix Mirror',
    description:
      'A reflective dimensional construct that interfaces with Arkalon to accelerate research.',
    constructionCost: 5n * 10n ** 46n,
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
    constructionCost: 10n ** 82n,
    requiresGeneratorIndex: 14, // Stellar Harvesters
    requiresGeneratorCount: 50n,
    requiresGeneratorIndex2: 15, // Galactic Engines
    requiresGeneratorCount2: 25n,
    requiresMegaproject: 'arkalon_matrix_mirror',
    requiresLifetimeRP: 10n ** 80n,
    reward:
      'Enables Tier III Prestige (at 10.00 Septenvigintillion RP). +0.25 to master production exponent.',
    rewardType: 'unlock_tier3_prestige_and_exponent'
  },
  {
    id: 'dyson_swarm',
    name: 'Arkalon Dyson Swarm',
    description:
      'An infinite modular megastructure deploying orbital star-siphons around galactic cores.',
    constructionCost: 10n ** 85n,
    requiresMegaproject: 'omega_singularity_sphere',
    requiresLifetimeRP: 10n ** 85n,
    reward:
      'Repeatable: +10% compounding Global RP per level & asymptotic Production Exponent (+0.02 base, +0.50 cap).',
    rewardType: 'infinite_dyson_swarm'
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

  // Megaproject construction is suspended during challenge runs
  if (state.activeChallengeId) return false

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

  let baseCost = def.constructionCost

  // Dyson Swarm costs scale by 10^5 per level
  if (id === 'dyson_swarm') {
    const level = state.dysonSwarmLevel ?? 0
    baseCost = 10n ** 85n * 10n ** BigInt(level * 5)
  }

  if (state.activeChallengeRestrictions?.prestigeUpgradesDisabled) {
    return baseCost
  }

  const efficiencyLevel = state.cfUpgrades.megaproject_efficiency
  if (efficiencyLevel === 0) return baseCost

  const discountNumerator = BigInt(10 - efficiencyLevel)
  return (baseCost * discountNumerator) / 10n
}

export function getMegaprojectPhase(
  id: MegaprojectId,
  state: GameState
): number {
  if (state.completedMegaprojects.includes(id) && id !== 'dyson_swarm') {
    return 4
  }
  if (state.activeMegaprojectId !== id) return 0

  const cost = getEffectiveConstructionCost(id, state)
  if (cost <= 0n) return 0

  const percent = Number((state.megaprojectRPAbsorbed * 100n) / cost)
  if (percent >= 100) return 4
  if (percent >= 75) return 3
  if (percent >= 50) return 2
  if (percent >= 25) return 1
  return 0
}