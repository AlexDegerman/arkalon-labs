'use client'

import { create } from 'zustand'
import { useUIStore } from '@/app/stores/uiStore'
import { useGameStore } from '@/app/stores/gameStore'
import { cancelArkalonSpeech } from '@/lib/arkalonTTS'
export type BGMContext = 'idle' | 'anomaly'

interface BGMTrack {
  id: string
  src: string
  loop: boolean
}

export const BGM_TRACKS: Record<BGMContext, BGMTrack[]> = {
  idle: [
    { id: 'idle-01', src: '/music/bgm-idle-01.mp3', loop: false },
    { id: 'idle-02', src: '/music/bgm-idle-02.mp3', loop: false },
    { id: 'idle-03', src: '/music/bgm-idle-03.mp3', loop: false }
  ],
  anomaly: [{ id: 'anomaly-01', src: '/music/bgm-anomaly.mp3', loop: true }]
}

function pickRandomTrack(context: BGMContext, excludeId?: string): BGMTrack {
  const tracks = BGM_TRACKS[context]
  const pool =
    excludeId && tracks.length > 1
      ? tracks.filter((t) => t.id !== excludeId)
      : tracks
  return pool[Math.floor(Math.random() * pool.length)] ?? tracks[0]
}

function drawNextIdleTrack(
  lastTrackId: string,
  queue: string[]
): { nextTrack: BGMTrack; nextQueue: string[] } {
  const allIds = BGM_TRACKS.idle.map((t) => t.id)
  let pool = queue.filter((id) => allIds.includes(id) && id !== lastTrackId)

  // Bag exhausted: refill excluding the track that just finished so it never repeats back-to-back
  if (pool.length === 0) {
    pool = allIds.filter((id) => id !== lastTrackId)
    const pickedId = pool[Math.floor(Math.random() * pool.length)] ?? allIds[0]
    const nextTrack =
      BGM_TRACKS.idle.find((t) => t.id === pickedId) ?? BGM_TRACKS.idle[0]
    return {
      nextTrack,
      nextQueue: allIds.filter((id) => id !== pickedId)
    }
  }

  const pickedId = pool[Math.floor(Math.random() * pool.length)] ?? allIds[0]
  const nextTrack =
    BGM_TRACKS.idle.find((t) => t.id === pickedId) ?? BGM_TRACKS.idle[0]
  return {
    nextTrack,
    nextQueue: pool.filter((id) => id !== pickedId)
  }
}

const initialIdleTrack = pickRandomTrack('idle')
const initialIdleQueue = BGM_TRACKS.idle
  .map((t) => t.id)
  .filter((id) => id !== initialIdleTrack.id)

interface MusicStore {
  context: BGMContext
  trackId: string
  lastIdleTrackId: string
  idleQueue: string[]
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
  trackId: initialIdleTrack.id,
  lastIdleTrackId: initialIdleTrack.id,
  idleQueue: initialIdleQueue,
  isPlaying: false,
  isCrossfading: false,

  muted: false,
  volumeBGM: 0.4,
  volumeSFX: 0.6,
  volumeVoice: 0.8,

  setContext: (context) => {
    if (context === get().context) return
    if (context === 'idle') {
      const { nextTrack, nextQueue } = drawNextIdleTrack(
        get().lastIdleTrackId,
        get().idleQueue
      )
      set({
        context,
        trackId: nextTrack.id,
        lastIdleTrackId: nextTrack.id,
        idleQueue: nextQueue
      })
      return
    }
    const track = pickRandomTrack(context)
    set({ context, trackId: track.id })
  },

  advanceTrack: () => {
    const { context, trackId, idleQueue } = get()
    if (context === 'idle') {
      const { nextTrack, nextQueue } = drawNextIdleTrack(trackId, idleQueue)
      set({
        trackId: nextTrack.id,
        lastIdleTrackId: nextTrack.id,
        idleQueue: nextQueue
      })
      return
    }
    const next = pickRandomTrack(context, trackId)
    set({ trackId: next.id })
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),
  setIsCrossfading: (isCrossfading) => set({ isCrossfading }),

  setMuted: (muted) => {
    set({ muted })
    if (muted) cancelArkalonSpeech()
    useUIStore.getState().setMusicEnabled(!muted)
    useUIStore.getState().setSfxEnabled(!muted)
    useGameStore.setState((s) => ({
      settings: { ...s.settings, audioMuted: muted }
    }))
  },

  setVolumeBGM: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeBGM: clamped })
    useUIStore.getState().setMusicVolume(clamped)
    useGameStore.setState((s) => ({
      settings: { ...s.settings, volumeMusic: clamped }
    }))
  },

  setVolumeSFX: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeSFX: clamped })
    useUIStore.getState().setSfxVolume(clamped)
    useGameStore.setState((s) => ({
      settings: { ...s.settings, volumeSFX: clamped }
    }))
  },

  setVolumeVoice: (volume) => {
    const clamped = Math.max(0, Math.min(1, volume))
    set({ volumeVoice: clamped })
    useGameStore.setState((s) => ({
      settings: { ...s.settings, volumeVoice: clamped }
    }))
  }
}))