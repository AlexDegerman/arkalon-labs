'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buySynthesizer } from '@/app/stores/actions/synthesizerActions'
import {
  SYNTHESIZERS,
  isSynthesizerUnlocked,
  getSynthesizerCost,
  getSynthesizerCostToBuyN,
  getSynthesizerMaxAffordable,
  getDustGlobalMultiplier
} from '@/lib/synthesizerDefs'
import { FEATURE_MAP } from '@/lib/featureRegistry'
import {
  formatPoints,
  formatPointsShort,
  formatTimeToAfford,
  getAmountColor,
  getNetSpendablePPS
} from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import BuyButton from '@/components/generators/BuyButton'
import type { BulkBuyAmount } from '@/constants/game'

interface Props {
  synthesizerIndex: number
  bulkAmount: BulkBuyAmount
}

const SYNTH_THEMES = [
  {
    icon: '◆',
    border: 'border-amber-400/35',
    bg: 'bg-amber-950/15',
    glow: 'shadow-[0_0_12px_rgba(251,191,36,0.12)]',
    accent: 'text-amber-400',
    tag: 'Dust'
  },
  {
    icon: '⊙',
    border: 'border-orange-400/35',
    bg: 'bg-orange-950/15',
    glow: 'shadow-[0_0_12px_rgba(251,146,60,0.12)]',
    accent: 'text-orange-400',
    tag: 'Dust + Probes'
  },
  {
    icon: '◉',
    border: 'border-cyan-400/35',
    bg: 'bg-cyan-950/15',
    glow: 'shadow-[0_0_12px_rgba(0,240,255,0.12)]',
    accent: 'text-cyan-300',
    tag: 'Operations'
  },
  {
    icon: '⬡',
    border: 'border-purple-400/35',
    bg: 'bg-purple-950/15',
    glow: 'shadow-[0_0_12px_rgba(168,85,247,0.12)]',
    accent: 'text-purple-300',
    tag: 'Amplifier'
  }
] as const

function formatPerMin(val: number): string {
  if (val >= 1000) return `${formatPoints(BigInt(Math.floor(val)))}/m`
  if (val >= 10) return `${val.toFixed(1)}/m`
  return `${val.toFixed(2).replace(/\.00$/, '')}/m`
}

