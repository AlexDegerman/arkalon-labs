'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { resolveAnomaly, updateAnomalyInteraction } from '@/app/stores/actions'

// Chrono-Freeze Flux: Match frequency spikes with slider
export function ChronoFreezeFlux() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const baseDuration = useRef(timeRemaining || 60)
  const [sliderValue, setSliderValue] = useState(0.5)
  const [spikePosition, setSpikePosition] = useState(0.5)
  const [alignedTime, setAlignedTime] = useState(0)
  const resolvedRef = useRef(false)
  const rafRef = useRef<number>(0)

  // Animate spike position with frequency-like oscillation
  useEffect(() => {
    let t = 0
    const animate = () => {
      t += 0.016
      // Spike moves with varying frequency
      const pos = 0.5 + 0.4 * Math.sin(t * 2.3) * Math.cos(t * 0.7)
      setSpikePosition(Math.max(0.05, Math.min(0.95, pos)))
      rafRef.current = requestAnimationFrame(animate)
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(rafRef.current)
  }, [])

  // Track alignment
  useEffect(() => {
    const isAligned = Math.abs(sliderValue - spikePosition) < 0.12
    if (isAligned) {
      const newAligned = alignedTime + 0.1
      setAlignedTime(newAligned)
      updateAnomalyInteraction(Math.min(1, newAligned / baseDuration.current))
    }
  }, [sliderValue, spikePosition, alignedTime])

  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      resolveAnomaly(Math.min(1, alignedTime / baseDuration.current))
    }
  }, [timeRemaining, alignedTime])

  const isAligned = Math.abs(sliderValue - spikePosition) < 0.12
  const alignPercent = Math.round((alignedTime / baseDuration.current) * 100)

  return (
    <div className="flex flex-col gap-4 font-mono">
      <p className="text-xs text-(--text-secondary)">
        Keep the slider matched to the frequency spike.
      </p>
      <div className="relative w-full" style={{ height: '56px' }}>
        {/* Frequency spike indicator */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2.5 bg-(--bg-elevated) rounded-full border border-(--border-default)" />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-full transition-none"
          style={{
            left: `calc(${spikePosition * 100}% - 3px)`,
            background: isAligned
              ? 'var(--status-success)'
              : 'var(--border-accent)',
            boxShadow: `0 0 10px ${isAligned ? 'var(--status-success)' : 'var(--border-accent)'}`
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
          aria-label="Frequency alignment slider"
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 w-4 h-8 rounded-md border-2 border-white transition-colors pointer-events-none"
          style={{
            left: `calc(${sliderValue * 100}% - 8px)`,
            background: isAligned
              ? 'var(--status-success)'
              : 'var(--text-secondary)'
          }}
          aria-hidden="true"
        />
      </div>
      <p className="text-xs text-(--text-secondary) text-center">
        Harmonized:{' '}
        <strong className="text-(--text-accent)">{alignPercent}%</strong> ·
        Reward: 5m Timer Freeze + 3x RP Rate
      </p>
    </div>
  )
}

// Solar Flare Overload: Click floating energy flares
export function SolarFlareOverload() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const [flares, setFlares] = useState<
    Array<{ id: number; x: number; y: number }>
  >([])
  const [captured, setCaptured] = useState(0)
  const resolvedRef = useRef(false)
  const flareIdRef = useRef(0)

  // Spawn flares periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setFlares((prev) => {
        if (prev.length >= 6) return prev
        return [
          ...prev,
          {
            id: ++flareIdRef.current,
            x: 10 + Math.random() * 80,
            y: 10 + Math.random() * 80
          }
        ]
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      resolveAnomaly(Math.min(1, captured / 20))
    }
  }, [timeRemaining, captured])

  const handleFlareClick = useCallback(
    (id: number) => {
      setFlares((prev) => prev.filter((f) => f.id !== id))
      const newCaptured = captured + 1
      setCaptured(newCaptured)
      updateAnomalyInteraction(Math.min(1, newCaptured / 20))
    },
    [captured]
  )

  return (
    <div className="flex flex-col gap-3 font-mono">
      <div className="flex items-center justify-between text-xs">
        <span className="text-(--text-secondary)">
          Click the energy flares as they appear.
        </span>
        <span className="text-(--text-accent) font-bold">
          {captured} Flares Captured
        </span>
      </div>
      <div
        className="relative w-full rounded-xl border border-amber-500/40 bg-(--bg-elevated) overflow-hidden"
        style={{ height: '180px' }}
      >
        {flares.map((flare) => (
          <button
            key={flare.id}
            onClick={() => handleFlareClick(flare.id)}
            className="absolute w-8 h-8 rounded-full flex items-center justify-center cursor-pointer active:scale-90 transition-transform"
            style={{
              left: `calc(${flare.x}% - 16px)`,
              top: `calc(${flare.y}% - 16px)`,
              background: 'radial-gradient(circle, #fde047, #ea580c)',
              boxShadow: '0 0 16px #f59e0b'
            }}
            aria-label="Capture energy flare"
          >
            <span className="text-black font-black text-xs">✦</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-(--text-secondary) text-center">
        Reward: 1% of next generator cost per flare
      </p>
    </div>
  )
}

// Gravity Sink Collapse: Enter 3 terminal sequences
function generateSequence(): string {
  const digits = Array.from(
    { length: 3 },
    () => Math.floor(Math.random() * 9) + 1
  )
  return digits.join('-')
}

export function GravitySinkCollapse() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const [SEQUENCES] = useState(() => [
    generateSequence(),
    generateSequence(),
    generateSequence()
  ])
  const [currentSeq, setCurrentSeq] = useState(0)
  const [input, setInput] = useState('')
  const [results, setResults] = useState<boolean[]>([])
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      resolveAnomaly(results.filter(Boolean).length / 3)
    }
  }, [timeRemaining, results])

  function handleSubmit() {
    if (currentSeq >= SEQUENCES.length) return
    const correct = input.trim() === SEQUENCES[currentSeq]
    const newResults = [...results, correct]
    setResults(newResults)
    setInput('')

    if (newResults.length >= SEQUENCES.length && !resolvedRef.current) {
      resolvedRef.current = true
      setTimeout(
        () => resolveAnomaly(newResults.filter(Boolean).length / 3),
        400
      )
    } else {
      setCurrentSeq((s) => s + 1)
    }
    updateAnomalyInteraction(newResults.filter(Boolean).length / 3)
  }

  return (
    <div className="flex flex-col gap-4 font-mono">
      <p className="text-xs text-(--text-secondary)">
        Enter the terminal sequences exactly as shown.
      </p>
      <div className="flex gap-2">
        {SEQUENCES.map((seq, i) => (
          <div
            key={i}
            className={[
              'flex-1 py-2.5 rounded-xl border text-center text-xs font-bold transition-all',
              i < results.length
                ? results[i]
                  ? 'border-(--status-success) text-(--status-success) bg-(--status-success)/10'
                  : 'border-red-500 text-red-400 bg-red-950/20'
                : i === currentSeq
                  ? 'border-(--border-accent) text-(--border-accent) bg-(--border-accent)/10 animate-pulse'
                  : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)/60'
            ].join(' ')}
          >
            {i <= currentSeq || i < results.length ? seq : '???'}
          </div>
        ))}
      </div>
      {currentSeq < SEQUENCES.length && results.length < SEQUENCES.length && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={`Enter sequence ${currentSeq + 1}`}
            className="flex-1 bg-(--bg-elevated) border border-(--border-default) rounded-xl px-3 py-2 text-xs font-mono text-(--text-primary) focus:outline-none focus:border-(--border-accent)"
            autoFocus
          />
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-xs font-mono font-bold uppercase rounded-xl border border-(--border-accent) bg-(--border-accent) text-[#080c14] cursor-pointer hover:brightness-110"
          >
            Submit
          </button>
        </div>
      )}
      <p className="text-xs text-(--text-secondary) text-center">
        Reward: 50% Generator Cost Reduction for 2 Minutes
      </p>
    </div>
  )
}

