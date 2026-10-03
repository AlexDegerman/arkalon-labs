'use client'
import { useCallback, useRef, useEffect } from 'react'
import { useUIStore } from '@/app/stores/uiStore'

// Define all sound keys used in Labs
export type SoundKey =
  | 'click'
  | 'tick'
  | 'success'
  | 'error'
  | 'level-up'
  | 'prestige'
  | 'anomaly-spawn'
  | 'anomaly-defeat'

const SOUND_MAP: Record<SoundKey, string> = {
  click: '/sounds/click.mp3',
  tick: '/sounds/tick.mp3',
  success: '/sounds/success.mp3',
  error: '/sounds/error.mp3',
  'level-up': '/sounds/level-up.mp3',
  prestige: '/sounds/prestige.mp3',
  'anomaly-spawn': '/sounds/anomaly-spawn.mp3',
  'anomaly-defeat': '/sounds/anomaly-defeat.mp3'
}

// Per-channel volume multipliers applied on top of the user's slider setting.
const VOLUME_MULTIPLIERS: Partial<Record<SoundKey, number>> = {
  tick: 0.5
}

// Standard HTML5 Audio pool for non-rapid sounds
const POOL_SIZE = 3
const poolRef = new Map<
  SoundKey,
  { elements: HTMLAudioElement[]; index: number }
>()

// Web Audio API setup for polyphonic rapid-tap sounds
type PolyKey = 'click' | 'tick'
const POLY_KEYS: PolyKey[] = ['click', 'tick']
let audioCtx: AudioContext | null = null
const polyBuffers: Partial<Record<PolyKey, AudioBuffer>> = {}
let masterGain: GainNode | null = null
const activePolyClicks: { source: AudioBufferSourceNode; gain: GainNode }[] = []
const MAX_POLY = 6

async function initPolyAudio(): Promise<void> {
  if (audioCtx) return
  audioCtx = new AudioContext()
  masterGain = audioCtx.createGain()
  masterGain.connect(audioCtx.destination)
  const ctx = audioCtx
  await Promise.all(
    POLY_KEYS.map(async (key) => {
      try {
        const res = await fetch(SOUND_MAP[key])
        const arrBuf = await res.arrayBuffer()
        polyBuffers[key] = await ctx.decodeAudioData(arrBuf)
      } catch {
        // Polyphonic key stays silent until buffer loads
      }
    })
  )
}

function playPolySound(key: PolyKey, volume: number, playbackRate = 1.0): void {
  const buffer = polyBuffers[key]
  if (!audioCtx || !buffer || !masterGain) return
  if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {})

  if (activePolyClicks.length >= MAX_POLY) {
    const oldest = activePolyClicks.shift()
    if (oldest) {
      oldest.gain.gain.setTargetAtTime(0, audioCtx.currentTime, 0.015)
      setTimeout(() => {
        try {
          oldest.source.stop()
        } catch {}
      }, 60)
    }
  }

  const source = audioCtx.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = playbackRate
  const instanceGain = audioCtx.createGain()
  instanceGain.gain.value = volume
  source.connect(instanceGain)
  instanceGain.connect(masterGain)

  const entry = { source, gain: instanceGain }
  activePolyClicks.push(entry)
  source.onended = () => {
    const idx = activePolyClicks.indexOf(entry)
    if (idx !== -1) activePolyClicks.splice(idx, 1)
  }
  source.start()
}

export function useSound() {
  const sfxEnabled = useUIStore((s) => s.sfxEnabled)
  const sfxVolume = useUIStore((s) => s.sfxVolume)
  const sfxEnabledRef = useRef(sfxEnabled)
  const sfxVolumeRef = useRef(sfxVolume)

  useEffect(() => {
    sfxEnabledRef.current = sfxEnabled
  }, [sfxEnabled])

  useEffect(() => {
    sfxVolumeRef.current = sfxVolume
  }, [sfxVolume])

  // Pre-decode polyphonic buffers and unlock on interaction
  useEffect(() => {
    initPolyAudio()
    const unlock = () => {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume().catch(() => {})
      }
    }
    const events = ['pointerdown', 'keydown', 'touchstart'] as const
    events.forEach((e) =>
      document.addEventListener(e, unlock, { passive: true })
    )
    return () => {
      events.forEach((e) => document.removeEventListener(e, unlock))
    }
  }, [])

  const play = useCallback(
    (key: SoundKey, options?: { playbackRate?: number }) => {
      if (!sfxEnabledRef.current || typeof window === 'undefined') return
      const vol = Math.min(
        1,
        sfxVolumeRef.current * (VOLUME_MULTIPLIERS[key] ?? 1)
      )

      // Route rapid-tap sounds through the Web Audio API polyphony engine
      if (POLY_KEYS.includes(key as PolyKey)) {
        if (audioCtx && polyBuffers[key as PolyKey]) {
          playPolySound(key as PolyKey, vol, options?.playbackRate ?? 1.0)
          return
        }
      }

      // Standard pool for everything else
      let pool = poolRef.get(key)
      if (!pool) {
        const elements: HTMLAudioElement[] = []
        for (let i = 0; i < POOL_SIZE; i++) {
          const audio = new Audio(SOUND_MAP[key])
          audio.preload = 'none'
          elements.push(audio)
        }
        pool = { elements, index: 0 }
        poolRef.set(key, pool)
      }

      const audio = pool.elements[pool.index % POOL_SIZE]
      pool.index = (pool.index + 1) % POOL_SIZE
      audio.currentTime = 0
      audio.volume = vol
      audio.play().catch(() => {})
    },
    []
  )

  return { play }
}
