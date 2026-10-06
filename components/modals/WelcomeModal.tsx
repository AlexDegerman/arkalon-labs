'use client'

import { useEffect, useState, useCallback, useTransition } from 'react'
import { Dices } from 'lucide-react'
import { useUIStore } from '@/app/stores/uiStore'
import { unlockArkalon, primeArkalonVoices } from '@/lib/arkalonTTS'
import { getOrCreateLabsPlayer } from '@/app/actions/getOrCreateLabsPlayer'
import { rerollPlayerName } from '@/app/actions/rerollPlayerName'
import { UPDATES_VERSION } from '@/lib/updates'

const VERSION_KEY = 'arkalon_labs_version'

export default function WelcomeModal() {
  const { welcomeModalOpen, setWelcomeModalOpen, setUpdateModalOpen } =
    useUIStore()
  const [displayName, setDisplayName] = useState<string>('Loading...')
  const [justRerolled, setJustRerolled] = useState(false)
  const [isRerolling, startReroll] = useTransition()

  useEffect(() => {
    getOrCreateLabsPlayer().then(({ coreId, displayName }) => {
      localStorage.setItem('arkalon_labs_player_id', coreId)
      window.dispatchEvent(
        new CustomEvent('arkalon_player_ready', { detail: coreId })
      )
      setDisplayName(displayName)

      const storedVersion = localStorage.getItem(VERSION_KEY)
      if (!storedVersion) {
        setWelcomeModalOpen(true)
      } else if (storedVersion !== UPDATES_VERSION && setUpdateModalOpen) {
        setUpdateModalOpen(true)
      }
    })
  }, [setWelcomeModalOpen, setUpdateModalOpen])

  const handleReroll = () => {
    if (isRerolling) return
    startReroll(async () => {
      const res = await rerollPlayerName()
      if (res.success && res.nickname) {
        setDisplayName(res.nickname)
        setJustRerolled(true)
        setTimeout(() => setJustRerolled(false), 800)
      }
    })
  }

  const handleEnter = useCallback(() => {
    // Unlock AudioContext and prime TTS on first user gesture
    unlockArkalon()
    primeArkalonVoices()

    localStorage.setItem(VERSION_KEY, UPDATES_VERSION)
    setWelcomeModalOpen(false)
  }, [setWelcomeModalOpen])

  if (!welcomeModalOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/80 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-title"
    >
      <div className="relative w-full max-w-sm rounded-2xl border border-(--border-default) bg-(--bg-surface)/95 shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden backdrop-blur-md animate-[fade-in_0.2s_ease-out_both]">
        {/* Top Accent Highlight Stripe (Cyan Glow) */}
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-(--border-accent) via-white to-(--border-accent) shadow-[0_0_14px_rgba(0,240,255,0.7)]" />

        <div className="px-5 py-6 sm:px-6 sm:py-6 flex flex-col items-center text-center gap-4">
          <div className="flex flex-col gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-(--text-secondary) font-mono">
              WELCOME TO
            </p>
            <h1
              id="welcome-title"
              className="text-2xl font-black tracking-widest title-labs select-none font-mono"
            >
              ARKALON LABS
            </h1>
            <p className="text-[11px] text-(--text-secondary) font-medium leading-relaxed">
              Sci-fi idle incremental laboratory. Upgrade facility generators,
              rack up research points, and scale beyond 10<sup>162</sup>.
            </p>
          </div>

          <div className="w-full">
            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-(--text-secondary) mb-1.5 text-left font-mono">
              YOUR CORE IDENTITY
            </p>

            <div
              className="w-full rounded-xl border px-3.5 py-2.5 flex items-center justify-between gap-2.5 transition-all duration-200"
              style={{
                backgroundColor: justRerolled
                  ? 'rgba(0, 240, 255, 0.12)'
                  : 'var(--bg-elevated)',
                borderColor: justRerolled
                  ? 'var(--border-accent)'
                  : 'var(--border-default)'
              }}
            >
              <span
                className="flex-1 whitespace-nowrap tracking-tight font-bold font-mono text-left"
                style={{
                  fontSize:
                    displayName.length > 18
                      ? '11px'
                      : displayName.length > 13
                        ? '13px'
                        : '15px',
                  color: 'var(--border-accent)'
                }}
              >
                {isRerolling ? '...' : displayName}
              </span>

              <button
                type="button"
                onClick={handleReroll}
                disabled={isRerolling || displayName === 'Loading...'}
                title="Reroll procedural nickname"
                className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-(--border-default) bg-(--bg-surface) text-(--text-secondary) hover:border-(--border-accent) hover:text-(--border-accent) cursor-pointer transition-all disabled:opacity-50"
              >
                <Dices
                  size={12}
                  className={isRerolling ? 'animate-spin' : ''}
                />
                <span>REROLL</span>
              </button>
            </div>

            <p className="mt-1.5 text-[10px] leading-relaxed text-(--text-secondary) text-left font-mono">
              Shared across the Arkalon Network. Reroll anytime in Settings.
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnter}
            className="w-full py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-150 active:scale-[0.98] cursor-pointer bg-(--border-accent) text-[#080c14] hover:brightness-110 font-mono shadow-[0_0_16px_rgba(0,240,255,0.35)]"
          >
            INITIALIZE FACILITY
          </button>

          <div className="flex flex-col gap-0.5 text-[10px] font-mono text-(--text-secondary)">
            <p>Your session is secured on this device.</p>
            <p>
              Save your recovery code on the Network Hub to protect your
              progress.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
