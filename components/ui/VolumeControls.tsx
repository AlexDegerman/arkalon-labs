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
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Audio
        </p>
        <button
          onClick={toggleMute}
          className={[
            'chip text-[0.6rem] border transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
            muted
              ? 'border-[#ef4444] text-[#ef4444]'
              : 'border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary)'
          ].join(' ')}
        >
          {muted ? 'Muted' : 'Mute all'}
        </button>
      </div>

      {[
        { label: 'Music', field: 'volumeMusic' as const, value: volumeMusic },
        { label: 'SFX', field: 'volumeSFX' as const, value: volumeSFX },
        { label: 'Voice', field: 'volumeVoice' as const, value: volumeVoice }
      ].map(({ label, field, value }) => (
        <div key={field} className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-(--text-secondary)">
              {label}
            </span>
            <span className="text-xs font-mono text-(--text-primary)">
              {Math.round(value * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(value * 100)}
            onChange={(e) => setVolume(field, Number(e.target.value) / 100)}
            className="w-full accent-(--border-accent) cursor-pointer"
            aria-label={`${label} volume`}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(value * 100)}
            disabled={muted}
          />
        </div>
      ))}
    </div>
  )
}
