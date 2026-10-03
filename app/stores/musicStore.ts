'use client'
import { create } from 'zustand'

export type BGMContext = 'idle' | 'anomaly' | 'prestige' | 'operation'

interface BGMTrack {
  id: string
  src: string
  loop: boolean
}

// Maps each facility context to its background track configuration.
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

  setContext: (ctx: BGMContext) => void
  advanceTrack: () => void
  setIsPlaying: (playing: boolean) => void
  setIsCrossfading: (crossfading: boolean) => void
}

export const useMusicStore = create<MusicStore>()((set, get) => ({
  context: 'idle',
  trackId: initialTrack.id,
  isPlaying: false,
  isCrossfading: false,

  setContext: (context) => {
    // Re-entering the same context keeps the current track alive
    if (context === get().context) return
    const track = pickRandomTrack(context)
    set({ context, trackId: track.id })
  },

  // Called when a non-looping track ends: rotate to another track
  advanceTrack: () => {
    const { context, trackId } = get()
    const next = pickRandomTrack(context, trackId)
    set({ trackId: next.id })
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsCrossfading: (isCrossfading) => set({ isCrossfading })
}))
