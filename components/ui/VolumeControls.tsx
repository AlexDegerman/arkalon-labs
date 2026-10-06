'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { useMusicStore } from '@/app/stores/musicStore'

export default function VolumeControls() {
  const volumeMusic = useGameStore((s) => s.settings.volumeMusic)
  const volumeSFX = useGameStore((s) => s.settings.volumeSFX)
  const volumeVoice = useGameStore((s) => s.settings.volumeVoice)
  const muted = useMusicStore((s) => s.muted)

  function setVolume(
    field: 'volumeMusic' | 'volumeSFX' | 'volumeVoice',
    value: number
  ) {
    useGameStore.setState((s) => ({
      settings: { ...s.settings, [field]: value }
    }))
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
          label: 'Ambient BGM',
          field: 'volumeMusic' as const,
          value: volumeMusic
        },
        {
          label: 'Telemetry SFX',
          field: 'volumeSFX' as const,
          value: volumeSFX
        },
        {
          label: 'Oracle Voice',
          field: 'volumeVoice' as const,
          value: volumeVoice
        }
      ].map(({ label, field, value }) => (
        <div key={field} className="flex flex-col gap-1 font-mono text-xs">
          <div className="flex items-center justify-between">
            <span className="text-(--text-secondary) text-[11px]">{label}</span>
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
            className="w-full accent-(--border-accent) cursor-pointer h-1.5"
            aria-label={`${label} volume`}
            disabled={muted}
          />
        </div>
      ))}
    </div>
  )
}
