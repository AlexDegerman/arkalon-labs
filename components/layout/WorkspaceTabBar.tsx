'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useActiveTab } from '@/hooks/useActiveTab'
import { FEATURE_REGISTRY } from '@/lib/featureRegistry'
import type { WorkspaceTab } from '@/hooks/useActiveTab'

interface TabDefinition {
  id: WorkspaceTab
  label: string
  featureKey?: string
}

const WORKSPACE_TABS: TabDefinition[] = [
  { id: 'research', label: 'Research', featureKey: 'techMatrix' },
  { id: 'prestige', label: 'Prestige', featureKey: 'prestige' },
  { id: 'modules', label: 'Modules', featureKey: 'modules' },
  { id: 'relics', label: 'Relics', featureKey: 'relics' },
  { id: 'excavation', label: 'Excavation', featureKey: 'excavation' },
  { id: 'megaprojects', label: 'Mega', featureKey: 'megaprojects' },
  { id: 'operations', label: 'Ops', featureKey: 'anomalousOperations' },
  { id: 'challenges', label: 'Challenges', featureKey: 'prestige' },
  { id: 'stats', label: 'Stats', featureKey: 'statistics' },
  { id: 'achievements', label: 'Achievements', featureKey: 'achievements' }
]

export default function WorkspaceTabBar() {
  const { workspaceTab, setWorkspaceTab } = useActiveTab()
  const unlocks = useGameStore((s) => s.unlocks)

  return (
    <div
      className="flex items-end border-b border-(--border-default) overflow-x-auto scrollbar-dark shrink-0"
      role="tablist"
      aria-label="Workspace panels"
    >
      {WORKSPACE_TABS.map((tab) => {
        const isUnlocked = tab.featureKey
          ? unlocks[tab.featureKey as keyof typeof unlocks]
          : true
        const isActive = workspaceTab === tab.id

        return (
          <button
            key={tab.id}
            id={`workspace-tab-${tab.id}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`workspace-panel-${tab.id}`}
            onClick={() => setWorkspaceTab(tab.id)}
            className={[
              'workspace-tab',
              isActive ? 'workspace-tab-active' : '',
              !isUnlocked ? 'workspace-tab-locked' : ''
            ].join(' ')}
            title={
              !isUnlocked
                ? (FEATURE_REGISTRY.find((f) => f.key === tab.featureKey)
                    ?.unlockHint ?? 'Locked')
                : undefined
            }
          >
            {!isUnlocked && (
              <span className="mr-1 text-[0.6rem]" aria-hidden="true">
                &#x1F512;
              </span>
            )}
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}
