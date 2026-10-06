'use client'

import { useState, useEffect, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { resolveAnomaly, updateAnomalyInteraction } from '@/app/stores/actions'

const SAFE_ZONE_WIDTH = 0.18
const ZONE_SPEED_BASE = 0.12

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

  useEffect(() => {
    let center = zoneCenter
    let direction = zoneDirection

    const animate = () => {
      const now = Date.now()
      const delta = (now - lastTickRef.current) / 1000
      lastTickRef.current = now

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

  useEffect(() => {
    const isAligned = Math.abs(sliderValue - zoneCenter) < SAFE_ZONE_WIDTH / 2

    if (isAligned) {
      setAlignedTime((t) => t + 0.1)
      updateAnomalyInteraction(
        Math.min(1, (alignedTime + 0.1) / Math.max(1, baseDuration.current))
      )
    }
  }, [sliderValue, zoneCenter, alignedTime])

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
    <div className="flex flex-col gap-4 font-mono">
      <div className="flex items-center justify-between text-xs">
        <span className="text-(--text-secondary)">
          Track slider inside shifting safe zone
        </span>
        <span
          className={[
            'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
            isAligned
              ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success)'
              : 'border-(--status-warning) bg-(--status-warning)/15 text-(--status-warning)'
          ].join(' ')}
        >
          {isAligned ? 'HARMONIZED' : 'DRIFTING'}
        </span>
      </div>

      <div className="relative w-full" style={{ height: '48px' }}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-(--bg-elevated) rounded-full border border-(--border-default)" />

        <div
          className={[
            'absolute top-1/2 -translate-y-1/2 h-6 rounded-lg transition-colors',
            isAligned
              ? 'bg-(--status-success)/30 border border-(--status-success)'
              : 'bg-(--status-warning)/20 border border-(--status-warning)'
          ].join(' ')}
          style={{
            left: `${zoneLeft}%`,
            width: `${zoneWidth}%`
          }}
          aria-hidden="true"
        />

        <input
          type="range"
          min={0}
          max={100}
          value={Math.round(sliderValue * 100)}
          onChange={(e) => setSliderValue(Number(e.target.value) / 100)}
          className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          aria-label="Alignment slider"
        />

        <div
          className={[
            'absolute top-1/2 -translate-y-1/2 w-4 h-8 rounded-md border-2 transition-colors pointer-events-none',
            isAligned
              ? 'bg-(--status-success) border-white shadow-[0_0_10px_rgba(57,255,138,0.8)]'
              : 'bg-(--text-secondary) border-white'
          ].join(' ')}
          style={{ left: `calc(${sliderValue * 100}% - 8px)` }}
          aria-hidden="true"
        />
      </div>

      <p className="text-xs text-(--text-secondary) text-center">
        Total Alignment:{' '}
        <strong className="text-(--text-accent)">{alignPercent}%</strong> ·
        Yields 5x Research Speed
      </p>
    </div>
  )
}
