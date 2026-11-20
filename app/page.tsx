'use client'

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
import SettingsPanel from '@/components/settings/SettingsPanel'
import SettingsButton from '@/components/ui/SettingsButton'
import { ArkalonNetworkWidget } from '@/components/ui/ArkalonNetworkWidget'
import OfflineModal from '@/components/modals/OfflineModal'
import HotkeyModal from '@/components/modals/HotkeyModal'
import ChallengeCompleteModal from '@/components/modals/ChallengeCompleteModal'
import { Volume2, VolumeX } from 'lucide-react'
import { useGameStore } from '@/app/stores/gameStore'
import { useMusicStore } from '@/app/stores/musicStore'
import VictoryModal from '@/components/modals/VictoryModal'

function HeaderMuteButton() {
  const muted = useMusicStore((s) => s.muted)
  return (
    <button
      type="button"
      onClick={() => useMusicStore.getState().setMuted(!muted)}
      title={muted ? 'Unmute All Audio' : 'Mute All Audio'}
      aria-label={muted ? 'Unmute All Audio' : 'Mute All Audio'}
      className={[
        'flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg border transition-colors cursor-pointer',
        muted
          ? 'border-red-500/50 bg-red-500/15 text-red-400 hover:bg-red-500/25'
          : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent)'
      ].join(' ')}
    >
      {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
    </button>
  )
}

export default function GamePage() {
  const crtScanlines = useGameStore((s) => s.settings.crtScanlines)
  return (
    <div className="flex flex-col h-dvh overflow-hidden bg-(--bg-primary) text-(--text-primary)">
      <FacilityAlertQueue />
      <WelcomeModal />
      <UpdateModal />
      <OfflineModal />
      <HotkeyModal />
      <ChallengeCompleteModal />
      <VictoryModal />
      <GameBootstrap />
      <SettingsPanel />

      {/* CRT Scanline Retro Layer */}
      {crtScanlines && (
        <div
          className="pointer-events-none fixed inset-0 z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%)] bg-size-[100%_4px] opacity-40 select-none"
          aria-hidden="true"
        />
      )}

      {/* PC header */}
      <header className="flex items-center justify-between px-3 sm:px-4 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 backdrop-blur-md shrink-0 z-20">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          <img
            src="/brand/arkalon-labs-emblem.svg"
            alt="Arkalon Laboratories"
            width={24}
            height={24}
            className="w-6 h-6 shrink-0 select-none rounded"
          />
          <span className="font-mono text-sm min-[360px]:text-base sm:text-sm font-black uppercase tracking-wider sm:tracking-widest title-labs truncate">
            <span className="hidden sm:inline">Arkalon Laboratories</span>
            <span className="sm:hidden">Arkalon Labs</span>
          </span>
          <span className="hidden md:inline text-(--border-default)">//</span>
          <span className="hidden md:inline font-mono text-xs text-(--text-secondary) truncate">
            Primary Command Engine
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <HeaderMuteButton />
          <ArkalonNetworkWidget theme="dark" />
          <div className="hidden sm:block">
            <SettingsButton />
          </div>
        </div>
      </header>

      {/* PC Widescreen: 68% primary telemetry/lab area + 32% full-height workspace sidebar */}
      <div
        className="hidden lg:grid flex-1 overflow-hidden min-h-0 mx-auto w-full max-w-[1920px]"
        style={{ gridTemplateColumns: '68% 32%' }}
      >
        <div className="flex flex-col min-h-0 overflow-hidden">
          <div className="shrink-0">
            <RPBanner />
            <MiniStatStrip />
          </div>
          <div
            className="grid flex-1 overflow-hidden min-h-0"
            style={{ gridTemplateColumns: '58.82% 41.18%' }}
          >
            <LeftColumn />
            <CenterColumn />
          </div>
        </div>
        <RightColumn />
      </div>

      {/* Mobile Master Screen (< 1024px) */}
      <MobileScreen />
      <MobileNav />

      <FooterBar />
    </div>
  )
}
