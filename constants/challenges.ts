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
    rewardDescription: '+5% base output to Tiers 1-3 permanently per tier',
    maxTiers: 5
  },
  {
    id: 'SC2',
    category: 'standard',
    name: 'Blind Research',
    restrictionSummary: 'Technology Matrix disabled.',
    tier1TargetDescription: '5 x 10^6 lifetime RP',
    rewardDescription: '+3% global production per challenge tier completed',
    maxTiers: 5
  },
  {
    id: 'SC3',
    category: 'standard',
    name: 'Silence Protocol',
    restrictionSummary: 'Arkalon dialogue and clicks disabled.',
    tier1TargetDescription: '1 x 10^7 lifetime RP',
    rewardDescription: '+10% Arkalon Branch research speed per tier',
    maxTiers: 5
  },
  {
    id: 'SC4',
    category: 'standard',
    name: 'Isolation Chamber',
    restrictionSummary: 'No generator modules allowed.',
    tier1TargetDescription: '2 x 10^7 lifetime RP',
    rewardDescription: 'Module upgrade costs reduced by 5% per tier',
    maxTiers: 5
  },
  {
    id: 'SC5',
    category: 'standard',
    name: 'Stable Reality',
    restrictionSummary: 'No anomalies spawn.',
    tier1TargetDescription: '5 x 10^7 lifetime RP',
    rewardDescription: '+15% anomaly rewards when anomalies ARE active',
    maxTiers: 5
  },
  {
    id: 'SC6',
    category: 'standard',
    name: 'Efficiency Mandate',
    restrictionSummary: 'Generator costs are 3x normal.',
    tier1TargetDescription: '1 x 10^8 lifetime RP',
    rewardDescription: 'Cost growth factors reduced by 0.005 per tier globally',
    maxTiers: 5
  },
  {
    id: 'SC7',
    category: 'standard',
    name: 'Slow Burn',
    restrictionSummary: 'Research timers are 5x longer.',
    tier1TargetDescription: '2 x 10^8 lifetime RP',
    rewardDescription: '-10% research time per tier (multiplicative)',
    maxTiers: 5
  },
  {
    id: 'SC8',
    category: 'standard',
    name: 'Unstable Constants',
    restrictionSummary: 'Milestone multipliers disabled.',
    tier1TargetDescription: '5 x 10^8 lifetime RP',
    rewardDescription: 'Milestones trigger 1 unit earlier per tier (floor 10)',
    maxTiers: 5
  },
  {
    id: 'SC9',
    category: 'standard',
    name: 'Energy Crisis',
    restrictionSummary: 'Energy Branch research locked.',
    tier1TargetDescription: '1 x 10^9 lifetime RP',
    rewardDescription: 'Offline efficiency permanently +5% per tier',
    maxTiers: 5
  },
  {
    id: 'SC10',
    category: 'standard',
    name: 'Dimensional Lock',
    restrictionSummary: 'Only one research slot (R3 disabled).',
    tier1TargetDescription: '2 x 10^9 lifetime RP',
    rewardDescription: 'Research queue expanded by +1 slot per tier (max 8)',
    maxTiers: 5
  },
  {
    id: 'SC11',
    category: 'standard',
    name: 'Relic Vacuum',
    restrictionSummary: 'No relics can be equipped.',
    tier1TargetDescription: '5 x 10^9 lifetime RP',
    rewardDescription: '+1 relic slot per tier (max 6 total)',
    maxTiers: 3
  },
  {
    id: 'SC12',
    category: 'standard',
    name: 'Total Isolation',
    restrictionSummary: 'SC1 + SC2 + SC5 combined.',
    tier1TargetDescription: '1 x 10^9 lifetime RP',
    rewardDescription: '+1% to ALL permanent multipliers per tier',
    maxTiers: 5
  },
  // Advanced Challenges
  {
    id: 'AC1',
    category: 'advanced',
    name: 'Entropy Reversal',
    restrictionSummary: 'All generators produce at 10% base rate.',
    tier1TargetDescription: '1 x 10^15 lifetime RP',
    rewardDescription: '+0.5% to global production exponent per tier',
    maxTiers: 5
  },
  {
    id: 'AC2',
    category: 'advanced',
    name: 'Closed System',
    restrictionSummary: 'No prestige upgrades active.',
    tier1TargetDescription: '1 x 10^12 lifetime RP',
    rewardDescription: 'AR upgrade effectiveness +20% per tier',
    maxTiers: 5
  },
  {
    id: 'AC3',
    category: 'advanced',
    name: 'Chronal Freeze',
    restrictionSummary:
      'Research timers do not tick (R4 anomaly reduction only).',
    tier1TargetDescription: '1 x 10^10 lifetime RP',
    rewardDescription: 'All research timers permanently -20% per tier',
    maxTiers: 5
  },
  {
    id: 'AC4',
    category: 'advanced',
    name: 'Depth Restriction',
    restrictionSummary: 'Only generators 1-5 available.',
    tier1TargetDescription: '1 x 10^18 lifetime RP',
    rewardDescription:
      'Generators 1-5 base output tripled permanently per tier',
    maxTiers: 5
  },
  {
    id: 'AC5',
    category: 'advanced',
    name: 'Module Overload',
    restrictionSummary: 'Module levels doubled but generator costs 10x.',
    tier1TargetDescription: '1 x 10^20 lifetime RP',
    rewardDescription: 'Module cap increased to Level 8 per tier',
    maxTiers: 3
  },
  {
    id: 'AC6',
    category: 'advanced',
    name: 'Relic Dependency',
    restrictionSummary:
      'Only equipped relics provide production (no base output).',
    tier1TargetDescription: '1 x 10^16 lifetime RP',
    rewardDescription: '+1 relic level per completion (free upgrade)',
    maxTiers: 5
  },
  {
    id: 'AC7',
    category: 'advanced',
    name: 'Anomaly Storm',
    restrictionSummary: 'Anomalies every 60s but last only 10s.',
    tier1TargetDescription: '1 x 10^14 lifetime RP',
    rewardDescription: 'Anomaly base payout +50% permanently per tier',
    maxTiers: 5
  },
  {
    id: 'AC8',
    category: 'advanced',
    name: 'Combined Entropy',
    restrictionSummary: 'AC1 + AC3 combined.',
    tier1TargetDescription: '1 x 10^22 lifetime RP',
    rewardDescription:
      'Unlock 5th research queue slot + 0.1 production exponent',
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
    rewardDescription: '+2% per completed EC to ALL production permanently',
    maxTiers: 5
  },
  {
    id: 'EC2',
    category: 'extreme',
    name: 'Singularity Paradox',
    restrictionSummary: 'Only one generator type at a time.',
    tier1TargetDescription: '1 x 10^120 lifetime RP',
    rewardDescription: 'Unlock generator auto-switcher',
    maxTiers: 1
  },
  {
    id: 'EC3',
    category: 'extreme',
    name: 'Recursive Collapse',
    restrictionSummary: 'Prestige resets every 5 minutes automatically.',
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
