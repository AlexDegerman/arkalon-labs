// Prestige upgrade definitions for AR, CF, and OS shops
import type { ARUpgrades, CFUpgrades, OSUpgrades } from '@/types/game'

export interface PrestigeUpgradeDef<ID extends string = string> {
  id: ID
  label: string
  description: string
  baseCost: number
  maxLevel: number
  currency: 'ar' | 'cf' | 'os'
  costScaling?: number
  // Returns effect description at a given level
  effectAtLevel: (level: number) => string
}

export const AR_UPGRADES: PrestigeUpgradeDef<keyof ARUpgrades>[] = [
  {
    id: 'generator_priming',
    label: 'Generator Priming',
    description: '1.35x compounding output to all generators per level.',
    baseCost: 2,
    maxLevel: 30,
    costScaling: 1.6,
    currency: 'ar',
    effectAtLevel: (l) => `${Math.pow(1.35, l).toFixed(2)}x generator output`
  },
  {
    id: 'neural_pipeline',
    label: 'Neural Pipeline',
    description: '+5% anomaly spawn frequency per level.',
    baseCost: 6,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 5}% anomaly frequency`
  },
  {
    id: 'chronal_anchor',
    label: 'Chronal Anchor',
    description:
      'Start post-prestige with 1 second of your prior run peak RP/s as flat RP.',
    baseCost: 10,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? 'Start with 1s of peak RP/s' : 'Not purchased'
  },
  {
    id: 'research_accelerant',
    label: 'Research Accelerant',
    description: '-3% research time per level (multiplicative).',
    baseCost: 10,
    maxLevel: 10,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0
        ? `-${((1 - Math.pow(0.97, l)) * 100).toFixed(1)}% research time`
        : 'Not purchased'
  },
  {
    id: 'dimensional_blueprinting',
    label: 'Dimensional Blueprinting',
    description:
      'Start each Tier I prestige with 5 free units of Generators 1-3.',
    baseCost: 15,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Start with 5x Gen 1-3' : 'Not purchased')
  },
  {
    id: 'anomaly_extender',
    label: 'Anomaly Extender',
    description: '+3 seconds to all anomaly durations per level.',
    baseCost: 15,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 3}s anomaly duration`
  },
  {
    id: 'relic_resonance',
    label: 'Relic Resonance',
    description: '+5% to all equipped relic effects per level.',
    baseCost: 20,
    maxLevel: 10,
    currency: 'ar',
    effectAtLevel: (l) => `+${l * 5}% relic effects`
  },
  {
    id: 'milestone_sharpener',
    label: 'Milestone Sharpener',
    description:
      'Quantity milestones trigger 1 unit earlier per level (floor 10).',
    baseCost: 25,
    maxLevel: 5,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? `Milestones ${l} unit(s) earlier` : 'Not purchased'
  },
  {
    id: 'auto_buy_basic',
    label: 'Auto-Buy (Basic)',
    description:
      'Automatically buys 1 unit of the cheapest affordable generator every 5 seconds.',
    baseCost: 75,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'auto_research_queue',
    label: 'Auto-Research Queue',
    description:
      'Unlocks Study Queue, Smart Sort Presets, and auto-starts next queued node.',
    baseCost: 100,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'super_symmetry',
    label: 'Super-Symmetry',
    description:
      '+10% global production per AR earned (spent AR counts; follows Harmonic Cap).',
    baseCost: 150,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) =>
      l > 0 ? '+10% per AR earned (capped)' : 'Not purchased'
  },
  {
    id: 'challenge_accelerant',
    label: 'Challenge Accelerant',
    description: 'Challenge RP targets reduced by 25%.',
    baseCost: 250,
    maxLevel: 1,
    currency: 'ar',
    effectAtLevel: (l) => (l > 0 ? '-25% challenge targets' : 'Not purchased')
  },
  {
    id: 'quantum_overdrive',
    label: 'Quantum Overdrive',
    description: 'Doubles (2x) global RP production per level.',
    baseCost: 500,
    maxLevel: 20,
    costScaling: 2.0,
    currency: 'ar',
    effectAtLevel: (l) => `${Math.pow(2, l).toLocaleString()}x global RP`
  },
  {
    id: 'arkalon_harmonic_cap',
    label: 'Harmonic Resonance Cap',
    description: 'Raises the passive AR bonus cap by +500 AR per level.',
    baseCost: 1_500,
    maxLevel: 10,
    costScaling: 3.0,
    currency: 'ar',
    effectAtLevel: (l) => `AR cap: ${(500 + l * 500).toLocaleString()} AR`
  },
  {
    id: 'resonance_compression',
    label: 'Resonance Compression',
    description: '+0.02 to global production exponent per level.',
    baseCost: 25_000,
    maxLevel: 5,
    costScaling: 5.0,
    currency: 'ar',
    effectAtLevel: (l) => `+${(l * 0.02).toFixed(2)} exponent`
  }
]

