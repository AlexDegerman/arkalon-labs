'use client'

import { useCallback, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { SFX_ASSETS, type SFXAssetKey } from '@/lib/audioAssets'

// Manages a pool of Audio elements per SFX key for overlap-safe playback
const audioPool: Map<SFXAssetKey, HTMLAudioElement[]> = new Map()

function getOrCreateAudio(key: SFXAssetKey, volume: number): HTMLAudioElement {
  const pool = audioPool.get(key) ?? []
  // Find an ended or paused audio element to reuse
  const reusable = pool.find((a) => a.ended || a.paused)
  if (reusable) {
    reusable.volume = volume
    reusable.currentTime = 0
    return reusable
  }

  const audio = new Audio(SFX_ASSETS[key])
  audio.volume = volume
  pool.push(audio)
  audioPool.set(key, pool)
  return audio
}

export function useAudio() {
  const settingsRef = useRef({ volumeSFX: 0.6, muted: false })

  // Keep settings ref in sync without subscribing to re-renders
  const volumeSFX = useGameStore((s) => s.settings.volumeSFX)
  settingsRef.current.volumeSFX = volumeSFX

  const playSFX = useCallback((key: SFXAssetKey) => {
    if (typeof window === 'undefined') return
    const { volumeSFX, muted } = settingsRef.current
    if (muted || volumeSFX <= 0) return

    const audio = getOrCreateAudio(key, volumeSFX)
    audio.play().catch(() => {
      // Autoplay blocked before user gesture - fail silently
    })
  }, [])

  return { playSFX }
}