function SynthTimeToAfford({
  cost,
  affordable
}: {
  cost: bigint
  affordable: boolean
}) {
  const [text, setText] = useState('')
  const [isNet, setIsNet] = useState(false)

  useEffect(() => {
    if (affordable) {
      setText('')
      setIsNet(false)
      return
    }
    const update = () => {
      const s = useGameStore.getState()
      const netPPS = getNetSpendablePPS(
        s.cachedPointsPerSecond,
        s.activeMegaprojectId,
        s.megaprojectAllocationPercent
      )
      setText(formatTimeToAfford(cost, s.researchPoints, netPPS))
      setIsNet(
        Boolean(s.activeMegaprojectId && s.megaprojectAllocationPercent > 0)
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [cost, affordable])

  if (!text || affordable) return null
  return (
    <span className="text-[11px] text-(--status-warning)">
      ({text}
      {isNet && text !== '--' ? ' net' : ''})
    </span>
  )
}

function SynthesizerCard({ synthesizerIndex, bulkAmount }: Props) {
  const isCompact = useIsCompactViewport()
  const def = SYNTHESIZERS[synthesizerIndex]
  const theme = SYNTH_THEMES[synthesizerIndex] ?? SYNTH_THEMES[0]

  const quantity = useGameStore((s) => s.synthesizers?.[synthesizerIndex] ?? 0)
  const crucibleQty = useGameStore((s) => s.synthesizers?.[3] ?? 0)
  const dustGlobalMult = useGameStore(getDustGlobalMultiplier)
  const opAnomalyActive = useGameStore((s) =>
    Boolean(s.activeAnomalyType?.startsWith('operation_'))
  )
  const opsUnlocked = useGameStore((s) => s.unlocks.anomalousOperations)
  const unlocked = useGameStore(
    useCallback(
      (s) => isSynthesizerUnlocked(synthesizerIndex, s),
      [synthesizerIndex]
    )
  )

  const maxUnits = useGameStore(
    useCallback(
      (s) =>
        bulkAmount === 'max'
          ? getSynthesizerMaxAffordable(synthesizerIndex, s)
          : 0,
      [synthesizerIndex, bulkAmount]
    )
  )

  const buyCount =
    bulkAmount === 'max'
      ? Math.max(1, maxUnits)
      : bulkAmount === 'milestone'
        ? 1
        : bulkAmount

  const cost = useGameStore(
    useCallback(
      (s) => {
        const qty = s.synthesizers?.[synthesizerIndex] ?? 0
        return bulkAmount === 1
          ? getSynthesizerCost(synthesizerIndex, qty)
          : getSynthesizerCostToBuyN(synthesizerIndex, buyCount, qty)
      },
      [synthesizerIndex, bulkAmount, buyCount]
    )
  )

  const affordable = useGameStore((s) => unlocked && s.researchPoints >= cost)

  if (!def) return null

  if (!unlocked) {
    const featureDef = FEATURE_MAP[def.unlockFeature]
    return (
      <div className="card flex items-center justify-between gap-2 p-2.5 rounded-xl border border-dashed border-(--border-default)/60 bg-(--bg-surface)/40 opacity-75">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0 opacity-70" aria-hidden="true">
            🔒
          </span>
          <div className="min-w-0 flex flex-col gap-0.5">
            <span className="text-xs font-mono font-bold text-(--text-secondary) truncate">
              {def.name}
            </span>
            <span className="text-[10px] font-mono text-amber-400/90 leading-snug">
              Requires {featureDef?.label ?? def.unlockFeature}:{' '}
              {featureDef?.unlockHint}
            </span>
          </div>
        </div>
      </div>
    )
  }

  const crucibleMult = 1 + 0.25 * crucibleQty
  const opMult = synthesizerIndex === 2 && opAnomalyActive ? 3 : 1
  const totalDustPerMin =
    def.dustPerMin * quantity * crucibleMult * dustGlobalMult
  const totalOpPerMin = opsUnlocked
    ? def.opPerMin * quantity * crucibleMult * opMult
    : 0

  return (
    <div
      className={[
        'card flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl transition-all duration-150 border',
        affordable
          ? `${theme.border} ${theme.bg} ${theme.glow}`
          : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      <div
        className={`shrink-0 w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center border bg-[#0c1322] font-mono text-base sm:text-lg ${theme.border} ${theme.accent} ${theme.glow}`}
        aria-hidden="true"
      >
        {theme.icon}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
            {def.name}
          </span>
          <span className={`text-[10px] font-mono ${theme.accent}`}>
            {theme.tag}
          </span>
          {quantity > 0 && (
            <span className="text-[10px] font-mono font-bold text-(--text-primary)">
              • x{quantity}
            </span>
          )}
        </div>

        <p className="text-[10px] sm:text-[11px] text-(--text-secondary) leading-snug">
          {def.description}
        </p>

        <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs font-mono pt-0.5">
          <span
            className={[
              'font-bold',
              getAmountColor(cost) || 'text-(--text-primary)',
              !affordable ? 'opacity-55' : ''
            ].join(' ')}
          >
            {(isCompact ? formatPointsShort : formatPoints)(cost)} RP
          </span>
          <SynthTimeToAfford cost={cost} affordable={affordable} />
        </div>

        {quantity > 0 && (
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono pt-0.5 border-t border-(--border-default)/40 mt-0.5">
            {totalDustPerMin > 0 && (
              <span className="text-amber-400 font-bold">
                +{formatPerMin(totalDustPerMin)} Dust
              </span>
            )}
            {totalOpPerMin > 0 && (
              <span className="text-cyan-300 font-bold">
                +{formatPerMin(totalOpPerMin)} PTS
                {synthesizerIndex === 2 && opAnomalyActive && ' (3x)'}
              </span>
            )}
            {synthesizerIndex === 1 && (
              <span className="text-orange-300 font-bold">
                +{quantity * 5}% Probe Speed
              </span>
            )}
            {synthesizerIndex === 3 && (
              <span className="text-purple-300 font-bold">
                +{quantity * 25}% Synth Mult
              </span>
            )}
          </div>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-center">
        <BuyButton
          cost={cost}
          canAfford={affordable}
          onClick={() =>
            buySynthesizer(
              synthesizerIndex,
              bulkAmount === 'milestone' ? 1 : bulkAmount
            )
          }
          label={
            bulkAmount === 'max'
              ? `MAX (${maxUnits.toLocaleString()})`
              : bulkAmount === 'milestone'
                ? 'x1'
                : `x${bulkAmount}`
          }
        />
      </div>
    </div>
  )
}

export default memo(SynthesizerCard)