export const CF_UPGRADES: PrestigeUpgradeDef<keyof CFUpgrades>[] = [
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
    description: 'Future AR yields multiplied by 1.5 x CF held (min 1.5x).',
    baseCost: 15,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? 'AR yields x (1.5 x CF)' : 'Not purchased')
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
    id: 'auto_buy_synthesizers',
    label: 'Auto-Buy Synthesizers',
    description:
      'Automatically buys the cheapest affordable unlocked Synthesizer every 5 seconds.',
    baseCost: 20,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) => (l > 0 ? 'Active' : 'Not purchased')
  },
  {
    id: 'auto_upgrade_relics',
    label: 'Auto-Upgrade Relics',
    description:
      'Automatically upgrades unlocked Relics using Dust up to your target level cap.',
    baseCost: 35,
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
    description: '+25% effectiveness to all equipped relics permanently.',
    baseCost: 30,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) =>
      l > 0 ? '+25% equipped relic effects' : 'Not purchased'
  },
  {
    id: 'bulk_procurement',
    label: 'Bulk Procurement',
    description:
      'Unlocks MAX ALL (M) equipment sweep and Upgrade All modules button.',
    baseCost: 30,
    maxLevel: 1,
    currency: 'cf',
    effectAtLevel: (l) =>
      l > 0 ? 'MAX ALL & Bulk Modules active' : 'Not purchased'
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

export const OS_UPGRADES: PrestigeUpgradeDef<keyof OSUpgrades>[] = [
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
    description:
      '+0.15 + 0.08 * log10(1 + total OS earned) to production exponent (max +0.75).',
    baseCost: 10,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) =>
      l > 0 ? 'Logarithmic OS exponent (cap +0.75)' : 'Not purchased'
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
  },
  {
    id: 'auto_dyson_swarm',
    label: 'Auto-Dyson Swarm',
    description:
      'Automatically initiates and maintains Arkalon Dyson Swarm construction.',
    baseCost: 12,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? 'Auto Dyson Swarm' : 'Not purchased')
  },
  {
    id: 'automated_singular_synthesis',
    label: 'Automated Singular Synthesis',
    description:
      'Auto-executes Tier III prestiges (requires Automated Timeline Severance).',
    baseCost: 30,
    maxLevel: 1,
    currency: 'os',
    effectAtLevel: (l) => (l > 0 ? 'Auto Tier III prestige' : 'Not purchased')
  }
]

// Returns upgrade cost - exponential when costScaling is set, otherwise linear
export function getUpgradeCost(
  def: PrestigeUpgradeDef,
  currentLevel: number
): number {
  if (currentLevel >= def.maxLevel) return 0
  if (def.costScaling) {
    return Math.min(
      2_000_000_000,
      Math.floor(def.baseCost * Math.pow(def.costScaling, currentLevel))
    )
  }
  if (def.maxLevel <= 1) return def.baseCost
  return def.baseCost * (currentLevel + 1)
}
