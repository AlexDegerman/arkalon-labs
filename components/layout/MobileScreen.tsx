'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import MobileMoreDrawer from '@/components/layout/MobileMoreDrawer'
import ArkalonSphere from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import GeneratorList from '@/components/generators/GeneratorList'
import RPBanner from '@/components/layout/RPBanner'
import MiniStatStrip from '@/components/layout/MiniStatStrip'
import WorkspaceTabBar from '@/components/layout/WorkspaceTabBar'
import WorkspacePanel from '@/components/layout/WorkspacePanel'
import { MobileAnomalyBar } from '@/components/anomalies/AnomalyOverlay'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import { applyArkalonClickBoost } from '@/app/stores/actions'
import RelicsTab from '@/components/relics/RelicsTab'
import FeatureLockOverlay from '@/components/ui/FeatureLockOverlay'
import { FEATURE_MAP } from '@/lib/featureRegistry'
import { dispatchArkalonClick } from '@/lib/dialogueDispatcher'

function RelicsFeatureWrapper() {
  return (
    <FeatureLockOverlay feature={FEATURE_MAP.relics}>
      <RelicsTab />
    </FeatureLockOverlay>
  )
}

function ArkalonTerminalMobile() {
  const lines = useUIStore((s) => s.terminalLines)
  return <ArkalonTerminal lines={lines} maxLines={3} />
}

function MobileArkalonTab() {
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const interactiveArkalon = useGameStore((s) => s.unlocks.interactiveArkalon)
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)

  const sphereState = prestigeAnimating
    ? ('prestige' as const)
    : activeAnomaly
      ? ('anomaly' as const)
      : ('idle' as const)

  function handleClick() {
    if (!interactiveArkalon) return
    applyArkalonClickBoost()
    dispatchArkalonClick()
  }

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col items-center justify-between gap-4 scrollbar-dark">
      <div className="my-auto flex flex-col items-center gap-2">
        <ArkalonSphere
          state={sphereState}
          interactive={interactiveArkalon}
          onClick={handleClick}
          size={140}
        />
      </div>
      <div className="w-full">
        <ArkalonTerminalMobile />
      </div>
    </div>
  )
}

export default function MobileScreen() {
  const { mobileTab, moreDrawerOpen, setMoreDrawerOpen } = useActiveTab()

  return (
    <div className="lg:hidden flex-1 overflow-hidden relative min-h-0 flex flex-col bg-(--bg-primary)">
      {/* Mobile persistent RP banner & stat strip */}
      <RPBanner />
      <MiniStatStrip />

      {/* Active Anomaly Banner */}
      <MobileAnomalyBar />

      {/* Screen Views */}
      <div className="flex-1 overflow-hidden relative min-h-0">
        {/* Lab View */}
        {mobileTab === 'lab' && (
          <div className="h-full flex flex-col min-h-0">
            <GeneratorList />
          </div>
        )}

        {/* Core Telemetry View */}
        {mobileTab === 'arkalon' && <MobileArkalonTab />}

        {/* Research View */}
        {mobileTab === 'research' && (
          <div className="h-full flex flex-col min-h-0">
            <WorkspaceTabBar />
            <WorkspacePanel />
          </div>
        )}

        {/* Relics View */}
        {mobileTab === 'relics' && (
          <div className="h-full min-h-0">
            <RelicsFeatureWrapper />
          </div>
        )}

        {/* More Drawer */}
        {moreDrawerOpen && (
          <MobileMoreDrawer onClose={() => setMoreDrawerOpen(false)} />
        )}
      </div>
    </div>
  )
}
