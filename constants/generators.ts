// Static generator definitions - display metadata and balance parameters
// All 20 generators indexed 0-19

export interface GeneratorDefinition {
  index: number
  name: string
  description: string
  baseCost: bigint
  growthFactor: number // exponential cost scaling
  baseOutput: bigint // RP per second in microRP (x1000 for precision)
  // baseOutput is stored as milliRP/sec * 1000 to avoid fractional bigints
  // Actual RP/sec = baseOutput / 1000n
  // e.g. 500 = 0.5 RP/sec, 4000 = 4.0 RP/sec
}
export const GENERATORS: GeneratorDefinition[] = [
  {
    index: 0,
    name: 'Research Desk',
    description: 'Low-level data entry, manual ledger calculations, and basic physical observations.',
    baseCost: 15n,
    growthFactor: 1.13,
    baseOutput: 500n,
  },
  {
    index: 1,
    name: 'Server Cluster',
    description: 'Parallel computing towers processing raw thermodynamic and environmental data.',
    baseCost: 100n,
    growthFactor: 1.12,
    baseOutput: 5_000n,
  },
  {
    index: 2,
    name: 'Quantum Computer',
    description: 'Superposition processing arrays resolving intricate probability vectors.',
    baseCost: 800n,
    growthFactor: 1.10,
    baseOutput: 40_000n,
  },
  {
    index: 3,
    name: 'Neural Core',
    description: 'Self-improving biological-silicon network nodes modeled on Arkalon synaptic configurations.',
    baseCost: 10_000n,
    growthFactor: 1.09,
    baseOutput: 300_000n,
  },
  {
    index: 4,
    name: 'Reality Engine',
    description: 'Localized micro-manipulators that alter regional physical constants.',
    baseCost: 120_000n,
    growthFactor: 1.08,
    baseOutput: 2_200_000n,
  },
  {
    index: 5,
    name: 'Singularity Reactor',
    description:
      'Miniature, stabilized black holes harvesting Hawking radiation.',
    baseCost: 2_000_000n,
    growthFactor: 1.07,
    baseOutput: 15_000_000n // 15,000.0 RP/sec
  },
  {
    index: 6,
    name: 'Arkalon Interface',
    description:
      'A direct telemetry link reading structural data directly from Arkalon.',
    baseCost: 35_000_000n,
    growthFactor: 1.06,
    baseOutput: 120_000_000n // 120,000.0 RP/sec
  },
  {
    index: 7,
    name: 'Infinite Simulation',
    description:
      'Nested virtual universes processing infinite computational cycles in fast-forward.',
    baseCost: 500_000_000n,
    growthFactor: 1.05,
    baseOutput: 950_000_000n // 950,000.0 RP/sec
  },
  {
    index: 8,
    name: 'Universal Constructor',
    description:
      'Automated atomic printers synthesizing materials directly from coherent light.',
    baseCost: 8_000_000_000n,
    growthFactor: 1.05,
    baseOutput: 8_000_000_000n // 8,000,000.0 RP/sec
  },
  {
    index: 9,
    name: 'Existence Compiler',
    description:
      'Rewrites raw system data directly into physical truth, bypassing standard entropy.',
    baseCost: 150_000_000_000n,
    growthFactor: 1.04,
    baseOutput: 75_000_000_000n // 75,000,000.0 RP/sec
  },
  {
    index: 10,
    name: 'Dimensional Folder',
    description:
      'Spatially compresses local space, folding structural pathways to shorten computational distance.',
    baseCost: 3_200_000_000_000n,
    growthFactor: 1.04,
    baseOutput: 720_000_000_000n // 720,000,000.0 RP/sec
  },
  {
    index: 11,
    name: 'Chronos Synchronizer',
    description:
      'Aligns multiple localized timelines to run parallel calculations.',
    baseCost: 85_000_000_000_000n,
    growthFactor: 1.04,
    baseOutput: 8_100_000_000_000n // 8,100,000,000.0 RP/sec
  },
  {
    index: 12,
    name: 'Vacuum Fluctuator',
    description:
      'Captures and amplifies random sub-atomic fluctuations in the spatial vacuum.',
    baseCost: 2_100_000_000_000_000n,
    growthFactor: 1.03,
    baseOutput: 98_000_000_000_000n
  },
  {
    index: 13,
    name: 'Dark Matter Synthesizer',
    description:
      'Compresses interstellar dark matter into stable high-density fuel rods.',
    baseCost: 54_000_000_000_000_000n,
    growthFactor: 1.03,
    baseOutput: 1_200_000_000_000_000n
  },
  {
    index: 14,
    name: 'Stellar Harvester',
    description: 'Deploys sub-space siphons directly into regional stars.',
    baseCost: 1_600_000_000_000_000_000n,
    growthFactor: 1.03,
    baseOutput: 16_000_000_000_000_000n
  },
  {
    index: 15,
    name: 'Galactic Engine',
    description:
      'Simulates the gravitational rotation of entire galaxies for data processing.',
    baseCost: 48_000_000_000_000_000_000n,
    growthFactor: 1.02,
    baseOutput: 220_000_000_000_000_000n
  },
  {
    index: 16,
    name: 'Multiversal Conduit',
    description:
      'Opens a permanent gateway to adjacent realities, siphoning point streams.',
    baseCost: 1_500_000_000_000_000_000_000n,
    growthFactor: 1.02,
    baseOutput: 3_100_000_000_000_000_000n
  },
  {
    index: 17,
    name: 'Planck Epoch Projector',
    description: 'Recreates physical conditions similar to the early universe.',
    baseCost: 50_000_000_000_000_000_000_000n,
    growthFactor: 1.02,
    baseOutput: 45_000_000_000_000_000_000n
  },
  {
    index: 18,
    name: 'Chaos Weaver',
    description:
      'Deconstructs local probability lines into organized mathematical data arrays.',
    baseCost: 1_800_000_000_000_000_000_000_000n,
    growthFactor: 1.02,
    baseOutput: 680_000_000_000_000_000_000n
  },
  {
    index: 19,
    name: 'Absolute Void Compressor',
    description: 'Collapses pure emptiness into ultra-dense storage nodes.',
    baseCost: 65_000_000_000_000_000_000_000_000n,
    growthFactor: 1.01,
    baseOutput: 11_000_000_000_000_000_000_000n
  }
]

