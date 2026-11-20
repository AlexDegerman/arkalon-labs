'use client'
import { useEffect } from 'react'
import { useUIStore } from '@/app/stores/uiStore'

// Define all sound keys used in Labs
export type SoundKey =
  | 'click'
  | 'purchase'
  | 'alert'
  | 'spawn'
  | 'collect'
  | 'research-complete'
  | 'equip'
  | 'probe'
  | 'build'
  | 'fanfare'
  | 'success'
  | 'fail'
  | 'relic-common'
  | 'relic-rare'
  | 'relic-epic'
  | 'relic-legendary'
  | 'relic-mythical'

export const SOUND_MAP: Record<SoundKey, string> = {
  click: '/sounds/click.mp3',
  purchase: '/sounds/purchase.mp3',
  alert: '/sounds/alert.mp3',
  spawn: '/sounds/spawn.mp3',
  collect: '/sounds/collect.mp3',
  'research-complete': '/sounds/research-complete.mp3',
  equip: '/sounds/equip.mp3',
  probe: '/sounds/probe.mp3',
  build: '/sounds/build.mp3',
  fanfare: '/sounds/fanfare.mp3',
  success: '/sounds/success.wav',
  fail: '/sounds/fail.wav',
  'relic-common': '/sounds/relic_common.mp3',
  'relic-rare': '/sounds/relic_rare.mp3',
  'relic-epic': '/sounds/relic_epic.mp3',
  'relic-legendary': '/sounds/relic_legendary.mp3',
  'relic-mythical': '/sounds/relic_mythical.mp3'
}

// Per-channel volume multipliers applied on top of the user's slider setting.
const VOLUME_MULTIPLIERS: Partial<Record<SoundKey, number>> = {
  click: 0.7,
  purchase: 0.9,
  alert: 0.8,
  build: 0.5,
}

// Standard HTML5 Audio pool for non-rapid sounds
const POOL_SIZE = 3
const poolRef = new Map<
  SoundKey,
  { elements: HTMLAudioElement[]; index: number }
>()

// Web Audio API setup for polyphonic rapid-tap sounds
type PolyKey = 'click' | 'purchase'
const POLY_KEYS: PolyKey[] = ['click', 'purchase']
let audioCtx: AudioContext | null = null
const polyBuffers: Partial<Record<PolyKey, AudioBuffer>> = {}
let masterGain: GainNode | null = null
const activePolyClicks: { source: AudioBufferSourceNode; gain: GainNode }[] = []
const MAX_POLY = 8

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

// Standalone function callable directly from Zustand store actions
const lastPlayAt = new Map<SoundKey, number>()
const SFX_DEDUPE_MS = 250
export function playSound(
  key: SoundKey,
  options?: { playbackRate?: number }
): void {
  if (typeof window === 'undefined') return
  const { sfxEnabled, sfxVolume } = useUIStore.getState()
  if (!sfxEnabled) return
  // Suppress identical non-poly SFX fired by multiple systems in one tick
  if (!POLY_KEYS.includes(key as PolyKey)) {
    const now = performance.now()
    if (now - (lastPlayAt.get(key) ?? 0) < SFX_DEDUPE_MS) return
    lastPlayAt.set(key, now)
  }
  
  const vol = Math.max(
    0,
    Math.min(1, sfxVolume * (VOLUME_MULTIPLIERS[key] ?? 1))
  )

  if (POLY_KEYS.includes(key as PolyKey)) {
    if (audioCtx && polyBuffers[key as PolyKey]) {
      playPolySound(key as PolyKey, vol, options?.playbackRate ?? 1.0)
      return
    }
  }

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
}

export function useSound() {
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

  return { play: playSound }
}