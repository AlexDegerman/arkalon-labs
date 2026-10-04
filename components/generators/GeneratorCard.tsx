'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyGenerator } from '@/app/stores/gameActions'
import { canAfford, nextCost } from '@/lib/generatorCosts'
import {
  formatPoints,
  formatTimeToAfford,
  formatMilestoneTarget
} from '@/lib/format'
import { GENERATORS } from '@/constants/generators'
import {
  MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_INTERVAL,
  RESEARCH_DESK_MILESTONE_CAP
} from '@/constants/game'
import type { BulkBuyAmount } from '@/constants/game'
import GeneratorIcon from '@/components/generators/svg/GeneratorIcon'
import BuyButton from '@/components/generators/BuyButton'
import TutorialArrow from '../tutorial/TutorialArrow'
import TutorialHighlight from '../tutorial/TutorialHighlight'

interface Props {
  generatorIndex: number
  bulkAmount: BulkBuyAmount
}

function getMilestoneInterval(index: number, quantity: bigint): number {
  if (index === 0 && quantity < BigInt(RESEARCH_DESK_MILESTONE_CAP)) {
    return RESEARCH_DESK_MILESTONE_INTERVAL
  }
  return MILESTONE_INTERVAL
}

function getStage(quantity: bigint): 1 | 2 | 3 | 4 | 5 | 6 {
  const q = Number(quantity)
  if (q >= 250) return 6
  if (q >= 100) return 5
  if (q >= 50) return 4
  if (q >= 25) return 3
  if (q >= 10) return 2
  return 1
}

function GeneratorCard({ generatorIndex, bulkAmount }: Props) {
  const def = GENERATORS[generatorIndex]

  // Narrow selectors - only subscribe to what this card needs
  const quantity = useGameStore(
    (s) => s.generators[generatorIndex]?.quantity ?? 0n
  )
  const researchPoints = useGameStore((s) => s.researchPoints)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)

  const state = useGameStore.getState()
  const cost = nextCost(generatorIndex, state)
  const affordable = canAfford(generatorIndex, state)

  if (!def) return null

  const stage = getStage(quantity)
  const interval = getMilestoneInterval(generatorIndex, quantity)
  const milestoneStr = formatMilestoneTarget(quantity, interval)
  const timeToAfford = affordable
    ? ''
    : formatTimeToAfford(cost, researchPoints, pps)

  function handleBuy() {
    buyGenerator(generatorIndex, bulkAmount)
  }

  const isLocked = quantity === 0n && researchPoints < def.baseCost / 2n

  return (
    <div
      className={[
        'card flex items-center gap-3 p-3 rounded-lg transition-colors',
        affordable ? 'affordable' : '',
        isLocked ? 'opacity-50' : ''
      ].join(' ')}
    >
      {/* SVG icon */}
      <div className="shrink-0">
        <GeneratorIcon
          generatorIndex={generatorIndex}
          stage={stage}
          size={40}
        />
      </div>

      {/* Info column */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-(--text-primary) truncate">
            {def.name}
          </span>
          {quantity > 0n && (
            <span className="chip border-(--border-default) text-(--text-secondary) shrink-0">
              x{quantity.toString()}
            </span>
          )}
        </div>

        {/* Cost row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={[
              'text-xs font-mono',
              affordable ? 'text-(--status-success)' : 'text-(--text-secondary)'
            ].join(' ')}
          >
            {formatPoints(cost)} RP
          </span>
          {timeToAfford && (
            <span className="text-xs font-mono text-(--status-warning)">
              {timeToAfford}
            </span>
          )}
        </div>

        {/* Milestone progress */}
        {quantity > 0n && (
          <span className="text-xs font-mono text-(--text-secondary)">
            {milestoneStr} - 2x at{' '}
            {(() => {
              const q = Number(quantity)
              return Math.ceil((q + 1) / interval) * interval
            })()}
          </span>
        )}
      </div>

      {/* Buy button - highlighted during tutorial boot beat */}
      <div className="shrink-0">
        {generatorIndex === 0 && (
          <TutorialArrow targetId="generator-0-buy" direction="above" />
        )}
        <TutorialHighlight targetId={`generator-${generatorIndex}-buy`}>
          <BuyButton
            cost={cost}
            canAfford={affordable}
            onClick={handleBuy}
            label={bulkAmount === 'max' ? 'MAX' : `x${bulkAmount}`}
          />
        </TutorialHighlight>
      </div>
    </div>
  )
}

export default memo(GeneratorCard)