// Matrix Inversion: Match logic symbol pairs
export function MatrixInversion() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F']
  const [cards] = useState(() => {
    const pairs = [...SYMBOLS, ...SYMBOLS]
      .sort(() => Math.random() - 0.5)
      .map((s, i) => ({ id: i, symbol: s, matched: false, flipped: false }))
    return pairs
  })
  const [cardState, setCardState] = useState(cards)
  const [flippedIds, setFlippedIds] = useState<number[]>([])
  const [matches, setMatches] = useState(0)
  const resolvedRef = useRef(false)

  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      resolveAnomaly(matches / SYMBOLS.length)
    }
  }, [timeRemaining, matches])

  function handleCardClick(id: number) {
    if (resolvedRef.current) return
    const card = cardState.find((c) => c.id === id)
    if (!card || card.matched || card.flipped) return
    if (flippedIds.length >= 2) return

    const newFlipped = [...flippedIds, id]
    setCardState((prev) =>
      prev.map((c) => (c.id === id ? { ...c, flipped: true } : c))
    )
    setFlippedIds(newFlipped)

    if (newFlipped.length === 2) {
      const [a, b] = newFlipped.map(
        (fid) => cardState.find((c) => c.id === fid)!
      )
      setTimeout(() => {
        if (a.symbol === b.symbol) {
          const newMatches = matches + 1
          setMatches(newMatches)
          setCardState((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, matched: true } : c
            )
          )
          updateAnomalyInteraction(newMatches / SYMBOLS.length)
          if (newMatches >= SYMBOLS.length && !resolvedRef.current) {
            resolvedRef.current = true
            setTimeout(() => resolveAnomaly(1.0), 300)
          }
        } else {
          setCardState((prev) =>
            prev.map((c) =>
              newFlipped.includes(c.id) ? { ...c, flipped: false } : c
            )
          )
        }
        setFlippedIds([])
      }, 700)
    }
  }

  return (
    <div className="flex flex-col gap-3 font-mono">
      <div className="flex items-center justify-between text-xs">
        <span className="text-(--text-secondary)">
          Match logic symbol pairs in the grid.
        </span>
        <span className="text-(--text-accent) font-bold">
          {matches}/{SYMBOLS.length} Matched
        </span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {cardState.map((card) => (
          <button
            key={card.id}
            onClick={() => handleCardClick(card.id)}
            disabled={card.matched || (card.flipped && flippedIds.length >= 2)}
            className={[
              'h-11 rounded-xl border text-sm font-bold transition-all cursor-pointer select-none',
              card.matched
                ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) cursor-default'
                : card.flipped
                  ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)'
                  : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:border-(--border-accent)'
            ].join(' ')}
          >
            {card.flipped || card.matched ? card.symbol : '?'}
          </button>
        ))}
      </div>
      <p className="text-xs text-(--text-secondary) text-center">
        Reward: 5x AR Multiplier Strength Temporarily
      </p>
    </div>
  )
}
