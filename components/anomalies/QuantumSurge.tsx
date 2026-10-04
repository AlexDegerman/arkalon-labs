'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  resolveAnomaly,
  updateAnomalyInteraction
} from '@/app/stores/gameActions'

const NODE_RELOCATE_INTERVAL = 3000 // ms - node moves every 3s
const CAPTURE_WINDOW = 3000 // ms - capture within 3s of relocation

interface NodePosition {
  x: number // 0-100 percent
  y: number
}

function randomPosition(): NodePosition {
  return {
    x: 10 + Math.random() * 80,
    y: 10 + Math.random() * 80
  }
}

export default function QuantumSurge() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const [nodePos, setNodePos] = useState<NodePosition>(randomPosition)
  const [captures, setCaptures] = useState(0)
  const [lastMoveTime, setLastMoveTime] = useState(Date.now())
  const [captureFlash, setCaptureFlash] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const resolvedRef = useRef(false)

  // Move node on interval
  useEffect(() => {
    const interval = setInterval(() => {
      setNodePos(randomPosition())
      setLastMoveTime(Date.now())
    }, NODE_RELOCATE_INTERVAL)
    return () => clearInterval(interval)
  }, [])

  // Resolve when timer expires
  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      const score = Math.min(1, captures / 5)
      resolveAnomaly(score)
    }
  }, [timeRemaining, captures])

  const handleCapture = useCallback(() => {
    const elapsed = Date.now() - lastMoveTime
    if (elapsed > CAPTURE_WINDOW) return // Too late

    const newCaptures = captures + 1
    setCaptures(newCaptures)
    setCaptureFlash(true)
    setTimeout(() => setCaptureFlash(false), 300)

    // Update interaction value (0-1)
    updateAnomalyInteraction(Math.min(1, newCaptures / 5))

    // Move immediately after capture
    setNodePos(randomPosition())
    setLastMoveTime(Date.now())

    if (newCaptures >= 5 && !resolvedRef.current) {
      resolvedRef.current = true
      setTimeout(() => resolveAnomaly(1.0), 100)
    }
  }, [captures, lastMoveTime])

  const multiplier = Math.min(5, 2 + captures)

  return (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between">
      <p className="text-xs text-(--text-secondary)">
        Click the shifting node. Capture within 3 seconds of each move.
      </p>
      <span className="chip border-(--text-accent) text-(--text-accent)">
        {captures}/5 captures - {multiplier}x
      </span>
    </div>

    {/* Interaction field */}
    <div
      ref={containerRef}
      className="relative w-full rounded border border-#ef4444/40 bg-(--bg-elevated) overflow-hidden"
      style={{ height: '200px' }}
      aria-label="Quantum surge interaction field"
    >
      {/* Moving node */}
      <button
        onClick={handleCapture}
        className={[
          'absolute size-10 rounded-full border-2 border-(--text-accent) transition-all duration-500',
          'flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white',
          captureFlash
            ? 'bg-(--text-accent) scale-125'
            : 'bg-(--text-accent)/20 hover:bg-(--text-accent)/40'
        ].join(' ')}
        style={{
          left: `calc(${nodePos.x}% - 20px)`,
          top: `calc(${nodePos.y}% - 20px)`
        }}
        aria-label="Capture quantum node"
      >
        <span className="text-xs font-mono font-bold text-(--text-accent)">
          ◎
        </span>
      </button>

      {/* Capture count visual */}
      <div className="absolute bottom-2 left-2 flex gap-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className={[
              'size-3 rounded-full border',
              i < captures
                ? 'bg-(--text-accent) border-(--text-accent)'
                : 'bg-transparent border-(--border-default)'
            ].join(' ')}
            aria-hidden="true"
          />
        ))}
      </div>
    </div>

    <p className="text-xs font-mono text-(--text-secondary) text-center">
      Multiplier:{' '}
      <span className="text-(--text-accent)">{multiplier}x</span> passive
      RP
    </p>
  </div>
  )
}
