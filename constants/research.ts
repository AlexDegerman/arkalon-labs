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
    effectDescription:
      'Reduces Research Desk cost scaling (growth factor -0.02).',
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
    cost: 500_000n,
    studyTimeSeconds: 600,
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
    cost: 2_500_000_000n,
    studyTimeSeconds: 1800,
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
    cost: 10n ** 14n,
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
    cost: 10n ** 23n,
    studyTimeSeconds: 14400,
    effectDescription: 'Increases all active anomaly buff multipliers by +25%.',
    prerequisiteId: 'C5',
    isInfinite: false
  },
  {
    id: 'C7',
    branch: 'computation',
    tier: 7,
    label: 'Non-Turing Architecture',
    cost: 10n ** 38n,
    studyTimeSeconds: 43200,
    effectDescription: '1.15x RP output to all Computation-class generators.',
    prerequisiteId: 'C6',
    isInfinite: false
  },
  {
    id: 'C8',
    branch: 'computation',
    tier: 8,
    label: 'The Omega Algorithm',
    cost: 10n ** 62n,
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
    cost: 10n ** 95n,
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
    cost: 10n ** 140n,
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
    effectDescription: '+15% offline RP efficiency.',
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
    effectDescription: '+20% offline RP efficiency.',
    prerequisiteId: 'E1',
    isInfinite: false
  },
  {
    id: 'E3',
    branch: 'energy',
    tier: 3,
    label: 'Singularity Integration',
    cost: 3_500_000n,
    studyTimeSeconds: 900,
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
    cost: 25_000_000_000n,
    studyTimeSeconds: 2700,
    effectDescription: '5x RP output to all Energy-class generators.',
    prerequisiteId: 'E3',
    isInfinite: false
  },
  {
    id: 'E5',
    branch: 'energy',
    tier: 5,
    label: 'Vacuum Polarisers',
    cost: 10n ** 16n,
    studyTimeSeconds: 9000,
    effectDescription:
      '+0.5% global production per AR earned (scales with Harmonic Cap).',
    prerequisiteId: 'E4',
    isInfinite: false
  },
  {
    id: 'E6',
    branch: 'energy',
    tier: 6,
    label: 'Plasma Lattice Confinement',
    cost: 10n ** 26n,
    studyTimeSeconds: 21600,
    effectDescription:
      'Reduces Energy-class generator cost scaling (growth factor -0.02).',
    prerequisiteId: 'E5',
    isInfinite: false
  },
  {
    id: 'E7',
    branch: 'energy',
    tier: 7,
    label: 'Chronal Disruption Fuses',
    cost: 10n ** 43n,
    studyTimeSeconds: 57600,
    effectDescription: 'All spatial anomalies last 1.5x longer.',
    prerequisiteId: 'E6',
    isInfinite: false
  },
  {
    id: 'E8',
    branch: 'energy',
    tier: 8,
    label: 'Infinite Entropic Sink',
    cost: 10n ** 68n,
    studyTimeSeconds: 100800,
    effectDescription:
      'Energy-class generators scale by 1 + 0.1 * ln(lifetime RP).',
    prerequisiteId: 'E7',
    isInfinite: false
  },
  {
    id: 'E9',
    branch: 'energy',
    tier: 9,
    label: 'Primordial Inflation Loops',
    cost: 10n ** 105n,
    studyTimeSeconds: 172800,
    effectDescription:
      '1.5x RP output for Stellar Harvesters and Galactic Engines.',
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
      'Reduces the first purchase cost of Server Clusters and Quantum Computers by 15%.',
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
    cost: 25_000_000n,
    studyTimeSeconds: 1200,
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
    cost: 250_000_000_000n,
    studyTimeSeconds: 3600,
    effectDescription:
      'Research timers run 2x faster while any anomaly is active.',
    prerequisiteId: 'R3',
    isInfinite: false
  },
  {
    id: 'R5',
    branch: 'reality',
    tier: 5,
    label: 'Dimensional Permeability',
    cost: 10n ** 18n,
    studyTimeSeconds: 10800,
    effectDescription:
      'Persists across Tier I prestiges and grants 1.10x RP output to all generators.',
    prerequisiteId: 'R4',
    isInfinite: false
  },
  {
    id: 'R6',
    branch: 'reality',
    tier: 6,
    label: 'Matter-Data Coexistence',
    cost: 10n ** 29n,
    studyTimeSeconds: 28800,
    effectDescription:
      '+1% global generator RP per generator unit currently owned.',
    prerequisiteId: 'R5',
    isInfinite: false
  },
  {
    id: 'R7',
    branch: 'reality',
    tier: 7,
    label: 'Anthropic Fine-Tuning',
    cost: 10n ** 48n,
    studyTimeSeconds: 72000,
    effectDescription:
      'Persists across Tier I prestiges; Reality Engines produce 10x RP for 5 minutes after prestige.',
    prerequisiteId: 'R6',
    isInfinite: false
  },
  {
    id: 'R8',
    branch: 'reality',
    tier: 8,
    label: 'Timeline Collapse Protocol',
    cost: 10n ** 74n,
    studyTimeSeconds: 129600,
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
    cost: 10n ** 115n,
    studyTimeSeconds: 172800,
    effectDescription:
      'Expands max offline progression cap to 24 hours (from 8h base / 12h Chronos Loom).',
    prerequisiteId: 'R8',
    isInfinite: false
  },
  {
    id: 'R10',
    branch: 'reality',
    tier: 10,
    label: 'Timeline Collapser Core',
    cost: 10n ** 150n,
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
      "Unlocks Relics & Artifacts, Dust Condensers, and awards Relic 1 (Arkalon's Left Eye).",
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
    effectDescription: 'Reduces Arkalon Branch research study times by 10%.',
    prerequisiteId: 'O1',
    isInfinite: false
  },
  {
    id: 'O3',
    branch: 'arkalon',
    tier: 3,
    label: 'Predictive Synchronization',
    cost: 150_000_000n,
    studyTimeSeconds: 1500,
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
    cost: 2_500_000_000_000n,
    studyTimeSeconds: 5400,
    effectDescription: 'Arkalon Interfaces base yield increased by 300%.',
    prerequisiteId: 'O3',
    isInfinite: false
  },
  {
    id: 'O5',
    branch: 'arkalon',
    tier: 5,
    label: 'Synapse Replication',
    cost: 10n ** 20n,
    studyTimeSeconds: 14400,
    effectDescription:
      'Reduces all generator RP costs by 0.01% per Arkalon Interface owned (max 90%).',
    prerequisiteId: 'O4',
    isInfinite: false
  },
  {
    id: 'O6',
    branch: 'arkalon',
    tier: 6,
    label: 'Non-Causal Intercepts',
    cost: 10n ** 32n,
    studyTimeSeconds: 36000,
    effectDescription: 'Bypass one prerequisite tech choice per reset run.',
    prerequisiteId: 'O5',
    isInfinite: false
  },
  {
    id: 'O7',
    branch: 'arkalon',
    tier: 7,
    label: 'Trans-Reality Synthesis',
    cost: 10n ** 54n,
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
    cost: 10n ** 80n,
    studyTimeSeconds: 172800,
    effectDescription:
      '+0.5% RP output to all generators per completed research node.',
    prerequisiteId: 'O7',
    isInfinite: false
  },
  {
    id: 'O9',
    branch: 'arkalon',
    tier: 9,
    label: 'Omega Mind Mirror',
    cost: 10n ** 125n,
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
    cost: 10n ** 64n,
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
    cost: 10n ** 70n,
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
    cost: 10n ** 76n,
    studyTimeSeconds: 0,
    effectDescription:
      'Reduces research study durations by 1% per level (multiplicative, 95% hard cap; applies to active studies).',
    prerequisiteId: 'R8',
    isInfinite: true
  },
  {
    id: 'O_INF',
    branch: 'arkalon',
    tier: 0,
    label: 'Infinite Synaptic Expansion',
    cost: 10n ** 82n,
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
