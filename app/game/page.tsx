import LeftColumn from '@/components/layout/LeftColumn'
import CenterColumn from '@/components/layout/CenterColumn'
import RightColumn from '@/components/layout/RightColumn'
import FooterBar from '@/components/layout/FooterBar'
import MobileScreen from '@/components/layout/MobileScreen'
import MobileNav from '@/components/layout/MobileNav'
import FacilityAlertQueue from '@/components/ui/FacilityAlertQueue'
import MiniStatStrip from '@/components/layout/MiniStatStrip'
import RPBanner from '@/components/layout/RPBanner'
import UpdateModal from '@/components/modals/UpdateModal'
import WelcomeModal from '@/components/modals/WelcomeModal'
import GameBootstrap from '@/components/layout/GameBootstrap'
import AnomalyOverlay from '@/components/anomalies/AnomalyOverlay'
import SettingsPanel from '@/components/settings/SettingsPanel'

export default function GamePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-(--bg-primary)">
      <FacilityAlertQueue />
      <WelcomeModal />
      <UpdateModal />
      <GameBootstrap />
      <AnomalyOverlay />
      <SettingsPanel />

      {/* PC header */}
      <header className="hidden lg:flex items-center justify-between px-4 py-2 border-b border-(--border-default) bg-(--bg-surface) shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-(--text-accent) uppercase tracking-widest">
            Arkalon Laboratories
          </span>
          <span className="text-(--border-default)">//</span>
          <span className="font-mono text-xs text-(--text-secondary)">
            Primary Command Engine
          </span>
        </div>
      </header>

      {/* PC RP banner (below header, above columns) */}
      <div className="hidden lg:block">
        <RPBanner />
        <MiniStatStrip />
      </div>

      {/* Three-column layout - desktop only */}
      <div
        className="hidden lg:grid flex-1 overflow-hidden min-h-0"
        style={{ gridTemplateColumns: '40% 28% 32%' }}
      >
        <LeftColumn />
        <CenterColumn />
        <RightColumn />
      </div>

      <MobileScreen />
      <MobileNav />

      <FooterBar />
    </div>
  )
}
