// Static relic definitions - display metadata and balance parameters

export type RelicSource =
  | 'auto_awarded'
  | 'anomaly_drop'
  | 'prestige_reset'
  | 'research_drop'
  | 'offline_hours'
  | 'anomaly_specific'
  | 'purchase_ar'
  | 'prestige_tier2'
  | 'generator_count'
  | 'generator_owned'
  | 'operation_tier'
  | 'research_time'
  | 'prestige_specific'
  | 'generator_milestone'
  | 'point_milestone'
  | 'purchase_os'

export interface RelicDefinition {
  id: number // 1-20
  name: string
  description: string
  source: RelicSource
  sourceDescription: string
  baseDustCost: number // cost per upgrade level
  dustCostScaling: number // multiplier per level (1.12^level)
  effectPerLevel: string
  maxLevel: number // always 100
}

export const RELICS: RelicDefinition[] = [
  {
    id: 1,
    name: "Arkalon's Left Eye",
    description: "A crystallized fragment of Arkalon's visual cortex.",
    source: 'auto_awarded',
    sourceDescription: 'Auto-awarded on Relic tab unlock.',
    baseDustCost: 10,
    dustCostScaling: 1.12,
    effectPerLevel: '+2% Arkalon Branch research speed per level',
    maxLevel: 100
  },
  {
    id: 2,
    name: 'Fractured Chrono-Hourglass',
    description:
      'A shattered temporal measurement device leaking chronal energy.',
    source: 'anomaly_specific',
    sourceDescription: 'Temporal Distortion anomaly (5% drop).',
    baseDustCost: 15,
    dustCostScaling: 1.12,
    effectPerLevel: '+1.5s anomaly duration per level',
    maxLevel: 100
  },
  {
    id: 3,
    name: 'Zero-Point Dynamo',
    description:
      'A self-sustaining energy core harvesting vacuum fluctuations.',
    source: 'prestige_reset',
    sourceDescription: 'Singular Synthesis reset.',
    baseDustCost: 25,
    dustCostScaling: 1.12,
    effectPerLevel: '+5% energy-class generator output per level',
    maxLevel: 100
  },
  {
    id: 4,
    name: 'Infinite Ledger',
    description:
      'A tome that records and reduces the cost of early generators.',
    source: 'research_drop',
    sourceDescription: 'Research project completion (1% drop).',
    baseDustCost: 30,
    dustCostScaling: 1.12,
    effectPerLevel: '-0.001 growth factor on first 5 generators per level',
    maxLevel: 100
  },
  {
    id: 5,
    name: 'Entropic Anchor',
    description:
      'A device that slows entropy, maximizing offline accumulation.',
    source: 'offline_hours',
    sourceDescription: '50 total hours offline progression.',
    baseDustCost: 40,
    dustCostScaling: 1.12,
    effectPerLevel: '+1% offline RP rate per level (cap 100%)',
    maxLevel: 100
  },
  {
    id: 6,
    name: 'Quantum Die',
    description: 'A probability manipulator that hastens anomaly emergence.',
    source: 'anomaly_specific',
    sourceDescription: 'Quantum Surge anomaly (5% drop).',
    baseDustCost: 50,
    dustCostScaling: 1.12,
    effectPerLevel: '-3s minimum anomaly spawn interval per level (floor 60s)',
    maxLevel: 100
  },
  {
    id: 7,
    name: 'Sierpinski Gasket Node',
    description:
      'A fractal computation node amplifying recursive calculations.',
    source: 'purchase_ar',
    sourceDescription: '50 AR spent.',
    baseDustCost: 75,
    dustCostScaling: 1.12,
    effectPerLevel: '+10% computation-class generator output per level',
    maxLevel: 100
  },
  {
    id: 8,
    name: 'Tachyon Prism',
    description:
      'A faster-than-light lens that amplifies production exponents.',
    source: 'prestige_tier2',
    sourceDescription: 'First Timeline Severance.',
    baseDustCost: 100,
    dustCostScaling: 1.12,
    effectPerLevel: '+0.02 global production exponent per level',
    maxLevel: 100
  },
  {
    id: 9,
    name: 'Void Compass',
    description: 'A navigation instrument tuned to Arkalon Resonance flows.',
    source: 'anomaly_specific',
    sourceDescription: 'Empty Coordinates excavation scan (3%).',
    baseDustCost: 125,
    dustCostScaling: 1.12,
    effectPerLevel: '+3% AR awarded on Reality Recalibration per level',
    maxLevel: 100
  },
  {
    id: 10,
    name: 'Singularity Lens',
    description: 'A black-hole focusing array that amplifies reactor output.',
    source: 'anomaly_specific',
    sourceDescription: 'Containment Breach anomaly (5% drop).',
    baseDustCost: 150,
    dustCostScaling: 1.12,
    effectPerLevel: '+15% Singularity Reactor output per level',
    maxLevel: 100
  },
  {
    id: 11,
    name: 'Superrecursive Core',
    description:
      'A self-referential processor that shifts milestone thresholds.',
    source: 'generator_milestone',
    sourceDescription: 'Purchasing 500th unit of any generator.',
    baseDustCost: 200,
    dustCostScaling: 1.12,
    effectPerLevel:
      'Quantity milestones trigger 2 units earlier per level (floor 5)',
    maxLevel: 100
  },
  {
    id: 12,
    name: 'Dyson Siphon',
    description:
      'A stellar energy collector that links harvesters to energy output.',
    source: 'generator_owned',
    sourceDescription: '50 Stellar Harvesters owned.',
    baseDustCost: 250,
    dustCostScaling: 1.12,
    effectPerLevel: '+0.5% per Harvester to all energy generators per level',
    maxLevel: 100
  },
  {
    id: 13,
    name: 'Matter-Data Bridge',
    description: 'A cross-dimensional relay amplifying synergy coefficients.',
    source: 'operation_tier',
    sourceDescription: 'Complete Tier 3 Anomalous Operation.',
    baseDustCost: 300,
    dustCostScaling: 1.12,
    effectPerLevel: '+5% cross-generator synergy coefficients per level',
    maxLevel: 100
  },
  {
    id: 14,
    name: 'Paradoxical Coil',
    description: 'A temporal loop device that reduces technology costs.',
    source: 'research_time',
    sourceDescription: '24 cumulative hours on any single tech node.',
    baseDustCost: 400,
    dustCostScaling: 1.12,
    effectPerLevel: '-1.5% base cost of all tech nodes per level',
    maxLevel: 100
  },
  {
    id: 15,
    name: 'Planck Shell',
    description: 'A quantum containment field accelerating Reality Engines.',
    source: 'anomaly_specific',
    sourceDescription: 'Arkalon Resonance anomaly (5% drop).',
    baseDustCost: 500,
    dustCostScaling: 1.12,
    effectPerLevel: 'Reality Engines run 10% faster per level',
    maxLevel: 100
  },
  {
    id: 16,
    name: "Arkalon's Monolith",
    description: 'A monolithic data structure amplifying interface throughput.',
    source: 'research_drop',
    sourceDescription: 'Arkalon Branch Tier 8 completion.',
    baseDustCost: 600,
    dustCostScaling: 1.12,
    effectPerLevel:
      'Arkalon Interfaces +2% per other active generator per level',
    maxLevel: 100
  },
  {
    id: 17,
    name: 'Dark Core Extract',
    description: 'A compressed dark matter fragment reducing synthesis costs.',
    source: 'generator_owned',
    sourceDescription: '100 Dark Matter Synthesizers owned.',
    baseDustCost: 800,
    dustCostScaling: 1.12,
    effectPerLevel: '-2% base cost of dark-energy buildings per level',
    maxLevel: 100
  },
  {
    id: 18,
    name: 'Galactic Hub',
    description: 'A galactic coordination node linking stellar infrastructure.',
    source: 'purchase_os',
    sourceDescription: '10 OS spent.',
    baseDustCost: 1000,
    dustCostScaling: 1.12,
    effectPerLevel:
      'Galactic Engines boost Stellar Harvesters +1% per Engine per level',
    maxLevel: 100
  },
  {
    id: 19,
    name: 'Dimensional Map',
    description:
      'A multi-dimensional chart reducing Reality Branch research costs.',
    source: 'point_milestone',
    sourceDescription: 'Reach 10^63 RP in a single run.',
    baseDustCost: 1200,
    dustCostScaling: 1.12,
    effectPerLevel: '-3% Reality Branch research costs per level',
    maxLevel: 100
  },
  {
    id: 20,
    name: 'Omega Catalyst',
    description: 'An ultimate amplifier maximizing Void Compressor potential.',
    source: 'generator_owned',
    sourceDescription: '10 Absolute Void Compressors owned.',
    baseDustCost: 1500,
    dustCostScaling: 1.12,
    effectPerLevel:
      '+50% Void Compressor output per level (capped at level 20)',
    maxLevel: 100
  }
]

// O(1) lookup by relic ID
export const RELIC_MAP: Record<number, RelicDefinition> = Object.fromEntries(
  RELICS.map((r) => [r.id, r])
)
