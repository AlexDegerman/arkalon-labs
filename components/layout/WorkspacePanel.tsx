'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
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
import WorkspaceDirectory from './WorkspaceDirectory'
import { useGameStore } from '@/app/stores/gameStore'

export default function WorkspacePanel() {
  const initialized = useGameStore((s) => s._initialized)
  const workspaceTab = useActiveTab((s) => s.workspaceTab)

  const panels: Record<string, React.ReactNode> = {
    directory: <WorkspaceDirectory />,
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
      <FeatureLockOverlay feature={FEATURE_MAP.challenges}>
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
      className="flex-1 flex flex-col overflow-hidden min-h-0 bg-(--bg-primary)/40"
      role="tabpanel"
      id={`workspace-panel-${workspaceTab}`}
    >
      {!initialized ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
            Synchronizing Workspace...
          </p>
        </div>
      ) : (
        (panels[workspaceTab] ?? <WorkspaceDirectory />)
      )}
    </div>
  )
}
