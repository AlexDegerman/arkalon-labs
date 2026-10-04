'use client'

// Stage 1-6 based on quantity owned
// Each stage adds visual complexity to the generator SVG
const STAGE_THRESHOLDS = [
  { stage: 6 as const, min: 250n },
  { stage: 5 as const, min: 100n },
  { stage: 4 as const, min: 50n },
  { stage: 3 as const, min: 25n },
  { stage: 2 as const, min: 10n },
  { stage: 1 as const, min: 1n }
]

export type GeneratorStage = 1 | 2 | 3 | 4 | 5 | 6

// Returns the visual stage for a generator based on quantity owned
export function getStageForQuantity(quantity: bigint): GeneratorStage {
  for (const { stage, min } of STAGE_THRESHOLDS) {
    if (quantity >= min) return stage
  }
  return 1
}

// Returns the tier color for a generator by index
// Used as the default glow color for generator SVGs
const TIER_COLORS: Record<number, string> = {
  0: '#2dd4bf', // teal - Research Desk
  1: '#2dd4bf', // teal - Server Cluster
  2: '#2dd4bf', // teal - Quantum Computer
  3: '#2dd4bf', // teal - Neural Core
  4: '#a78bfa', // purple - Reality Engine
  5: '#a78bfa', // purple - Singularity Reactor
  6: '#a78bfa', // purple - Arkalon Interface
  7: '#a78bfa', // purple - Infinite Simulation
  8: '#f472b6', // pink - Universal Constructor
  9: '#f472b6', // pink - Existence Compiler
  10: '#f472b6', // pink - Dimensional Folder
  11: '#f472b6', // pink - Chronos Synchronizer
  12: '#fb923c', // orange - Vacuum Fluctuator
  13: '#fb923c', // orange - Dark Matter Synthesizer
  14: '#fb923c', // orange - Stellar Harvester
  15: '#fb923c', // orange - Galactic Engine
  16: '#e0e0ff', // white-blue - Multiversal Conduit
  17: '#e0e0ff', // white-blue - Planck Epoch Projector
  18: '#e0e0ff', // white-blue - Chaos Weaver
  19: '#e0e0ff' // white-blue - Absolute Void Compressor
}

export function getGeneratorTierColor(generatorIndex: number): string {
  return TIER_COLORS[generatorIndex] ?? '#2dd4bf'
}
