'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useMusicStore } from '@/app/stores/musicStore'
import { cancelArkalonSpeech } from '@/lib/arkalonTTS'

export default function VolumeControls() {
  const volumeMusic = useGameStore((s) => s.settings.volumeMusic)
  const volumeSFX = useGameStore((s) => s.settings.volumeSFX)
  const volumeVoice = useGameStore((s) => s.settings.volumeVoice)
  const voiceEnabled = useGameStore((s) => s.settings.voiceEnabled)
  const muted = useMusicStore((s) => s.muted)

  function setVolume(
    field: 'volumeMusic' | 'volumeSFX' | 'volumeVoice',
    value: number
  ) {
    if (field === 'volumeMusic') {
      useMusicStore.getState().setVolumeBGM(value)
    }
    if (field === 'volumeSFX') {
      useMusicStore.getState().setVolumeSFX(value)
    }
    if (field === 'volumeVoice') {
      useMusicStore.getState().setVolumeVoice(value)
    }
  }

  function toggleMute() {
    useMusicStore.getState().setMuted(!muted)
  }

  function toggleVoice() {
    const next = !voiceEnabled
    if (!next) cancelArkalonSpeech()
    useGameStore.setState((s) => ({
      settings: { ...s.settings, voiceEnabled: next }
    }))
  }

  return (
    <div className="flex flex-col gap-3 p-3 rounded-xl bg-(--bg-surface) border border-(--border-default)">
      <div className="flex items-center justify-between pb-1 border-b border-(--border-default)/50">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Audio
        </p>
        <button
          onClick={toggleMute}
          className={[
            'text-[10px] font-mono font-bold px-2 py-0.5 rounded border transition-all cursor-pointer',
            muted
              ? 'border-red-500/40 bg-red-500/10 text-red-400'
              : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary)'
          ].join(' ')}
        >
          {muted ? 'MUTED' : 'MUTE ALL'}
        </button>
      </div>

      {[
        {
          label: 'Background Music',
          field: 'volumeMusic' as const,
          value: volumeMusic
        },
        {
          label: 'Sound Effects',
          field: 'volumeSFX' as const,
          value: volumeSFX
        },
        {
          label: 'Arkalon Voice',
          field: 'volumeVoice' as const,
          value: volumeVoice
        }
      ].map(({ label, field, value }) => {
        const isVoice = field === 'volumeVoice'
        return (
          <div key={field} className="flex flex-col gap-1 font-mono text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-(--text-secondary) text-[11px]">
                  {label}
                </span>
                {isVoice && (
                  <button
                    type="button"
                    onClick={toggleVoice}
                    className={[
                      'text-[9px] font-bold px-1.5 py-0.2 rounded border cursor-pointer transition-colors',
                      voiceEnabled
                        ? 'border-(--status-success)/50 bg-(--status-success)/15 text-(--status-success)'
                        : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                    ].join(' ')}
                  >
                    {voiceEnabled ? 'TTS ON' : 'TTS OFF'}
                  </button>
                )}
              </div>
              <span className="text-(--text-primary) font-bold">
                {Math.round(value * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(value * 100)}
              onChange={(e) => setVolume(field, Number(e.target.value) / 100)}
              className="w-full accent-(--border-accent) cursor-pointer h-1.5 disabled:opacity-40"
              aria-label={`${label} volume`}
              disabled={muted || (isVoice && !voiceEnabled)}
            />
          </div>
        )
      })}
    </div>
  )
}
