'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import MobileMoreDrawer from '@/components/layout/MobileMoreDrawer'
import ArkalonSphere from '../arkalon/ArkalonSphere'
import ArkalonTerminal from '../arkalon/ArkalonTerminal'
import GeneratorList from '../generators/GeneratorList'
import MiniStatStrip from './MiniStatStrip'
import RPBanner from './RPBanner'
import WorkspaceTabBar from './WorkspaceTabBar'
import WorkspacePanel from './WorkspacePanel'
import { MobileAnomalyBar } from '../anomalies/AnomalyOverlay'

export default function MobileScreen() {
  const { mobileTab, moreDrawerOpen, setMoreDrawerOpen } = useActiveTab()

  return (
    <div className="lg:hidden flex-1 overflow-hidden relative min-h-0 flex flex-col">
      {/* Mobile RP banner - always visible */}
      <RPBanner />
      <MiniStatStrip />

      {/* Mobile anomaly bar - shown above tab content when active */}
      <MobileAnomalyBar />

      {/* Tab content */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {/* Lab tab */}
        {mobileTab === 'lab' && (
          <div className="h-full flex flex-col min-h-0">
            <GeneratorList />
          </div>
        )}

        {/* Arkalon tab */}
        {mobileTab === 'arkalon' && (
          <div className="h-full overflow-y-auto p-4 flex flex-col items-center gap-6 scrollbar-dark">
            <div className="mt-6">
              <ArkalonSphere state="idle" interactive={false} size={140} />
            </div>
            <div className="w-full">
              <ArkalonTerminal
                lines={['System check... complete. Core online.']}
                maxLines={3}
              />
            </div>
          </div>
        )}

        {/* Research tab - workspace panel with tab bar */}
        {mobileTab === 'research' && (
          <div className="h-full flex flex-col min-h-0">
            <WorkspaceTabBar />
            <WorkspacePanel />
          </div>
        )}

        {/* Relics tab */}
        {mobileTab === 'relics' && (
          <div className="h-full overflow-y-auto p-3">
            <p className="terminal text-(--text-secondary) text-xs">
              Relics tab renders here in Phase 9
            </p>
          </div>
        )}

        {/* More drawer */}
        {moreDrawerOpen && (
          <MobileMoreDrawer onClose={() => setMoreDrawerOpen(false)} />
        )}
      </div>
    </div>
  )
}