// Generator class groupings for branch-specific research effects
export type GeneratorClass = 'computation' | 'energy' | 'reality' | 'arkalon'

export const GENERATOR_CLASS: Record<number, GeneratorClass> = {
  0: 'computation', // Research Desk
  1: 'computation', // Server Cluster
  2: 'computation', // Quantum Computer
  3: 'computation', // Neural Core
  4: 'reality', // Reality Engine
  5: 'energy', // Singularity Reactor
  6: 'arkalon', // Arkalon Interface
  7: 'computation', // Infinite Simulation
  8: 'computation', // Universal Constructor
  9: 'computation', // Existence Compiler
  10: 'reality', // Dimensional Folder
  11: 'reality', // Chronos Synchronizer
  12: 'energy', // Vacuum Fluctuator
  13: 'energy', // Dark Matter Synthesizer
  14: 'energy', // Stellar Harvester
  15: 'energy', // Galactic Engine
  16: 'reality', // Multiversal Conduit
  17: 'reality', // Planck Epoch Projector
  18: 'arkalon', // Chaos Weaver
  19: 'arkalon' // Absolute Void Compressor
}

// Module synergy matrix - hardcoded per design document
export interface SynergyDefinition {
  sourceIndex: number
  targetIndex: number
  name: string
  bonusPerSourcePerLevel: number // fractional multiplier e.g. 0.0001 = 0.01%
}

export const MODULE_SYNERGIES: SynergyDefinition[] = [
  {
    sourceIndex: 0,
    targetIndex: 9,
    name: 'Historic Validation',
    bonusPerSourcePerLevel: 0.0001
  },
  {
    sourceIndex: 1,
    targetIndex: 5,
    name: 'Grid Management',
    bonusPerSourcePerLevel: 0.0005
  },
  {
    sourceIndex: 2,
    targetIndex: 1,
    name: 'Superposition Link',
    bonusPerSourcePerLevel: 0.0008
  },
  {
    sourceIndex: 3,
    targetIndex: 6,
    name: 'Synaptic Overdrive',
    bonusPerSourcePerLevel: 0.001
  },
  {
    sourceIndex: 4,
    targetIndex: 5,
    name: 'Metric Stability',
    bonusPerSourcePerLevel: 0.0012
  },
  {
    sourceIndex: 5,
    targetIndex: 7,
    name: 'Entropic Inflow',
    bonusPerSourcePerLevel: 0.0015
  },
  {
    sourceIndex: 6,
    targetIndex: 8,
    name: 'Direct Pipeline',
    bonusPerSourcePerLevel: 0.0018
  },
  {
    sourceIndex: 7,
    targetIndex: 9,
    name: 'Simulated Runtimes',
    bonusPerSourcePerLevel: 0.002
  },
  {
    sourceIndex: 8,
    targetIndex: 4,
    name: 'Atomic Printing',
    bonusPerSourcePerLevel: 0.0025
  },
  {
    sourceIndex: 9,
    targetIndex: 0,
    name: 'Matter Coding',
    bonusPerSourcePerLevel: 0.003
  }
]
