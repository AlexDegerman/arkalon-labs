// Prestige upgrade definitions for AR, CF, and OS shops

export interface PrestigeUpgradeDef {
  id: string
  label: string
  description: string
  baseCost: number
  maxLevel: number
  currency: 'ar' | 'cf' | 'os'
  // Returns effect description at a given level
  effectAtLevel: (level: number) => string
}

export const AR_UPGRADES: PrestigeUpgradeDef[] = [
  {
    id: 'chronal_anchor',
    label: 'Chronal Anchor',
    description:
      'Start post-prestige with 5% of prior run peak PPS as flat RP.',
    baseCost: 5,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? 'Start with 5% of peak PPS' : 'Not purchased'
  },
  {
    id: 'dimensional_blueprinting',
    label: 'Dimensional Blueprinting',
    description:
      'Instantly purchase 5 units of the first three generators post-reset.',
    baseCost: 10,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Start with 5x Gen 1-3' : 'Not purchased')
  },
  {
    id: 'neural_pipeline',
    label: 'Neural Pipeline',
    description: '+10% anomaly spawn frequency per level.',
    baseCost: 3,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 10}% anomaly frequency`
  },
  {
    id: 'super_symmetry',
    label: 'Super-Symmetry',
    description: '+10% global production per unspent AR held (500 AR cap).',
    baseCost: 15,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? '+10% per unspent AR (cap 500)' : 'Not purchased'
  },
  {
    id: 'auto_buy_basic',
    label: 'Auto-Buy (Basic)',
    description: 'Auto-buy cheapest generator every 5 seconds.',
    baseCost: 10,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'auto_research_queue',
    label: 'Auto-Research Queue',
    description: 'Auto-start next queued research on completion.',
    baseCost: 25,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'research_accelerant',
    label: 'Research Accelerant',
    description: '-3% research time per level (multiplicative).',
    baseCost: 8,
    maxLevel: 10,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0
        ? `-${(1 - Math.pow(0.97, l) * 100).toFixed(1)}% research time`
        : 'Not purchased'
  },
  {
    id: 'generator_priming',
    label: 'Generator Priming',
    description: '+2% base output to all generators per level.',
    baseCost: 5,
    maxLevel: 20,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 2}% all generator output`
  },
  {
    id: 'anomaly_extender',
    label: 'Anomaly Extender',
    description: '+5 seconds to all anomaly durations per level.',
    baseCost: 12,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 5}s anomaly duration`
  },
  {
    id: 'milestone_sharpener',
    label: 'Milestone Sharpener',
    description:
      'Quantity milestones trigger 1 unit earlier per level (floor 10).',
    baseCost: 20,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? `Milestones ${l} unit(s) earlier` : 'Not purchased'
  },
  {
    id: 'relic_resonance',
    label: 'Relic Resonance',
    description: '+5% to all equipped relic effects per level.',
    baseCost: 15,
    maxLevel: 10,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 5}% relic effects`
  },
  {
    id: 'challenge_accelerant',
    label: 'Challenge Accelerant',
    description: 'Challenge RP targets reduced by 25%.',
    baseCost: 30,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? '-25% challenge targets' : 'Not purchased')
  }
]

export const CF_UPGRADES: PrestigeUpgradeDef[] = [
  {
    id: 'temporal_compression',
    label: 'Temporal Compression',
    description: 'All research timers -25% permanently.',
    baseCost: 10,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? '-25% research time' : 'Not purchased')
  },
  {
    id: 'quantum_memory',
    label: 'Quantum Memory',
    description: 'Retain 3 Tier-4 research nodes across Tier I prestiges.',
    baseCost: 25,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? 'Retain 3 Tier-4 nodes' : 'Not purchased')
  },
  {
    id: 'resonance_amplification',
    label: 'Resonance Amplification',
    description: 'Future AR yields x1.5 per CF held.',
    baseCost: 15,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? 'AR yields x1.5 per CF' : 'Not purchased')
  },
  {
    id: 'auto_module_buyer',
    label: 'Auto-Module Buyer',
    description: 'Auto-purchases affordable module upgrades.',
    baseCost: 50,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'generator_transcendence',
    label: 'Generator Transcendence',
    description: '+5% base output to generators Tier 6+ per level.',
    baseCost: 20,
    maxLevel: 5,
    currency: 'cf',
    effectAtLevel: (l) => `+${l * 5}% to Tier 6+ generators`
  },
  {
    id: 'deep_research_slots',
    label: 'Deep Research Slots',
    description:
      'Third parallel research slot (requires different branch from both).',
    baseCost: 40,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) =>
      l > 0 ? '3 parallel research slots' : 'Not purchased'
  },
  {
    id: 'relic_preservation',
    label: 'Relic Preservation',
    description: 'Relic swap cooldown reduced to 2 minutes.',
    baseCost: 30,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? '2min swap cooldown' : 'Not purchased')
  },
  {
    id: 'megaproject_efficiency',
    label: 'Megaproject Efficiency',
    description: 'Megaproject construction costs -10% per level.',
    baseCost: 35,
    maxLevel: 3,
    currency: 'cf',
    effectAtLevel: (l) => `-${l * 10}% megaproject costs`
  }
]

export const OS_UPGRADES: PrestigeUpgradeDef[] = [
  {
    id: 'dimensional_transcendence',
    label: 'Dimensional Transcendence',
    description:
      'Reduces cost growth factors by 0.05 across all generators (floor 1.01).',
    baseCost: 5,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? '-0.05 all growth factors' : 'Not purchased')
  },
  {
    id: 'exponential_catalyst',
    label: 'Exponential Catalyst',
    description: '+0.05 to master production exponent per OS held.',
    baseCost: 10,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? '+0.05 exponent per OS' : 'Not purchased')
  },
  {
    id: 'the_automated_lab',
    label: 'The Automated Lab',
    description: 'Auto-execute Tier I prestiges when target is reached.',
    baseCost: 8,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? 'Auto Tier I prestige' : 'Not purchased')
  },
  {
    id: 'automated_timeline_severance',
    label: 'Automated Timeline Severance',
    description: 'Auto-execute Tier II prestiges (requires The Automated Lab).',
    baseCost: 20,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? 'Auto Tier II prestige' : 'Not purchased')
  }
]

// Returns upgrade cost - most AR upgrades cost baseCost * level for leveled ones
export function getUpgradeCost(
  def: PrestigeUpgradeDef,
  currentLevel: number
): number {
  if (currentLevel >= def.maxLevel) return 0
  // Level upgrades cost baseCost per additional level
  return def.baseCost
}
