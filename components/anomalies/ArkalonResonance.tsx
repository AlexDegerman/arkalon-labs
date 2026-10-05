'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { resolveAnomaly } from '@/app/stores/actions'

const SYMBOLS = ['Omega', 'Delta', 'Sigma', 'Phi', 'Psi', 'Lambda'] as const

// Unicode glyphs
const SYMBOL_CHARS: Record<string, string> = {
  Omega: '\u03A9',
  Delta: '\u0394',
  Sigma: '\u03A3',
  Phi: '\u03A6',
  Psi: '\u03A8',
  Lambda: '\u039B'
}

const SEQUENCE_LENGTH = 5

function generateSequence(): string[] {
  return Array.from(
    { length: SEQUENCE_LENGTH },
    () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  )
}

export default function ArkalonResonanceAnomaly() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const [sequence] = useState<string[]>(generateSequence)
  const [input, setInput] = useState<string[]>([])
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const resolvedRef = useRef(false)

  // Resolve on timer expiry
  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      const score = computeScore(input, sequence)
      resolveAnomaly(score)
    }
  }, [timeRemaining, input, sequence])

  // Desktop: keyboard input listener
  useEffect(() => {
    const keyMap: Record<string, string> = {
      o: 'Omega',
      d: 'Delta',
      s: 'Sigma',
      p: 'Phi',
      y: 'Psi',
      l: 'Lambda'
    }

    function handleKey(e: KeyboardEvent) {
      if (resolvedRef.current) return
      const symbol = keyMap[e.key.toLowerCase()]
      if (!symbol) return
      handleSymbolInput(symbol)
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [input, sequence])

  const handleSymbolInput = useCallback(
    (symbol: string) => {
      if (resolvedRef.current) return
      const newInput = [...input, symbol]
      setInput(newInput)

      if (newInput.length === SEQUENCE_LENGTH) {
        const correct = newInput.every((s, i) => s === sequence[i])
        setResult(correct ? 'correct' : 'wrong')
        resolvedRef.current = true
        const score = computeScore(newInput, sequence)
        setTimeout(() => resolveAnomaly(score), 600)
      }
    },
    [input, sequence]
  )

  const handleSymbolTap = useCallback(
    (symbol: string) => {
      if (input.length >= SEQUENCE_LENGTH) return
      handleSymbolInput(symbol)
    },
    [input, handleSymbolInput]
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-(--text-secondary)">
        Tap the symbols in the exact order shown above.{' '}
        <span className="text-[0.65rem] opacity-70">
          (Desktop: O D S P Y L keys)
        </span>
      </p>

      {/* Target sequence */}
      <div className="flex items-center justify-center gap-2">
        {sequence.map((sym, i) => (
          <div
            key={i}
            className={[
              'size-10 rounded border flex items-center justify-center text-xl font-bold transition-colors',
              i < input.length
                ? input[i] === sym
                  ? 'border-(--status-success) bg-(--status-success)/10 text-(--status-success)'
                  : 'border-#ef4444 bg-#ef4444/10 text-#ef4444'
                : 'border-(--border-default) text-(--text-primary)'
            ].join(' ')}
            aria-label={`Symbol ${i + 1}: ${sym}`}
          >
            {SYMBOL_CHARS[sym]}
          </div>
        ))}
      </div>

      {result && (
        <div
          className={[
            'text-xs font-mono font-bold text-center py-2 rounded',
            result === 'correct'
              ? 'text-(--status-success) bg-(--status-success)/10'
              : 'text-#ef4444 bg-#ef4444/10'
          ].join(' ')}
        >
          {result === 'correct' ? 'RESONANCE ACHIEVED' : 'SEQUENCE MISMATCH'}
        </div>
      )}

      {/* Symbol tap grid - mobile primary input */}
      {!result && (
        <div className="grid grid-cols-6 gap-2">
          {SYMBOLS.map((sym) => (
            <button
              key={sym}
              onClick={() => handleSymbolTap(sym)}
              disabled={!!result || input.length >= SEQUENCE_LENGTH}
              className={[
                'h-12 rounded border text-xl font-bold transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                'border-(--border-accent) text-(--text-accent)',
                'hover:bg-(--border-accent)/20 active:bg-(--border-accent)/40',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              ].join(' ')}
              aria-label={`Input symbol ${sym}`}
            >
              {SYMBOL_CHARS[sym]}
            </button>
          ))}
        </div>
      )}

      {/* Input progress */}
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {Array.from({ length: SEQUENCE_LENGTH }, (_, i) => (
            <div
              key={i}
              className={[
                'flex-1 h-1.5 rounded',
                i < input.length ? 'bg-(--text-accent)' : 'bg-(--bg-elevated)'
              ].join(' ')}
              aria-hidden="true"
            />
          ))}
        </div>
        <span className="text-xs font-mono text-(--text-secondary) shrink-0">
          {input.length}/{SEQUENCE_LENGTH}
        </span>
      </div>
    </div>
  )
}

function computeScore(input: string[], sequence: string[]): number {
  if (input.length === 0) return 0
  let correct = 0
  for (let i = 0; i < Math.min(input.length, sequence.length); i++) {
    if (input[i] === sequence[i]) correct++
  }
  return correct / sequence.length
}
