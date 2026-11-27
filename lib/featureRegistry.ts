import type { WorkspaceTab } from '@/hooks/useActiveTab'

export type FeatureKey =
  | 'techMatrix'
  | 'statistics'
  | 'modules'
  | 'anomalies'
  | 'achievements'
  | 'relics'
  | 'excavation'
  | 'prestige'
  | 'megaprojects'
  | 'anomalousOperations'
  | 'challenges'

export interface FeatureDefinition {
  key: FeatureKey
  label: string
  description: string
  unlockHint: string
  // Which workspace tab this feature corresponds to (if any)
  workspaceTab?: WorkspaceTab
  // Which mobile tab this feature lives on
  mobileTab?: 'lab' | 'arkalon' | 'research' | 'relics' | 'more'
}

export const FEATURE_REGISTRY: FeatureDefinition[] = [
  {
    key: 'techMatrix',
    label: 'Research',
    description:
      'Study specialized nodes across four research branches to permanently alter operational rules. Timer-based research projects.',
    unlockHint: 'Own 10 Research Desks to activate.',
    workspaceTab: 'research',
    mobileTab: 'research'
  },
  {
    key: 'statistics',
    label: 'Statistics',
    description:
      'Review operational diagnostics, historic yield data, calculations per second, total anomalies resolved, and time elapsed.',
    unlockHint: 'Generate 5,000 lifetime Research Points to activate.',
    workspaceTab: 'stats',
    mobileTab: 'more'
  },
  {
    key: 'modules',
    label: 'Generator Modules',
    description:
      'Install specialized physical modules per generator to compound efficiencies, reduce growth factors, and unlock cross-generator synergies.',
    unlockHint: 'Own 10 Server Clusters to activate.',
    workspaceTab: 'modules',
    mobileTab: 'more'
  },
  {
    key: 'anomalies',
    label: 'Laboratory Anomalies',
    description:
      'Stabilize spatial warp distortions and containment breaches for temporary high-impact point and speed multipliers.',
    unlockHint: 'Complete 2 research nodes to activate.',
    mobileTab: 'lab'
  },
  {
    key: 'achievements',
    label: 'Achievements',
    description:
      'Track operational milestones across all facility systems. Each unlocked achievement grants +1% permanent global RP output.',
    unlockHint: 'Earn 3 achievements or play for 5 minutes to activate.',
    workspaceTab: 'achievements',
    mobileTab: 'more'
  },
  {
    key: 'relics',
    label: 'Relics & Artifacts',
    description:
      'Equip non-Euclidean artifacts for compounding global passive multipliers. Three active relic slots.',
    unlockHint: 'Resolve your first Anomaly or complete Node O1 to activate.',
    workspaceTab: 'relics',
    mobileTab: 'relics'
  },
  {
    key: 'excavation',
    label: 'Excavation',
    description:
      'Deploy automated sub-space probes into safe sectors, unstable rifts, or void depths to recover Artifact Dust and Relic fragments.',
    unlockHint: 'Own 25 Server Clusters and 10 Quantum Computers to activate.',
    workspaceTab: 'excavation',
    mobileTab: 'more'
  },
  {
    key: 'prestige',
    label: 'Prestige',
    description:
      'Execute Tier I (Reality Recalibration), Tier II (Timeline Severance), and Tier III (Singular Synthesis) resets for permanent perks.',
    unlockHint: 'Reach 1.0 x 10^9 lifetime Research Points to activate.',
    workspaceTab: 'prestige',
    mobileTab: 'more'
  },
  {
    key: 'megaprojects',
    label: 'Megaprojects',
    description:
      'Allocate passive point generation to construct giant structures that permanently alter simulation logic.',
    unlockHint:
      'Reach 1.0 x 10^12 lifetime RP and own 10 Reality Engines to activate.',
    workspaceTab: 'megaprojects',
    mobileTab: 'more'
  },
  {
    key: 'anomalousOperations',
    label: 'Anomalous Operations',
    description:
      '90-day cosmic observation epochs. Generate Operation Points with Cosmic Telemetry Arrays to buy permanent artifacts and passive boosts.',
    unlockHint: 'Perform your first Prestige reset to activate.',
    workspaceTab: 'operations',
    mobileTab: 'more'
  },
  {
    key: 'challenges',
    label: 'Challenges',
    description:
      'Restricted operational runs with severe constraints to earn permanent facility-wide multipliers.',
    unlockHint: 'Perform your first Prestige reset to activate.',
    workspaceTab: 'challenges',
    mobileTab: 'more'
  }
]

// Lookup by key for O(1) access
export const FEATURE_MAP: Record<FeatureKey, FeatureDefinition> =
  Object.fromEntries(FEATURE_REGISTRY.map((f) => [f.key, f])) as Record<
    FeatureKey,
    FeatureDefinition
  >

// Mapping between workspace tab identifiers and feature keys
export const TAB_FEATURE: Record<string, FeatureKey> = {
  research: 'techMatrix',
  prestige: 'prestige',
  modules: 'modules',
  relics: 'relics',
  excavation: 'excavation',
  megaprojects: 'megaprojects',
  operations: 'anomalousOperations',
  challenges: 'challenges',
  stats: 'statistics',
  achievements: 'achievements'
}