'use client'

import { useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import { SYNTHESIZERS, getSynthesizerRates } from '@/lib/synthesizerDefs'
import { getCurrentEra } from '@/lib/eraThresholds'
import SynthesizerCard from './SynthesizerCard'
import { formatPoints } from '@/lib/format'
import type { BulkBuyAmount } from '@/constants/game'

interface Props {
  bulkAmount: BulkBuyAmount
}

function formatRateMin(val: number): string {
  if (val >= 1000) return `${formatPoints(BigInt(Math.floor(val)))}/m`
  if (val >= 10) return `${val.toFixed(1)}/m`
  return `${val.toFixed(2).replace(/\.00$/, '')}/m`
}

export default function SynthesizerList({ bulkAmount }: Props) {
  const opsUnlocked = useGameStore((s) => s.unlocks.anomalousOperations)
  const opAnomalyActive = useGameStore((s) =>
    Boolean(s.activeAnomalyType?.startsWith('operation_'))
  )

  const rates = useGameStore(
    useShallow(useCallback((s) => getSynthesizerRates(s), []))
  )
  const era = useGameStore((s) => getCurrentEra(s.lifetimePoints).era)
  const eraDustMult = 1 + 0.5 * Math.max(0, era - 1)

  return (
    <div className="flex-1 min-h-0 overflow-y-auto scrollbar-dark p-1.5 sm:p-2.5 flex flex-col gap-1.5 sm:gap-2">
      {/* Compact secondary resource rate banner */}
      <div className="flex items-center justify-between gap-2 flex-wrap px-2.5 py-1.5 rounded-xl border border-(--border-default) bg-(--bg-surface)/85 font-mono text-[10px] sm:text-[11px]">
        <div
          className="flex items-center gap-1.5"
          title="Dust output scales by +50% per current run Era and resets with run Era on Prestige."
        >
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
          <span className="text-(--text-secondary)">Dust:</span>
          <span className="font-bold text-amber-400">
            +{formatRateMin(rates.dustPerMin)}
          </span>
          <span className="text-[9px] text-amber-300/75">
            (Era {era}: {eraDustMult}x)
          </span>
        </div>

        {opsUnlocked && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-300 shrink-0" />
            <span className="text-(--text-secondary)">Ops:</span>
            <span className="font-bold text-cyan-300">
              +{formatRateMin(rates.opPerMin)}
              {opAnomalyActive && ' (3x)'}
            </span>
          </div>
        )}
      </div>

      {SYNTHESIZERS.map((def) => (
        <SynthesizerCard
          key={def.id}
          synthesizerIndex={def.index}
          bulkAmount={bulkAmount}
        />
      ))}
    </div>
  )
}
