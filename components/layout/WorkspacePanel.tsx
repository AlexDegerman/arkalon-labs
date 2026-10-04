'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import { useGameStore } from '@/app/stores/gameStore'
import FeatureLockOverlay from '@/components/ui/FeatureLockOverlay'
import { FEATURE_MAP } from '@/lib/featureRegistry'
import ResearchWorkspace from '@/components/research/ResearchWorkspace'
import ModulesWorkspace from '../modules/ModulesWorkspace'
import RelicsTab from '../relics/RelicsTab'
import PrestigeWorkspace from '../prestige/PrestigeWorkspace'
import ExcavationWorkspace from '../excavation/ExcavationWorkspace'
import MegaprojectsWorkspace from '../megaprojects/MegaprojectsWorkspace'
import OperationsWorkspace from '../operations/OperationsWorkspace'
import ChallengeWorkspace from '../challenges/ChallengeWorkspace'
import StatsWorkspace from '../stats/StatsWorkspace'
import AchievementsWorkspace from '../achievements/AchievementsWorkspace'

// Placeholder panels - replaced by real implementations in later commits
function PlaceholderPanel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-32 p-4">
      <p className="terminal text-(--text-secondary) text-xs text-center">
        {label} panel - implemented in later phase
      </p>
    </div>
  )
}

export default function WorkspacePanel() {
  const { workspaceTab } = useActiveTab()

  const panels: Record<string, React.ReactNode> = {
    research: (
      <FeatureLockOverlay feature={FEATURE_MAP.techMatrix}>
        <ResearchWorkspace />
      </FeatureLockOverlay>
    ),
    prestige: (
      <FeatureLockOverlay feature={FEATURE_MAP.prestige}>
        <PrestigeWorkspace />
      </FeatureLockOverlay>
    ),
    modules: (
      <FeatureLockOverlay feature={FEATURE_MAP.modules}>
        <ModulesWorkspace />
      </FeatureLockOverlay>
    ),
    relics: (
      <FeatureLockOverlay feature={FEATURE_MAP.relics}>
        <RelicsTab />
      </FeatureLockOverlay>
    ),
    excavation: (
      <FeatureLockOverlay feature={FEATURE_MAP.excavation}>
        <ExcavationWorkspace />
      </FeatureLockOverlay>
    ),
    megaprojects: (
      <FeatureLockOverlay feature={FEATURE_MAP.megaprojects}>
        <MegaprojectsWorkspace />
      </FeatureLockOverlay>
    ),
    operations: (
      <FeatureLockOverlay feature={FEATURE_MAP.anomalousOperations}>
        <OperationsWorkspace />
      </FeatureLockOverlay>
    ),
    challenges: (
      <FeatureLockOverlay feature={FEATURE_MAP.prestige}>
        <ChallengeWorkspace />
      </FeatureLockOverlay>
    ),
    stats: (
      <FeatureLockOverlay feature={FEATURE_MAP.statistics}>
        <StatsWorkspace />
      </FeatureLockOverlay>
    ),
    achievements: (
      <FeatureLockOverlay feature={FEATURE_MAP.achievements}>
        <AchievementsWorkspace />
      </FeatureLockOverlay>
    )
  }

  return (
    <div
      className="flex-1 overflow-y-auto scrollbar-dark min-h-0"
      role="tabpanel"
      id={`workspace-panel-${workspaceTab}`}
    >
      {panels[workspaceTab] ?? null}
    </div>
  )
}
