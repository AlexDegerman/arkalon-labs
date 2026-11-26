import { useCallback, useEffect, useRef, useState } from 'react'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import { useMusicStore } from '@/app/stores/musicStore'
import { saveToLocalStorage } from '@/lib/saveGame'
import { cancelArkalonSpeech, speakArkalon } from '@/lib/arkalonTTS'
import { playSound } from '@/hooks/useSound'

const AUTO_RELOAD_SECONDS = 10
const UPDATE_TTS_LINE =
  'Update detected. Please refresh your app. Your progress will be saved.'

export default function ClientUpdateBanner() {
  const updateAvailable = useUIStore((s) => s.clientUpdateAvailable)
  const [secondsLeft, setSecondsLeft] = useState(AUTO_RELOAD_SECONDS)
  const announcedRef = useRef(false)
  const reloadedRef = useRef(false)

  const handleReload = useCallback(() => {
    if (reloadedRef.current) return
    reloadedRef.current = true
    cancelArkalonSpeech()
    const state = useGameStore.getState()
    if (state._initialized) {
      saveToLocalStorage(state)
    }
    window.location.reload()
  }, [])

  useEffect(() => {
    if (!updateAvailable) return

    if (!announcedRef.current) {
      announcedRef.current = true
      playSound('alert')
      const { muted, volumeVoice } = useMusicStore.getState()
      const voiceEnabled = useGameStore.getState().settings.voiceEnabled
      if (!muted && voiceEnabled) {
        speakArkalon(UPDATE_TTS_LINE, volumeVoice, true)
      }
    }

    const deadline = Date.now() + AUTO_RELOAD_SECONDS * 1000
    setSecondsLeft(AUTO_RELOAD_SECONDS)

    const timer = setInterval(() => {
      const remainingMs = deadline - Date.now()
      if (remainingMs <= 0) {
        clearInterval(timer)
        setSecondsLeft(0)
        handleReload()
        return
      }
      setSecondsLeft(Math.ceil(remainingMs / 1000))
    }, 250)

    return () => clearInterval(timer)
  }, [updateAvailable, handleReload])

  if (!updateAvailable) return null

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-[fade-in_0.2s_ease-out_both]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="client-update-title"
    >
      <div className="card w-full max-w-sm rounded-2xl border border-(--border-accent)/70 bg-(--bg-surface)/95 overflow-hidden flex flex-col shadow-[0_0_40px_rgba(0,240,255,0.25)] backdrop-blur-md font-mono">
        <div className="h-1.5 w-full shrink-0 bg-linear-to-r from-(--border-accent) via-white to-(--border-accent) shadow-[0_0_14px_rgba(0,240,255,0.7)]" />

        <div className="p-5 flex flex-col gap-3.5 text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-(--border-accent) shadow-[0_0_8px_rgba(0,240,255,0.9)] shrink-0" />
            <h3
              id="client-update-title"
              className="text-xs sm:text-sm font-black uppercase tracking-widest text-(--text-accent)"
            >
              Update Detected
            </h3>
          </div>

          <p className="text-xs text-(--text-secondary) leading-relaxed">
            A newer version of Arkalon Laboratories is live. Please refresh your
            app to continue, your progress will be saved automatically.
          </p>

          <div className="w-full">
            <button
              type="button"
              onClick={handleReload}
              autoFocus
              className="w-full py-2.5 text-xs font-black uppercase tracking-widest rounded-xl border border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 active:scale-[0.99] cursor-pointer shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all"
            >
              Reload &amp; Save ({secondsLeft}s)
            </button>

            <p className="mt-2 text-[10px] text-center text-(--text-muted)">
              Automatically reloading and saving in {secondsLeft} seconds...
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
