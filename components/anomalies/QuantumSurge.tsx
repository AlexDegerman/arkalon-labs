'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { resolveAnomaly, updateAnomalyInteraction } from '@/app/stores/actions'

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

    updateAnomalyInteraction(Math.min(1, newCaptures / 5))

    setNodePos(randomPosition())
    setLastMoveTime(Date.now())

    if (newCaptures >= 5 && !resolvedRef.current) {
      resolvedRef.current = true
      setTimeout(() => resolveAnomaly(1.0), 100)
    }
  }, [captures, lastMoveTime])

  const multiplier = Math.min(5, 2 + captures)

  return (
    <div className="flex flex-col gap-3.5 font-mono">
      <div className="flex items-center justify-between text-xs">
        <span className="text-(--text-secondary)">
          Capture shifting core node (&lt;3s per relocation)
        </span>
        <span className="font-bold text-(--text-accent) px-2 py-0.5 rounded border border-(--border-accent)/40 bg-(--border-accent)/10">
          {captures}/5 · {multiplier}x Boost
        </span>
      </div>

      {/* Interaction field */}
      <div
        ref={containerRef}
        className="relative w-full rounded-xl border border-red-500/40 bg-(--bg-elevated) overflow-hidden shadow-inner"
        style={{ height: '200px' }}
        aria-label="Quantum surge interaction field"
      >
        <button
          onClick={handleCapture}
          className={[
            'absolute w-10 h-10 rounded-full border-2 border-(--border-accent) transition-all duration-300 cursor-pointer',
            'flex items-center justify-center focus-visible:outline-none',
            captureFlash
              ? 'bg-(--border-accent) scale-125 shadow-[0_0_20px_rgba(0,240,255,1)]'
              : 'bg-(--border-accent)/20 hover:bg-(--border-accent)/40 shadow-[0_0_12px_rgba(0,240,255,0.4)]'
          ].join(' ')}
          style={{
            left: `calc(${nodePos.x}% - 20px)`,
            top: `calc(${nodePos.y}% - 20px)`
          }}
          aria-label="Capture quantum node"
        >
          <span className="text-xs font-black text-white">◎</span>
        </button>

        <div className="absolute bottom-2.5 left-3 flex gap-1.5">
          {Array.from({ length: 5 }, (_, i) => (
            <div
              key={i}
              className={[
                'w-3 h-3 rounded-full border transition-all',
                i < captures
                  ? 'bg-(--border-accent) border-(--border-accent) shadow-[0_0_6px_rgba(0,240,255,0.8)]'
                  : 'bg-transparent border-(--border-default)'
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      <p className="text-xs text-(--text-secondary) text-center">
        Stabilized Yield:{' '}
        <strong className="text-(--text-accent)">
          {multiplier}x Passive RP Multiplier
        </strong>
      </p>
    </div>
  )
}
