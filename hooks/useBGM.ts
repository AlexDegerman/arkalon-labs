'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useMusicStore, BGM_TRACKS } from '@/app/stores/musicStore'
import { useUIStore } from '@/app/stores/uiStore'

const CROSSFADE_DURATION_MS = 1000
const CROSSFADE_STEPS = 20

export function useBGM() {
  const context = useMusicStore((s) => s.context)
  const trackId = useMusicStore((s) => s.trackId)
  const advanceTrack = useMusicStore((s) => s.advanceTrack)
  const setIsPlaying = useMusicStore((s) => s.setIsPlaying)
  const setIsCrossfading = useMusicStore((s) => s.setIsCrossfading)
  const track =
    BGM_TRACKS[context].find((t) => t.id === trackId) ?? BGM_TRACKS[context][0]
  const musicEnabled = useUIStore((s) => s.musicEnabled)
  const musicVolume = useUIStore((s) => s.musicVolume)

  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const fadeInRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const fadingOutRef = useRef<
    Map<HTMLAudioElement, ReturnType<typeof setInterval>>
  >(new Map())
  const musicVolumeRef = useRef(musicVolume)
  musicVolumeRef.current = musicVolume

  const stopAllFading = useCallback(() => {
    fadingOutRef.current.forEach((timer, fadingAudio) => {
      clearInterval(timer)
      fadingAudio.pause()
      fadingAudio.currentTime = 0
    })
    fadingOutRef.current.clear()
  }, [])

  const stopCurrent = useCallback(
    (fadeOut = true) => {
      if (fadeInRef.current) {
        clearInterval(fadeInRef.current)
        fadeInRef.current = null
      }
      const audio = currentAudioRef.current
      currentAudioRef.current = null

      if (!fadeOut) {
        stopAllFading()
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }
        return
      }

      if (!audio) return
      // Each outgoing track fades independently so rapid event cascades cannot orphan it
      const startVol = audio.volume
      if (startVol <= 0 || audio.paused || audio.ended) {
        audio.pause()
        audio.currentTime = 0
        return
      }
      const step = startVol / CROSSFADE_STEPS
      const intervalMs = CROSSFADE_DURATION_MS / CROSSFADE_STEPS
      const timer = setInterval(() => {
        if (audio.volume > step) {
          audio.volume = Math.max(0, audio.volume - step)
        } else {
          audio.volume = 0
          audio.pause()
          audio.currentTime = 0
          clearInterval(timer)
          fadingOutRef.current.delete(audio)
        }
      }, intervalMs)
      fadingOutRef.current.set(audio, timer)
    },
    [stopAllFading]
  )

  useEffect(() => {
    if (!musicEnabled) {
      stopCurrent(false)
      setIsPlaying(false)
      return
    }
    const src = track.src
    const prev = currentAudioRef.current
    // Already playing this track - compare by track path suffix
    if (prev && !prev.paused && prev.src.includes(src)) {
      return
    }
    setIsCrossfading(true)
    const audio = new Audio(src)
    audio.loop = track.loop
    audio.volume = 0
    // Non-looping tracks rotate to another track of the same context
    const handleEnded = () => advanceTrack()
    if (!track.loop) audio.addEventListener('ended', handleEnded)
    if (prev) stopCurrent(true)
    currentAudioRef.current = audio
    let cancelled = false
    audio
      .play()
      .then(() => {
        if (cancelled || currentAudioRef.current !== audio) {
          audio.pause()
          audio.currentTime = 0
          return
        }
        setIsPlaying(true)
        // Fade in
        if (fadeInRef.current) clearInterval(fadeInRef.current)
        fadeInRef.current = setInterval(() => {
          const targetVol = musicVolumeRef.current
          const step = Math.max(0.01, targetVol / CROSSFADE_STEPS)
          if (audio.volume < targetVol - step) {
            audio.volume = Math.min(targetVol, audio.volume + step)
          } else {
            audio.volume = targetVol
            if (fadeInRef.current) {
              clearInterval(fadeInRef.current)
              fadeInRef.current = null
            }
            setIsCrossfading(false)
          }
        }, CROSSFADE_DURATION_MS / CROSSFADE_STEPS)
      })
      .catch(() => {
        // Autoplay blocked - wait for user interaction
        if (!cancelled) setIsCrossfading(false)
      })
    return () => {
      cancelled = true
      if (fadeInRef.current) {
        clearInterval(fadeInRef.current)
        fadeInRef.current = null
      }
      audio.removeEventListener('ended', handleEnded)
      // Pause immediately if unmounted or interrupted before playback settled
      if (currentAudioRef.current === audio && audio.paused) {
        currentAudioRef.current = null
      }
    }
  }, [
    track,
    musicEnabled,
    advanceTrack,
    stopCurrent,
    setIsPlaying,
    setIsCrossfading
  ])

  useEffect(() => {
    return () => {
      stopCurrent(false)
    }
  }, [stopCurrent])

  // Browsers block autoplay until first interaction - retry once unlocked
  useEffect(() => {
    if (!musicEnabled) return
    function handleInteraction() {
      const audio = currentAudioRef.current
      if (audio && audio.paused) {
        audio.volume = musicVolume
        audio.play().catch(() => {
          // Still blocked - wait for the next interaction
        })
      }
    }
    const events = ['pointerdown', 'keydown', 'touchend'] as const
    events.forEach((e) =>
      window.addEventListener(e, handleInteraction, { passive: true })
    )
    return () =>
      events.forEach((e) => window.removeEventListener(e, handleInteraction))
  }, [musicEnabled, musicVolume])

  // Apply volume changes to the current track without restarting
  useEffect(() => {
    const audio = currentAudioRef.current
    if (!audio || audio.paused) return
    audio.volume = musicEnabled ? musicVolume : 0
  }, [musicVolume, musicEnabled])
}
