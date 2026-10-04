// Achievement definitions - all checked via dirty flag in tick

import type { GameState } from '@/types/game'

export interface AchievementDefinition {
  id: string
  name: string
  description: string
  // Returns true if the achievement should be awarded
  condition: (state: GameState) => boolean
  // Optional: category for display grouping
  category:
    | 'generators'
    | 'research'
    | 'prestige'
    | 'anomalies'
    | 'relics'
    | 'milestones'
    | 'challenges'
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Generator milestones
  {
    id: 'gen_first',
    name: 'First Steps',
    description: 'Purchase your first Research Desk.',
    category: 'generators',
    condition: (s) => s.generators[0].quantity >= 1n
  },
  {
    id: 'gen_10',
    name: 'Expanding Operations',
    description: 'Own 10 generators of any type.',
    category: 'generators',
    condition: (s) =>
      s.generators.reduce((sum, g) => sum + Number(g.quantity), 0) >= 10
  },
  {
    id: 'gen_100',
    name: 'Industrial Scale',
    description: 'Own 100 generators total.',
    category: 'generators',
    condition: (s) =>
      s.generators.reduce((sum, g) => sum + Number(g.quantity), 0) >= 100
  },
  {
    id: 'gen_1000',
    name: 'Megafacility',
    description: 'Own 1,000 generators total.',
    category: 'generators',
    condition: (s) =>
      s.generators.reduce((sum, g) => sum + Number(g.quantity), 0) >= 1000
  },
  {
    id: 'gen_all_types',
    name: 'Full Spectrum',
    description: 'Own at least one of each of the first 10 generator types.',
    category: 'generators',
    condition: (s) => s.generators.slice(0, 10).every((g) => g.quantity >= 1n)
  },
  {
    id: 'gen_tier20',
    name: 'Void Engineer',
    description: 'Purchase your first Absolute Void Compressor.',
    category: 'generators',
    condition: (s) => s.generators[19].quantity >= 1n
  },
  {
    id: 'gen_milestone_250',
    name: 'Superrecursive',
    description: 'Reach stage 6 (250 owned) with any generator.',
    category: 'generators',
    condition: (s) => s.generators.some((g) => g.quantity >= 250n)
  },
  // Research milestones
  {
    id: 'research_first',
    name: 'First Discovery',
    description: 'Complete your first research node.',
    category: 'research',
    condition: (s) => s.completedResearchNodes.length >= 1
  },
  {
    id: 'research_10',
    name: 'Scholar',
    description: 'Complete 10 research nodes.',
    category: 'research',
    condition: (s) => s.completedResearchNodes.length >= 10
  },
  {
    id: 'research_all',
    name: 'Omniscient',
    description: 'Complete all 40 standard research nodes.',
    category: 'research',
    condition: (s) => {
      const standard = s.completedResearchNodes.filter(
        (id) => !id.includes('_INF')
      )
      return standard.length >= 40
    }
  },
  {
    id: 'research_parallel',
    name: 'Parallel Thinker',
    description: 'Unlock parallel research (complete Node R3).',
    category: 'research',
    condition: (s) => s.completedResearchNodes.includes('R3')
  },
  {
    id: 'research_o10',
    name: 'Synchronicity',
    description: 'Complete Node O10: Arkalon Synchronicity Matrix.',
    category: 'research',
    condition: (s) => s.completedResearchNodes.includes('O10')
  },
  // RP milestones
  {
    id: 'rp_1k',
    name: 'Research Begins',
    description: 'Generate 1,000 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 1_000n
  },
  {
    id: 'rp_1m',
    name: 'Accelerating',
    description: 'Generate 1,000,000 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 1_000_000n
  },
  {
    id: 'rp_1b',
    name: 'Threshold Reached',
    description: 'Generate 1,000,000,000 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 1_000_000_000n
  },
  {
    id: 'rp_1e35',
    name: 'Timeline Fracture',
    description: 'Generate 10^35 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 10n ** 35n
  },
  {
    id: 'rp_1e85',
    name: 'Singularity Approached',
    description: 'Generate 10^85 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 10n ** 85n
  },
  {
    id: 'rp_1e155',
    name: 'The Final Observation',
    description: 'Generate 10^155 lifetime Research Points.',
    category: 'milestones',
    condition: (s) => s.lifetimePoints >= 10n ** 155n
  },
  // Prestige milestones
  {
    id: 'prestige_first',
    name: 'New Dimension',
    description: 'Perform your first Reality Recalibration.',
    category: 'prestige',
    condition: (s) => s.stats.totalPrestigesTier1 >= 1
  },
  {
    id: 'prestige_10',
    name: 'Seasoned Director',
    description: 'Perform 10 Reality Recalibrations.',
    category: 'prestige',
    condition: (s) => s.stats.totalPrestigesTier1 >= 10
  },
  {
    id: 'prestige_50',
    name: 'Dimensional Veteran',
    description: 'Perform 50 Reality Recalibrations.',
    category: 'prestige',
    condition: (s) => s.stats.totalPrestigesTier1 >= 50
  },
  {
    id: 'prestige_tier2',
    name: 'Timeline Severed',
    description: 'Perform your first Timeline Severance.',
    category: 'prestige',
    condition: (s) => s.stats.totalPrestigesTier2 >= 1
  },
  {
    id: 'prestige_tier3',
    name: 'Singular',
    description: 'Perform your first Singular Synthesis.',
    category: 'prestige',
    condition: (s) => s.stats.totalPrestigesTier3 >= 1
  },
  // Anomaly milestones
  {
    id: 'anomaly_first',
    name: 'First Contact',
    description: 'Resolve your first anomaly.',
    category: 'anomalies',
    condition: (s) => s.stats.totalAnomaliesResolved >= 1
  },
  {
    id: 'anomaly_10',
    name: 'Anomaly Hunter',
    description: 'Resolve 10 anomalies.',
    category: 'anomalies',
    condition: (s) => s.stats.totalAnomaliesResolved >= 10
  },
  {
    id: 'anomaly_50',
    name: 'Reality Warden',
    description: 'Resolve 50 anomalies.',
    category: 'anomalies',
    condition: (s) => s.stats.totalAnomaliesResolved >= 50
  },
  // Relic milestones
  {
    id: 'relic_first',
    name: 'Arkalon Bonded',
    description: 'Equip your first relic.',
    category: 'relics',
    condition: (s) => s.relicSlots.some((slot) => slot.relicId !== null)
  },
  {
    id: 'relic_5',
    name: 'Collector',
    description: 'Unlock 5 relics.',
    category: 'relics',
    condition: (s) => s.unlockedRelics.length >= 5
  },
  {
    id: 'relic_all',
    name: 'Relic Master',
    description: 'Unlock all 20 relics.',
    category: 'relics',
    condition: (s) => s.unlockedRelics.length >= 20
  },
  {
    id: 'relic_max',
    name: 'Perfect Form',
    description: 'Upgrade any relic to level 100.',
    category: 'relics',
    condition: (s) => Object.values(s.relicLevels).some((lvl) => lvl >= 100)
  },
  // Challenge milestones
  {
    id: 'challenge_first',
    name: 'Challenger',
    description: 'Complete your first Facility Challenge.',
    category: 'challenges',
    condition: (s) =>
      Object.values(s.challengeRecords).some((r) => r.completedTiers > 0)
  },
  {
    id: 'challenge_all_standard',
    name: 'Standard Bearer',
    description: 'Complete all 12 Standard Challenges (Tier 1).',
    category: 'challenges',
    condition: (s) => {
      const standardIds = [
        'SC1',
        'SC2',
        'SC3',
        'SC4',
        'SC5',
        'SC6',
        'SC7',
        'SC8',
        'SC9',
        'SC10',
        'SC11',
        'SC12'
      ]
      return standardIds.every(
        (id) => (s.challengeRecords[id]?.completedTiers ?? 0) >= 1
      )
    }
  },
  {
    id: 'challenge_ec4',
    name: 'The Final Watcher',
    description: 'Complete The Final Observation (EC4).',
    category: 'challenges',
    condition: (s) => (s.challengeRecords['EC4']?.completedTiers ?? 0) >= 1
  }
]

export const ACHIEVEMENT_MAP: Record<string, AchievementDefinition> =
  Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]))
