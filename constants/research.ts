// Static research node definitions - all 40 standard nodes and 4 infinite nodes

import type { ResearchBranch } from '@/types/game'

export interface ResearchNodeDefinition {
  id: string // e.g. 'C1', 'E3', 'O10'
  branch: ResearchBranch
  tier: number // 1-10 for standard nodes, 0 for infinite
  label: string
  cost: bigint
  studyTimeSeconds: number
  effectDescription: string
  prerequisiteId: string | null // previous tier node in same branch
  isInfinite: boolean
}

export const RESEARCH_NODES: ResearchNodeDefinition[] = [
  // Computation branch
  {
    id: 'C1',
    branch: 'computation',
    tier: 1,
    label: 'Asymptotic Compaction',
    cost: 100n,
    studyTimeSeconds: 5,
    effectDescription: 'Reduces Research Desk Growth Factor by 0.02.',
    prerequisiteId: null,
    isInfinite: false
  },
  {
    id: 'C2',
    branch: 'computation',
    tier: 2,
    label: 'Algorithmic Superposition',
    cost: 5_000n,
    studyTimeSeconds: 60,
    effectDescription: 'Reduces all research study times by 5%.',
    prerequisiteId: 'C1',
    isInfinite: false
  },
  {
    id: 'C3',
    branch: 'computation',
    tier: 3,
    label: 'Godel Boundary Decoupling',
    cost: 7_500_000_000_000n,
    studyTimeSeconds: 1800,
    effectDescription:
      '+10% base output to computational buildings per completed research node.',
    prerequisiteId: 'C2',
    isInfinite: false
  },
  {
    id: 'C4',
    branch: 'computation',
    tier: 4,
    label: 'Superrecursive Logic Gates',
    cost: 1_200_000_000_000_000_000_000_000_000_000_000_000n,
    studyTimeSeconds: 3600,
    effectDescription:
      'Neural Cores gain +5% production per Server Cluster owned.',
    prerequisiteId: 'C3',
    isInfinite: false
  },
  {
    id: 'C5',
    branch: 'computation',
    tier: 5,
    label: 'Hilbert-Space Addressing',
    cost: 3n * 10n ** 54n,
    studyTimeSeconds: 7200,
    effectDescription: '+0.1 to global production exponent multiplier.',
    prerequisiteId: 'C4',
    isInfinite: false
  },
  {
    id: 'C6',
    branch: 'computation',
    tier: 6,
    label: 'Trans-Finite Recursion',
    cost: 85n * 10n ** 74n,
    studyTimeSeconds: 14400,
    effectDescription:
      'Passively generates 0.1% of active anomaly max reward per second when idle.',
    prerequisiteId: 'C5',
    isInfinite: false
  },
  {
    id: 'C7',
    branch: 'computation',
    tier: 7,
    label: 'Non-Turing Architecture',
    cost: 4n * 10n ** 98n,
    studyTimeSeconds: 28800,
    effectDescription:
      'Compounds all computational building multipliers by 1.15x per level.',
    prerequisiteId: 'C6',
    isInfinite: false
  },
  {
    id: 'C8',
    branch: 'computation',
    tier: 8,
    label: 'The Omega Algorithm',
    cost: 9n * 10n ** 120n,
    studyTimeSeconds: 86400,
    effectDescription:
      'Computation-class generators multiplied by ln(lifetime RP).',
    prerequisiteId: 'C7',
    isInfinite: false
  },
  {
    id: 'C9',
    branch: 'computation',
    tier: 9,
    label: 'Trans-Turing Synapse',
    cost: 10n ** 130n,
    studyTimeSeconds: 172800,
    effectDescription:
      'Reduces cost scaling of generators above Tier 10 by 0.015.',
    prerequisiteId: 'C8',
    isInfinite: false
  },
  {
    id: 'C10',
    branch: 'computation',
    tier: 10,
    label: 'Godel Transcendence',
    cost: 10n ** 145n,
    studyTimeSeconds: 345600,
    effectDescription: '+1% output to all generators per completed tech node.',
    prerequisiteId: 'C9',
    isInfinite: false
  },

  // Energy branch
  {
    id: 'E1',
    branch: 'energy',
    tier: 1,
    label: 'Kinetic Recycling',
    cost: 300n,
    studyTimeSeconds: 10,
    effectDescription: 'Offline efficiency set to 75%.',
    prerequisiteId: null,
    isInfinite: false
  },
  {
    id: 'E2',
    branch: 'energy',
    tier: 2,
    label: 'Entropy Harvesting',
    cost: 15_000n,
    studyTimeSeconds: 120,
    effectDescription: 'Offline efficiency set to 100%.',
    prerequisiteId: 'E1',
    isInfinite: false
  },
  {
    id: 'E3',
    branch: 'energy',
    tier: 3,
    label: 'Singularity Integration',
    cost: 4_500_000_000_000_000n,
    studyTimeSeconds: 2700,
    effectDescription:
      'Singularity Reactors apply +0.25% to all lower-tier generators per Reactor owned.',
    prerequisiteId: 'E2',
    isInfinite: false
  },
  {
    id: 'E4',
    branch: 'energy',
    tier: 4,
    label: 'Zero-Point Inflation',
    cost: 9n * 10n ** 40n,
    studyTimeSeconds: 7200,
    effectDescription: '5.0x multiplier to all energy-generation systems.',
    prerequisiteId: 'E3',
    isInfinite: false
  },
  {
    id: 'E5',
    branch: 'energy',
    tier: 5,
    label: 'Vacuum Polarisers',
    cost: 18n * 10n ** 61n,
    studyTimeSeconds: 14400,
    effectDescription:
      '+0.5% global production per unspent AR (up to 500 AR cap).',
    prerequisiteId: 'E4',
    isInfinite: false
  },
  {
    id: 'E6',
    branch: 'energy',
    tier: 6,
    label: 'Plasma Lattice Confinement',
    cost: 22n * 10n ** 83n,
    studyTimeSeconds: 28800,
    effectDescription: 'Reduces energy-generator cost growth factors by 0.02.',
    prerequisiteId: 'E5',
    isInfinite: false
  },
  {
    id: 'E7',
    branch: 'energy',
    tier: 7,
    label: 'Chronal Disruption Fuses',
    cost: 71n * 10n ** 107n,
    studyTimeSeconds: 57600,
    effectDescription:
      'Active anomalies last 2x longer and double base payout.',
    prerequisiteId: 'E6',
    isInfinite: false
  },
  {
    id: 'E8',
    branch: 'energy',
    tier: 8,
    label: 'Infinite Entropic Sink',
    cost: 15n * 10n ** 125n,
    studyTimeSeconds: 115200,
    effectDescription:
      'Energy-class structures gain exponential yield scaling based on lifetime energy generated.',
    prerequisiteId: 'E7',
    isInfinite: false
  },
  {
    id: 'E9',
    branch: 'energy',
    tier: 9,
    label: 'Primordial Inflation Loops',
    cost: 10n ** 130n,
    studyTimeSeconds: 172800,
    effectDescription:
      'Stellar Harvesters and Galactic Engines operate at 1.5x efficiency.',
    prerequisiteId: 'E8',
    isInfinite: false
  },
  {
    id: 'E10',
    branch: 'energy',
    tier: 10,
    label: 'Absolute Entropic Death',
    cost: 10n ** 145n,
    studyTimeSeconds: 345600,
    effectDescription: 'Energy-class generators get 10x point generation.',
    prerequisiteId: 'E9',
    isInfinite: false
  },

  // Reality branch
  {
    id: 'R1',
    branch: 'reality',
    tier: 1,
    label: 'Spatial Compactness',
    cost: 800n,
    studyTimeSeconds: 15,
    effectDescription:
      'Lowers unlock threshold for Server Cluster and Quantum Computer by 15%.',
    prerequisiteId: null,
    isInfinite: false
  },
  {
    id: 'R2',
    branch: 'reality',
    tier: 2,
    label: 'Sub-Space Tunneling',
    cost: 40_000n,
    studyTimeSeconds: 180,
    effectDescription: 'Research study durations permanently reduced by 15%.',
    prerequisiteId: 'R1',
    isInfinite: false
  },
  {
    id: 'R3',
    branch: 'reality',
    tier: 3,
    label: 'Metric Manipulation',
    cost: 9_100_000_000_000_000_000n,
    studyTimeSeconds: 3600,
    effectDescription:
      'Allows two simultaneous research projects from different branches.',
    prerequisiteId: 'R2',
    isInfinite: false
  },
  {
    id: 'R4',
    branch: 'reality',
    tier: 4,
    label: 'Localized Chronology Erasers',
    cost: 5n * 10n ** 48n,
    studyTimeSeconds: 10800,
    effectDescription:
      'Removes 10 minutes from running timers when anomaly is stabilized.',
    prerequisiteId: 'R3',
    isInfinite: false
  },
  {
    id: 'R5',
    branch: 'reality',
    tier: 5,
    label: 'Dimensional Permeability',
    cost: 13n * 10n ** 69n,
    studyTimeSeconds: 21600,
    effectDescription:
      '+10% passive multiplier retention across prestige resets.',
    prerequisiteId: 'R4',
    isInfinite: false
  },
  {
    id: 'R6',
    branch: 'reality',
    tier: 6,
    label: 'Matter-Data Coexistence',
    cost: 66n * 10n ** 91n,
    studyTimeSeconds: 43200,
    effectDescription:
      '+1% production per physical generator currently owned across all classes.',
    prerequisiteId: 'R5',
    isInfinite: false
  },
  {
    id: 'R7',
    branch: 'reality',
    tier: 7,
    label: 'Anthropic Fine-Tuning',
    cost: 8n * 10n ** 114n,
    studyTimeSeconds: 86400,
    effectDescription:
      '10x reality engine speed for 5 minutes after prestige reset.',
    prerequisiteId: 'R6',
    isInfinite: false
  },
  {
    id: 'R8',
    branch: 'reality',
    tier: 8,
    label: 'Timeline Collapse Protocol',
    cost: 33n * 10n ** 127n,
    studyTimeSeconds: 172800,
    effectDescription:
      'Amplifies prestige currency exponentially based on proximity to Trequinquagintillion.',
    prerequisiteId: 'R7',
    isInfinite: false
  },
  {
    id: 'R9',
    branch: 'reality',
    tier: 9,
    label: 'Multi-Dimensional Manifold',
    cost: 10n ** 130n,
    studyTimeSeconds: 172800,
    effectDescription:
      'Increases max offline progression from 12 hours to 24 hours.',
    prerequisiteId: 'R8',
    isInfinite: false
  },
  {
    id: 'R10',
    branch: 'reality',
    tier: 10,
    label: 'Timeline Collapser Core',
    cost: 10n ** 145n,
    studyTimeSeconds: 345600,
    effectDescription: '+0.5 to master global production exponent.',
    prerequisiteId: 'R9',
    isInfinite: false
  },

  // Arkalon branch
  {
    id: 'O1',
    branch: 'arkalon',
    tier: 1,
    label: 'Synaptic Resonance',
    cost: 2_000n,
    studyTimeSeconds: 30,
    effectDescription:
      'Unlocks Arkalon telemetry, Relic tab, awards Relic 1, unlocks Interactive Arkalon click.',
    prerequisiteId: null,
    isInfinite: false
  },
  {
    id: 'O2',
    branch: 'arkalon',
    tier: 2,
    label: 'Sub-Vocal Telemetry',
    cost: 100_000n,
    studyTimeSeconds: 300,
    effectDescription:
      '5% research speed boost when Arkalon sphere is clicked.',
    prerequisiteId: 'O1',
    isInfinite: false
  },
  {
    id: 'O3',
    branch: 'arkalon',
    tier: 3,
    label: 'Predictive Synchronization',
    cost: 2n * 10n ** 21n,
    studyTimeSeconds: 5400,
    effectDescription:
      'Arkalon predicts anomaly arrivals with countdown timer.',
    prerequisiteId: 'O2',
    isInfinite: false
  },
  {
    id: 'O4',
    branch: 'arkalon',
    tier: 4,
    label: 'Forbidden Protocol Theta',
    cost: 88n * 10n ** 51n,
    studyTimeSeconds: 10800,
    effectDescription: 'Arkalon Interfaces base yield increased by 300%.',
    prerequisiteId: 'O3',
    isInfinite: false
  },
  {
    id: 'O5',
    branch: 'arkalon',
    tier: 5,
    label: 'Synapse Replication',
    cost: 41n * 10n ** 73n,
    studyTimeSeconds: 21600,
    effectDescription:
      'Arkalon Interface count provides 0.01% cost reduction per building for all structures.',
    prerequisiteId: 'O4',
    isInfinite: false
  },
  {
    id: 'O6',
    branch: 'arkalon',
    tier: 6,
    label: 'Non-Causal Intercepts',
    cost: 39n * 10n ** 95n,
    studyTimeSeconds: 43200,
    effectDescription: 'Bypass one prerequisite tech choice per reset run.',
    prerequisiteId: 'O5',
    isInfinite: false
  },
  {
    id: 'O7',
    branch: 'arkalon',
    tier: 7,
    label: 'Trans-Reality Synthesis',
    cost: 5n * 10n ** 118n,
    studyTimeSeconds: 86400,
    effectDescription:
      '+1% Arkalon Resonance effectiveness per prestige completed.',
    prerequisiteId: 'O6',
    isInfinite: false
  },
  {
    id: 'O8',
    branch: 'arkalon',
    tier: 8,
    label: 'Dimensional Convergence',
    cost: 10n ** 127n,
    studyTimeSeconds: 172800,
    effectDescription:
      'All four branches cross-amplify: +0.5% per completed node to all other branch generators.',
    prerequisiteId: 'O7',
    isInfinite: false
  },
  {
    id: 'O9',
    branch: 'arkalon',
    tier: 9,
    label: 'Omega Mind Mirror',
    cost: 10n ** 130n,
    studyTimeSeconds: 172800,
    effectDescription: 'Arkalon Interface base output multiplied by 5.0x.',
    prerequisiteId: 'O8',
    isInfinite: false
  },
  {
    id: 'O10',
    branch: 'arkalon',
    tier: 10,
    label: 'Arkalon Synchronicity Matrix',
    cost: 10n ** 155n,
    studyTimeSeconds: 691200,
    effectDescription:
      'All branch multipliers apply to all generator classes. Ultimate convergence node.',
    prerequisiteId: 'O9',
    isInfinite: false
  },

  // Infinite nodes (unlocked after branch tier 8)
  {
    id: 'C_INF',
    branch: 'computation',
    tier: 0,
    label: 'Infinite Computational Throughput',
    cost: 10n ** 20n,
    studyTimeSeconds: 0,
    effectDescription: '+10% compounding calculation efficiency per level.',
    prerequisiteId: 'C8',
    isInfinite: true
  },
  {
    id: 'E_INF',
    branch: 'energy',
    tier: 0,
    label: 'Infinite Vacuum Extraction',
    cost: 5n * 10n ** 20n,
    studyTimeSeconds: 0,
    effectDescription: '+8% compounding energy output per level.',
    prerequisiteId: 'E8',
    isInfinite: true
  },
  {
    id: 'R_INF',
    branch: 'reality',
    tier: 0,
    label: 'Infinite Space-Time Dilation',
    cost: 25n * 10n ** 20n,
    studyTimeSeconds: 0,
    effectDescription:
      'Reduces running research timers by 1% per level (multiplicative, 95% hard cap).',
    prerequisiteId: 'R8',
    isInfinite: true
  },
  {
    id: 'O_INF',
    branch: 'arkalon',
    tier: 0,
    label: 'Infinite Synaptic Expansion',
    cost: 10n ** 22n,
    studyTimeSeconds: 0,
    effectDescription: '+5% Arkalon Resonance multiplier strength per level.',
    prerequisiteId: 'O8',
    isInfinite: true
  }
]

// O(1) lookup map
export const RESEARCH_NODE_MAP: Record<string, ResearchNodeDefinition> =
  Object.fromEntries(RESEARCH_NODES.map((n) => [n.id, n]))

// Infinite node cost scaling factors per branch
export const INF_NODE_COST_SCALING: Record<string, number> = {
  C_INF: 1.5,
  E_INF: 1.6,
  R_INF: 1.7,
  O_INF: 1.8
}
