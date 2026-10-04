import type { WorkspaceTab } from '@/hooks/useActiveTab'

export type FeatureKey =
  | 'techMatrix'
  | 'statistics'
  | 'modules'
  | 'anomalies'
  | 'interactiveArkalon'
  | 'achievements'
  | 'relics'
  | 'excavation'
  | 'prestige'
  | 'megaprojects'
  | 'anomalousOperations'

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
    label: 'Technology Matrix',
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
    unlockHint: 'Generate 1,000 lifetime Research Points to activate.',
    workspaceTab: 'stats',
    mobileTab: 'more'
  },
  {
    key: 'modules',
    label: 'Generator Modules',
    description:
      'Install specialized physical modules per generator to compound efficiencies, reduce growth factors, and unlock cross-generator synergies.',
    unlockHint: 'Own 1 Server Cluster to activate.',
    workspaceTab: 'modules',
    mobileTab: 'more'
  },
  {
    key: 'anomalies',
    label: 'Laboratory Anomalies',
    description:
      'Stabilize spatial warp distortions and containment breaches for temporary high-impact point and speed multipliers.',
    unlockHint:
      'Complete any first-tier research node (C1, E1, R1, or O1) to activate.',
    mobileTab: 'lab'
  },
  {
    key: 'interactiveArkalon',
    label: 'Interactive Arkalon',
    description:
      'Click-based interactions on the central Arkalon visual display advanced dialogue hints and boost research speed.',
    unlockHint: 'Research Node O1 (Synaptic Resonance) to activate.',
    mobileTab: 'arkalon'
  },
  {
    key: 'achievements',
    label: 'Achievements',
    description:
      'Track operational excellence. Complete facility-wide tasks to unlock custom UI color themes, operational titles, and profile badges.',
    unlockHint:
      'Earn your first achievement or play for 5 minutes to activate.',
    workspaceTab: 'achievements',
    mobileTab: 'more'
  },
  {
    key: 'relics',
    label: 'Relics & Artifacts',
    description:
      'Equip non-Euclidean artifacts for compounding global passive multipliers. Three active relic slots.',
    unlockHint: 'Resolve your first Anomaly or complete Node O1 to activate.',
    mobileTab: 'relics'
  },
  {
    key: 'excavation',
    label: 'Excavation',
    description:
      'Deploy automated sub-space probes into safe sectors, unstable rifts, or void depths to recover Artifact Dust and Relic fragments.',
    unlockHint: 'Own 5 Quantum Computers to activate.',
    workspaceTab: 'excavation',
    mobileTab: 'more'
  },
  {
    key: 'prestige',
    label: 'Reality Recalibration',
    description:
      'Collapse the active construct and rebuild in a parallel dimension, earning Arkalon Resonance for permanent perks.',
    unlockHint: 'Reach 1.0 x 10^9 lifetime Research Points to activate.',
    workspaceTab: 'prestige',
    mobileTab: 'more'
  },
  {
    key: 'megaprojects',
    label: 'Megaprojects',
    description:
      'Allocate passive point generation to construct giant structures that permanently alter simulation logic.',
    unlockHint: 'Reach Era II and own 10 Reality Engines to activate.',
    workspaceTab: 'megaprojects',
    mobileTab: 'more'
  },
  {
    key: 'anomalousOperations',
    label: 'Anomalous Operations',
    description:
      'Join global 90-day operations. Stabilize custom anomalies to earn exclusive progression points and permanent cosmic relics.',
    unlockHint: 'Perform your first Reality Recalibration to activate.',
    workspaceTab: 'operations',
    mobileTab: 'more'
  }
]

// Lookup by key for O(1) access
export const FEATURE_MAP: Record<FeatureKey, FeatureDefinition> =
  Object.fromEntries(FEATURE_REGISTRY.map((f) => [f.key, f])) as Record<
    FeatureKey,
    FeatureDefinition
  >
