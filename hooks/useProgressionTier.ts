'use client'

import { useEffect } from 'react'

export type ProgressionTier = 'low' | 'mid' | 'high'

const MID_THRESHOLD = 10n ** 12n // 10^12
const HIGH_THRESHOLD = 10n ** 48n // 10^48

export function getProgressionTier(lifetimePoints: bigint): ProgressionTier {
  if (lifetimePoints >= HIGH_THRESHOLD) return 'high'
  if (lifetimePoints >= MID_THRESHOLD) return 'mid'
  return 'low'
}

// Applies data-tier attribute to <html> element based on lifetime RP
// Called from the game root once the store is hydrated
export function useProgressionTier(lifetimePoints: bigint) {
  useEffect(() => {
    const tier = getProgressionTier(lifetimePoints)
    document.documentElement.setAttribute('data-tier', tier)
  }, [lifetimePoints])
}

// Applies data-reduced-motion attribute based on settings and prefers-reduced-motion
export function useReducedMotion(reducedMotion: boolean) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    const shouldReduce = reducedMotion || prefersReduced
    document.documentElement.setAttribute(
      'data-reduced-motion',
      shouldReduce ? 'true' : 'false'
    )
  }, [reducedMotion])
}