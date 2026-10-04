'use client'

import { memo, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyGenerator } from '@/app/stores/gameActions'
import { canAfford, nextCost } from '@/lib/generatorCosts'
import { formatPoints, formatTimeToAfford } from '@/lib/format'
import { GENERATORS } from '@/constants/generators'
import type { BulkBuyAmount } from '@/constants/game'
import GeneratorIcon from '@/components/generators/GeneratorIcon'
import BuyButton from '@/components/generators/BuyButton'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'
import TutorialArrow from '@/components/tutorial/TutorialArrow'
import { getStageForQuantity } from '@/hooks/useGeneratorStage'
import {
  getMilestoneString,
  getCostEfficiencyString
} from '@/lib/generatorUtils'

interface Props {
  generatorIndex: number
  bulkAmount: BulkBuyAmount
}

function GeneratorCard({ generatorIndex, bulkAmount }: Props) {
  const def = GENERATORS[generatorIndex]
  const [showTooltip, setShowTooltip] = useState(false)

  // Narrow selectors
  const quantity = useGameStore(
    (s) => s.generators[generatorIndex]?.quantity ?? 0n
  )
  const researchPoints = useGameStore((s) => s.researchPoints)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)

  const state = useGameStore.getState()
  const cost = nextCost(generatorIndex, state)
  const affordable = canAfford(generatorIndex, state)

  if (!def) return null

  const stage = getStageForQuantity(quantity)
  const milestoneStr = getMilestoneString(generatorIndex, quantity)
  const timeToAfford = affordable
    ? ''
    : formatTimeToAfford(cost, researchPoints, pps)

  // Cost efficiency shown in tooltip
  const efficiency = showTooltip
    ? getCostEfficiencyString(generatorIndex, state)
    : ''

  function handleBuy() {
    buyGenerator(generatorIndex, bulkAmount)
  }

  const isLocked = quantity === 0n && researchPoints < def.baseCost / 2n

  return (
    <div
      className={[
        'card flex items-center gap-3 p-3 rounded-lg transition-colors relative',
        affordable ? 'affordable' : '',
        isLocked ? 'opacity-50' : ''
      ].join(' ')}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
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
              affordable
                ? 'text-(--status-success)'
                : 'text-(--text-secondary)'
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
          <span className="text-[0.65rem] font-mono text-(--text-secondary)">
            {milestoneStr}
          </span>
        )}
      </div>

      {/* Buy button */}
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

      {/* Cost efficiency tooltip - desktop hover only */}
      {showTooltip && efficiency && (
        <div
          className="absolute left-0 right-0 -bottom-8 z-10 px-3 py-1.5 bg-(--bg-elevated) border border-(--border-default) rounded text-[0.6rem] font-mono text-(--text-secondary) pointer-events-none"
          aria-hidden="true"
        >
          Efficiency: {efficiency}
        </div>
      )}
    </div>
  )
}

export default memo(GeneratorCard)
