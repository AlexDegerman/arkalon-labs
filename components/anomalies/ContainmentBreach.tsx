'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { resolveAnomaly } from '@/app/stores/actions'

const SECTOR_COUNT = 5

interface Sector {
  id: number
  pressure: number // 1-5, descending order is correct
  label: string
}

function generateSectors(): Sector[] {
  const pressures = [5, 4, 3, 2, 1]
  // Shuffle display order
  const shuffled = [...pressures].sort(() => Math.random() - 0.5)
  return shuffled.map((pressure, id) => ({
    id,
    pressure,
    label: `Sector ${String.fromCharCode(65 + id)}`
  }))
}

export default function ContainmentBreach() {
  const timeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const [sectors] = useState<Sector[]>(generateSectors)
  const [selected, setSelected] = useState<number[]>([])
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const resolvedRef = useRef(false)

  // Resolve on timer expiry
  useEffect(() => {
    if (timeRemaining <= 0 && !resolvedRef.current) {
      resolvedRef.current = true
      // Partial credit based on how many correct selections were made
      const correctCount = countCorrectSelections(selected, sectors)
      resolveAnomaly(correctCount / SECTOR_COUNT)
    }
  }, [timeRemaining, selected, sectors])

  const handleSectorClick = useCallback(
    (sectorId: number) => {
      if (resolvedRef.current) return
      if (selected.includes(sectorId)) return

      const newSelected = [...selected, sectorId]
      setSelected(newSelected)

      if (newSelected.length === SECTOR_COUNT) {
        // Check if the selection is in correct descending pressure order
        const isCorrect = isCorrectOrder(newSelected, sectors)
        setResult(isCorrect ? 'correct' : 'wrong')
        resolvedRef.current = true

        const score = isCorrect
          ? 1.0
          : countCorrectSelections(newSelected, sectors) / SECTOR_COUNT
        setTimeout(() => resolveAnomaly(score), 500)
      }
    },
    [selected, sectors]
  )

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-(--text-secondary)">
        Select sectors in descending pressure order (highest first).
      </p>

      {result && (
        <div
          className={[
            'text-xs font-mono font-bold text-center py-2 rounded',
            result === 'correct'
              ? 'text-(--status-success) bg-(--status-success)/10'
              : 'text-#ef4444 bg-#ef4444/10'
          ].join(' ')}
        >
          {result === 'correct' ? 'BREACH CONTAINED' : 'CONTAINMENT FAILED'}
        </div>
      )}

      <div className="grid grid-cols-5 gap-2">
        {sectors.map((sector, displayIdx) => {
          const selectionIndex = selected.indexOf(sector.id)
          const isSelected = selectionIndex !== -1

          return (
            <button
              key={sector.id}
              onClick={() => handleSectorClick(sector.id)}
              disabled={isSelected || !!result}
              className={[
                'flex flex-col items-center gap-1 p-2 rounded border text-xs font-mono transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
                isSelected
                  ? 'border-(--text-accent) bg-(--text-accent)/10 cursor-default'
                  : result
                    ? 'border-(--status-locked) opacity-50 cursor-not-allowed'
                    : 'border-(--border-default) hover:border-(--text-accent) cursor-pointer'
              ].join(' ')}
              aria-label={`${sector.label} - pressure ${sector.pressure}`}
              aria-pressed={isSelected}
            >
              <span className="text-(--text-secondary) text-[0.6rem]">
                {sector.label}
              </span>
              {/* Pressure shown only after interaction or as hint */}
              {isSelected && (
                <span className="font-bold text-(--text-accent)">
                  P{sector.pressure}
                </span>
              )}
              {!isSelected && (
                <span className="text-lg">
                  {getPressureIcon(sector.pressure)}
                </span>
              )}
              {isSelected && (
                <span className="text-[0.6rem] text-(--text-secondary)">
                  #{selectionIndex + 1}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <p className="text-xs font-mono text-(--text-secondary) text-center">
        {selected.length}/{SECTOR_COUNT} sectors selected
      </p>
    </div>
  )
}

function getPressureIcon(pressure: number): string {
  return ['▁', '▃', '▅', '▇', '█'][pressure - 1] ?? '?'
}

function isCorrectOrder(selectedOrder: number[], sectors: Sector[]): boolean {
  const pressures = selectedOrder.map(
    (id) => sectors.find((s) => s.id === id)?.pressure ?? 0
  )
  for (let i = 0; i < pressures.length - 1; i++) {
    if (pressures[i] < pressures[i + 1]) return false
  }
  return true
}

function countCorrectSelections(
  selectedOrder: number[],
  sectors: Sector[]
): number {
  let correct = 0
  for (let i = 0; i < selectedOrder.length; i++) {
    const expectedPressure = SECTOR_COUNT - i
    const actualPressure =
      sectors.find((s) => s.id === selectedOrder[i])?.pressure ?? 0
    if (actualPressure === expectedPressure) correct++
  }
  return correct
}
