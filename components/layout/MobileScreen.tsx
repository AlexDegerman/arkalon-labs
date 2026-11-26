'use client'

import { useEffect } from 'react'
import { useActiveTab, type WorkspaceTab } from '@/hooks/useActiveTab'
import MobileMoreDrawer from '@/components/layout/MobileMoreDrawer'
import ArkalonSphere, {
  CORE_STAGE_LABELS,
  getArkalonCoreStage
} from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import GeneratorList from '@/components/generators/GeneratorList'
import RPBanner from '@/components/layout/RPBanner'
import MiniStatStrip from '@/components/layout/MiniStatStrip'
import WorkspacePanel from '@/components/layout/WorkspacePanel'
import { MobileAnomalyBar } from '@/components/ui/AnomalyOverlay'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import RelicsTab from '@/components/relics/RelicsTab'
import FeatureLockOverlay from '@/components/ui/FeatureLockOverlay'
import { FEATURE_MAP, TAB_FEATURE } from '@/lib/featureRegistry'
import { pulseArkalonCore } from '@/app/stores/actions/researchActions'
import { useActionSignals } from '@/hooks/useActionSignals'
import { ParticleColliderButton } from '@/components/layout/CenterColumn'

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
  const coreStage = useGameStore((s) =>
    getArkalonCoreStage(
      s.stats.peakLifetimePoints ?? s.lifetimePoints,
      s.stats.totalPrestigesTier1 +
        s.stats.totalPrestigesTier2 +
        s.stats.totalPrestigesTier3
    )
  )
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)
  
  const sphereState = prestigeAnimating
    ? ('prestige' as const)
    : activeAnomaly
      ? ('anomaly' as const)
      : ('idle' as const)

  function handleClick() {
    pulseArkalonCore()
  }

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col items-center justify-between gap-4 scrollbar-dark">
      <div className="my-auto flex flex-col items-center gap-2.5">
        <ArkalonSphere
          state={sphereState}
          interactive={true}
          onClick={handleClick}
          size={140}
          stage={coreStage}
        />
        <span className="text-[10px] font-mono uppercase tracking-widest text-(--text-secondary)/80">
          Core Lattice {coreStage}/5 · {CORE_STAGE_LABELS[coreStage]}
        </span>
      </div>
      <div className="w-full flex flex-col gap-2">
        <ArkalonTerminalMobile />
        <ParticleColliderButton />
      </div>
    </div>
  )
}

const MORE_TABS: WorkspaceTab[] = [
  'stats',
  'prestige',
  'modules',
  'excavation',
  'megaprojects',
  'operations',
  'challenges',
  'achievements'
]

export default function MobileScreen() {
  const mobileTab = useActiveTab((s) => s.mobileTab)
  const workspaceTab = useActiveTab((s) => s.workspaceTab)
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const moreDrawerOpen = useActiveTab((s) => s.moreDrawerOpen)
  const setMoreDrawerOpen = useActiveTab((s) => s.setMoreDrawerOpen)
  const unseenUnlockedTabs = useUIStore((s) => s.unseenUnlockedTabs)
  const actionSignals = useActionSignals()
  const unseenMoreCount = MORE_TABS.filter((t) =>
    unseenUnlockedTabs.includes(t)
  ).length
  const hasOtherMoreAction = MORE_TABS.some(
    (t) => t !== workspaceTab && Boolean(actionSignals[t])
  )

  useEffect(() => {
    if (mobileTab === 'research' && workspaceTab === 'directory') {
      setWorkspaceTab('research')
    }
  }, [mobileTab, workspaceTab, setWorkspaceTab])

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

        {/* Research & More Panels View */}
        {mobileTab === 'research' && (
          <div className="h-full flex flex-col min-h-0">
            {workspaceTab !== 'research' && workspaceTab !== 'directory' && (
              <div className="flex items-center justify-between px-3 py-1.5 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0 font-mono">
                <span className="text-xs font-bold text-(--text-accent) uppercase tracking-wider truncate">
                  {TAB_FEATURE[workspaceTab]
                    ? FEATURE_MAP[TAB_FEATURE[workspaceTab]]?.label
                    : workspaceTab}
                </span>
                <button
                  onClick={() => setMoreDrawerOpen(true)}
                  className={[
                    'text-[10px] font-bold px-2 py-0.5 rounded border cursor-pointer shrink-0 flex items-center gap-1 transition-all',
                    unseenMoreCount > 0
                      ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) shadow-[0_0_10px_rgba(57,255,138,0.35)]'
                      : hasOtherMoreAction
                        ? 'border-amber-400/60 bg-amber-500/10 text-amber-300'
                        : 'bg-(--bg-elevated) border-(--border-default) text-(--text-secondary) hover:text-(--text-primary)'
                  ].join(' ')}
                >
                  <span>← More</span>
                  {unseenMoreCount > 0 && (
                    <span className="px-1 rounded bg-(--status-success) text-[#080c14] text-[9px] font-black">
                      +{unseenMoreCount}
                    </span>
                  )}
                </button>
              </div>
            )}
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
