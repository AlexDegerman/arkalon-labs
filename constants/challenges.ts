// Static challenge definitions - display metadata only
// Balance parameters live in lib/challengeDefs.ts

export type ChallengeCategory = 'standard' | 'advanced' | 'extreme'

export interface ChallengeDisplayDefinition {
  id: string
  category: ChallengeCategory
  name: string
  restrictionSummary: string
  tier1TargetDescription: string
  rewardDescription: string
  maxTiers: number
}

export const CHALLENGE_DISPLAY: ChallengeDisplayDefinition[] = [
  // Standard Challenges
  {
    id: 'SC1',
    category: 'standard',
    name: 'Manual Labor',
    restrictionSummary: 'No generators above Tier 3.',
    tier1TargetDescription: '1 x 10^6 lifetime RP',
    rewardDescription:
      '2x base output to Tiers 1-3 (compounding) & +5% global RP per tier',
    maxTiers: 3
  },
  {
    id: 'SC2',
    category: 'standard',
    name: 'Blind Research',
    restrictionSummary: 'Research disabled.',
    tier1TargetDescription: '5 x 10^6 lifetime RP',
    rewardDescription:
      'Tier-1 research nodes complete instantly (0s) + 10% global RP per tier',
    maxTiers: 3
  },
  {
    id: 'SC3',
    category: 'standard',
    name: 'Silence Protocol',
    restrictionSummary: 'Arkalon Branch research locked.',
    tier1TargetDescription: '1 x 10^7 lifetime RP',
    rewardDescription: '+15% Arkalon Branch research speed per tier',
    maxTiers: 3
  },
  {
    id: 'SC4',
    category: 'standard',
    name: 'Isolation Chamber',
    restrictionSummary: 'No generator modules allowed.',
    tier1TargetDescription: '2 x 10^7 lifetime RP',
    rewardDescription: 'Module upgrade costs reduced by 10% per tier',
    maxTiers: 3
  },
  {
    id: 'SC5',
    category: 'standard',
    name: 'Stable Reality',
    restrictionSummary: 'No anomalies spawn.',
    tier1TargetDescription: '5 x 10^7 lifetime RP',
    rewardDescription:
      '+10% anomaly buff power & +3s anomaly duration per tier',
    maxTiers: 3
  },
  {
    id: 'SC6',
    category: 'standard',
    name: 'Asset Cap',
    restrictionSummary: 'Maximum 30 units of any generator owned.',
    tier1TargetDescription: '5 x 10^7 lifetime RP',
    rewardDescription:
      'Cost growth factors reduced by 0.01 per tier; Tier 3 unlocks Auto-Buy Optimal',
    maxTiers: 3
  },
  {
    id: 'SC7',
    category: 'standard',
    name: 'Branch Specialization',
    restrictionSummary: 'Only one research branch permitted for the run.',
    tier1TargetDescription: '1 x 10^8 lifetime RP',
    rewardDescription: '-15% research study time per tier (multiplicative)',
    maxTiers: 3
  },
  {
    id: 'SC8',
    category: 'standard',
    name: 'Unstable Constants',
    restrictionSummary: 'Milestone multipliers disabled.',
    tier1TargetDescription: '2 x 10^8 lifetime RP',
    rewardDescription: 'Milestones trigger 2 units earlier per tier (floor 10)',
    maxTiers: 3
  },
  {
    id: 'SC9',
    category: 'standard',
    name: 'Energy Crisis',
    restrictionSummary: 'Energy Branch research locked.',
    tier1TargetDescription: '5 x 10^8 lifetime RP',
    rewardDescription: 'Offline efficiency permanently +10% per tier',
    maxTiers: 3
  },
  {
    id: 'SC10',
    category: 'standard',
    name: 'Dimensional Lock',
    restrictionSummary: 'Only one research slot (R3 disabled).',
    tier1TargetDescription: '1 x 10^9 lifetime RP',
    rewardDescription: 'Research queue expanded by +1 slot per tier',
    maxTiers: 3
  },
  {
    id: 'SC11',
    category: 'standard',
    name: 'Relic Vacuum',
    restrictionSummary:
      'Relics disabled (cannot be equipped and active relic effects are inactive).',
    tier1TargetDescription: '2 x 10^9 lifetime RP',
    rewardDescription: '+1 relic slot per tier (max 6 total)',
    maxTiers: 3
  },
  {
    id: 'SC12',
    category: 'standard',
    name: 'Total Isolation',
    restrictionSummary: 'SC1 + SC2 + SC5 combined.',
    tier1TargetDescription: '1 x 10^9 lifetime RP',
    rewardDescription:
      '+3% global RP production per tier; Tier 3 unlocks Auto-Launch Probe',
    maxTiers: 3
  },
  // Advanced Challenges
  {
    id: 'AC1',
    category: 'advanced',
    name: 'Telemetry Starvation',
    restrictionSummary:
      'Generators only produce RP while active research is in progress.',
    tier1TargetDescription: '1 x 10^15 lifetime RP',
    rewardDescription: '+0.005 to global production exponent per tier',
    maxTiers: 3
  },
  {
    id: 'AC2',
    category: 'advanced',
    name: 'Closed System',
    restrictionSummary: 'No prestige upgrades active.',
    tier1TargetDescription: '1 x 10^12 lifetime RP',
    rewardDescription: 'AR upgrade effectiveness +20% per tier',
    maxTiers: 3
  },
  {
    id: 'AC3',
    category: 'advanced',
    name: 'Chronal Freeze',
    restrictionSummary:
      'Research timers only tick while an anomaly is active (at 5x speed).',
    tier1TargetDescription: '1 x 10^10 lifetime RP',
    rewardDescription: 'All research timers permanently -20% per tier',
    maxTiers: 3
  },
  {
    id: 'AC4',
    category: 'advanced',
    name: 'Depth Restriction',
    restrictionSummary: 'Only generators 1-5 available.',
    tier1TargetDescription: '1 x 10^18 lifetime RP',
    rewardDescription:
      'Generators 1-5 base output tripled permanently per tier',
    maxTiers: 3
  },
  {
    id: 'AC5',
    category: 'advanced',
    name: 'Module Overload',
    restrictionSummary: 'Module levels doubled but generator costs 10x.',
    tier1TargetDescription: '1 x 10^20 lifetime RP',
    rewardDescription: 'Module cap increased by +1 per tier (max Level 8)',
    maxTiers: 3
  },
  {
    id: 'AC6',
    category: 'advanced',
    name: 'Relic Dependency',
    restrictionSummary:
      'Base generator output replaced by 2% per equipped relic level (0 output without relics).',
    tier1TargetDescription: '1 x 10^16 lifetime RP',
    rewardDescription: '+1 relic level per completion (free upgrade)',
    maxTiers: 3
  },
  {
    id: 'AC7',
    category: 'advanced',
    name: 'Anomaly Storm',
    restrictionSummary: 'Anomalies every 60s but last only 10s.',
    tier1TargetDescription: '1 x 10^14 lifetime RP',
    rewardDescription: 'Anomaly buff power +15% permanently per tier',
    maxTiers: 3
  },
  {
    id: 'AC8',
    category: 'advanced',
    name: 'Combined Entropy',
    restrictionSummary: 'AC1 + AC3 combined.',
    tier1TargetDescription: '1 x 10^22 lifetime RP',
    rewardDescription: '+1 research queue slot + 0.1 production exponent',
    maxTiers: 1
  },
  // Extreme Challenges
  {
    id: 'EC1',
    category: 'extreme',
    name: 'Void Protocol',
    restrictionSummary:
      'Generators above Tier 10 disabled. No prestige upgrades. No modules.',
    tier1TargetDescription: '1 x 10^100 lifetime RP',
    rewardDescription:
      '1.25x global RP & +0.01 production exponent per EC1 tier (+2% per unique EC)',
    maxTiers: 5
  },
  {
    id: 'EC2',
    category: 'extreme',
    name: 'Singularity Paradox',
    restrictionSummary: 'Only one generator type at a time.',
    tier1TargetDescription: '1 x 10^120 lifetime RP',
    rewardDescription: '+0.05 to master production exponent permanently',
    maxTiers: 1
  },
  {
    id: 'EC3',
    category: 'extreme',
    name: 'Recursive Collapse',
    restrictionSummary:
      'Prestige & challenge goal progress reset every 5 minutes automatically.',
    tier1TargetDescription: '1 x 10^140 lifetime RP',
    rewardDescription: 'Auto-prestige earns +25% bonus AR',
    maxTiers: 1
  },
  {
    id: 'EC4',
    category: 'extreme',
    name: 'The Final Observation',
    restrictionSummary:
      'Only generators and Arkalon. No tech, modules, relics, anomalies, excavation.',
    tier1TargetDescription: '1 x 10^155 lifetime RP',
    rewardDescription: 'Arkalon global multiplier permanently doubled',
    maxTiers: 1
  }
]

export const CHALLENGE_MAP: Record<string, ChallengeDisplayDefinition> =
  Object.fromEntries(CHALLENGE_DISPLAY.map((c) => [c.id, c]))
