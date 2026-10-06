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
import SettingsButton from '@/components/ui/SettingsButton'

export default function GamePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-(--bg-primary) text-(--text-primary)">
      <FacilityAlertQueue />
      <WelcomeModal />
      <UpdateModal />
      <GameBootstrap />
      <AnomalyOverlay />
      <SettingsPanel />

      {/* PC header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img
            src="/brand/arkalon-labs-emblem.svg"
            alt="Arkalon Laboratories"
            width={24}
            height={24}
            className="w-5 h-5 sm:w-6 sm:h-6 shrink-0 select-none rounded"
          />
          <span className="font-mono text-xs sm:text-sm font-black uppercase tracking-widest title-labs truncate">
            <span className="hidden sm:inline">Arkalon Laboratories</span>
            <span className="sm:hidden">Arkalon Labs</span>
          </span>
          <span className="hidden md:inline text-(--border-default)">//</span>
          <span className="hidden md:inline font-mono text-xs text-(--text-secondary) truncate">
            Primary Command Engine
          </span>
        </div>
        <SettingsButton />
      </header>

      {/* Desktop RP banner & quick stat pill strip */}
      <div className="hidden lg:block shrink-0">
        <RPBanner />
        <MiniStatStrip />
      </div>

      {/* PC Widescreen: 40% / 28% / 32% three-column grid */}
      <div
        className="hidden lg:grid flex-1 overflow-hidden min-h-0 mx-auto w-full max-w-[1920px]"
        style={{ gridTemplateColumns: '40% 28% 32%' }}
      >
        <LeftColumn />
        <CenterColumn />
        <RightColumn />
      </div>

      {/* Mobile Master Screen (< 1024px) */}
      <MobileScreen />
      <MobileNav />

      <FooterBar />
    </div>
  )
}
