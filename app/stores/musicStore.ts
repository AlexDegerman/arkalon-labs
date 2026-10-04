'use client'

import { create } from 'zustand'
import { useUIStore } from '@/app/stores/uiStore'

export type BGMContext = 'idle' | 'anomaly' | 'prestige' | 'operation'

interface BGMTrack {
  id: string
  src: string
  loop: boolean
}

// Maps each facility context to its background track configuration
export const BGM_TRACKS: Record<BGMContext, BGMTrack[]> = {
  idle: [{ id: 'idle-01', src: '/music/bgm-idle.mp3', loop: true }],
  anomaly: [{ id: 'anomaly-01', src: '/music/bgm-anomaly.mp3', loop: true }],
  prestige: [{ id: 'prestige-01', src: '/music/bgm-prestige.mp3', loop: true }],
  operation: [
    { id: 'operation-01', src: '/music/bgm-operation.mp3', loop: true }
  ]
}

function pickRandomTrack(context: BGMContext, excludeId?: string): BGMTrack {
  const tracks = BGM_TRACKS[context]
  const pool =
    excludeId && tracks.length > 1
      ? tracks.filter((t) => t.id !== excludeId)
      : tracks
  return pool[Math.floor(Math.random() * pool.length)] ?? tracks[0]
}

const initialTrack = pickRandomTrack('idle')

interface MusicStore {
  context: BGMContext
  trackId: string
  isPlaying: boolean
  isCrossfading: boolean

  // Audio Channels & Master Controls
  muted: boolean
  volumeBGM: number
  volumeSFX: number
  volumeVoice: number

  setContext: (ctx: BGMContext) => void
  advanceTrack: () => void
  setIsPlaying: (playing: boolean) => void
  setIsCrossfading: (crossfading: boolean) => void

  setMuted: (muted: boolean) => void
  setVolumeBGM: (volume: number) => void
  setVolumeSFX: (volume: number) => void
  setVolumeVoice: (volume: number) => void
}

export const useMusicStore = create<MusicStore>()((set, get) => ({
  context: 'idle',
  trackId: initialTrack.id,
  isPlaying: false,
  isCrossfading: false,

  muted: false,
  volumeBGM: 0.4,
  volumeSFX: 0.6,
  volumeVoice: 0.8,

  setContext: (context) => {
    if (context === get().context) return
    const track = pickRandomTrack(context)
    set({ context, trackId: track.id })
  },

  advanceTrack: () => {
    const { context, trackId } = get()
    const next = pickRandomTrack(context, trackId)
    set({ trackId: next.id })
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsCrossfading: (isCrossfading) => set({ isCrossfading }),

  setMuted: (muted) => {
    set({ muted })
    useUIStore.getState().setMusicEnabled(!muted)
    useUIStore.getState().setSfxEnabled(!muted)
  },

  setVolumeBGM: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeBGM: clamped })
    useUIStore.getState().setMusicVolume(clamped)
  },

  setVolumeSFX: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeSFX: clamped })
    useUIStore.getState().setSfxVolume(clamped)
  },

  setVolumeVoice: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeVoice: clamped })
  }
}))
