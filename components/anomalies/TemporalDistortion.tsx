'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  resolveAnomaly,
  updateAnomalyInteraction
} from '@/app/stores/gameActions'

// Safe zone moves across the slider at a varying speed
const SAFE_ZONE_WIDTH = 0.18 // fraction of total range
const ZONE_SPEED_BASE = 0.12 // units per second

export default function TemporalDistortion() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const baseDuration = useRef(timeRemaining)
  const [sliderValue, setSliderValue] = useState(0.5)
  const [zoneCenter, setZoneCenter] = useState(0.3)
  const [zoneDirection, setZoneDirection] = useState(1)
  const [alignedTime, setAlignedTime] = useState(0)
  const lastTickRef = useRef(Date.now())
  const resolvedRef = useRef(false)
  const rafRef = useRef<number>(0)

  // Animate the safe zone
  useEffect(() => {
    let center = zoneCenter
    let direction = zoneDirection

    const animate = () => {
      const now = Date.now()
      const delta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now

      // Vary speed slightly
      const speed = ZONE_SPEED_BASE * (0.8 + Math.random() * 0.4)
      center += direction * speed * delta

      if (center > 1 - SAFE_ZONE_WIDTH / 2) {
        center = 1 - SAFE_ZONE_WIDTH / 2
        direction = -1
      } else if (center < SAFE_ZONE_WIDTH / 2) {
        center = SAFE_ZONE_WIDTH / 2
        direction = 1
      }

      setZoneCenter(center)
      setZoneDirection(direction)
      rafRef.current = requestAnimationFrame(animate)
    }

    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Track alignment
  useEffect(() => {
    const isAligned = Math.abs(sliderValue - zoneCenter) < SAFE_ZONE_WIDTH / 2

    if (isAligned) {
      setAlignedTime((t) => t + 0.1)
      updateAnomalyInteraction(
        Math.min(1, (alignedTime + 0.1) / Math.max(1, baseDuration.current))
      )
    }
  }, [sliderValue, zoneCenter, alignedTime])

  // Resolve on expiry
  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      const score = Math.min(1, alignedTime / Math.max(1, baseDuration.current))
      resolveAnomaly(score)
    }
  }, [timeRemaining, alignedTime])

  const isAligned = Math.abs(sliderValue - zoneCenter) < SAFE_ZONE_WIDTH / 2
  const alignPercent = Math.round(
    (alignedTime / Math.max(1, baseDuration.current)) * 100
  )

  const zoneLeft = (zoneCenter - SAFE_ZONE_WIDTH / 2) * 100
  const zoneWidth = SAFE_ZONE_WIDTH * 100

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-(--text-secondary)">
          Keep the slider inside the moving safe zone.
        </p>
        <span
          className={[
            'chip text-xs',
            isAligned
              ? 'border-(--status-success) text-(--status-success)'
              : 'border-(--status-locked) text-(--status-locked)'
          ].join(' ')}
        >
          {isAligned ? 'ALIGNED' : 'OUT'}
        </span>
      </div>

      {/* Slider track with safe zone */}
      <div className="relative w-full" style={{ height: '48px' }}>
        {/* Track */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-(--bg-elevated) rounded border border-(--border-default)" />

        {/* Safe zone */}
        <div
          className={[
            'absolute top-1/2 -translate-y-1/2 h-6 rounded transition-colors',
            isAligned ? 'bg-(--status-success)/30' : 'bg-(--status-warning)/20'
          ].join(' ')}
          style={{
            left: `${zoneLeft}%`,
            width: `${zoneWidth}%`,
            border: `1px solid ${isAligned ? 'var(--status-success)' : 'var(--status-warning)'}`
          }}
          aria-hidden="true"
        />

        {/* Slider input */}
        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(sliderValue * 100)}
          onChange={(e) => setSliderValue(Number(e.target.value) / 100)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer"
          style={{ height: '48px' }}
          aria-label="Alignment slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderValue * 100)}
        />

        {/* Slider thumb visual */}
        <div
          className={[
            'absolute top-1/2 -translate-y-1/2 size-4 h-8 rounded border-2 transition-colors',
            isAligned
              ? 'bg-(--status-success) border-(--status-success)'
              : 'bg-(--text-secondary) border-(--text-secondary)'
          ].join(' ')}
          style={{ left: `calc(${sliderValue * 100}% - 8px)` }}
          aria-hidden="true"
        />
      </div>

      <p className="text-xs font-mono text-(--text-secondary) text-center">
        Alignment: <span className="text-(--text-accent)">{alignPercent}%</span>{' '}
        - 5x research speed while aligned
      </p>
    </div>
  )
}
