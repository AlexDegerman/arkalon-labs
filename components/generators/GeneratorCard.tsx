'use client'

import { memo, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyGenerator } from '@/app/stores/actions'
import { canAfford, nextCost } from '@/lib/generatorCosts'
import { formatPoints } from '@/lib/format'
import { GENERATORS } from '@/constants/generators'
import type { BulkBuyAmount } from '@/constants/game'
import GeneratorIcon from '@/components/generators/GeneratorIcon'
import BuyButton from '@/components/generators/BuyButton'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'
import TutorialArrow from '@/components/tutorial/TutorialArrow'
import { getStageForQuantity } from '@/hooks/useGeneratorStage'
import {
  getMilestoneString,
  getCostEfficiencyString,
  getTimeToAffordString
} from '@/lib/generatorUtils'

interface Props {
  generatorIndex: number
  bulkAmount: BulkBuyAmount
}

function GeneratorCard({ generatorIndex, bulkAmount }: Props) {
  const def = GENERATORS[generatorIndex]
  const [showTooltip, setShowTooltip] = useState(false)

  const quantity = useGameStore(
    (s) => s.generators[generatorIndex]?.quantity ?? 0n
  )
  const researchPoints = useGameStore((s) => s.researchPoints)
  const state = useGameStore.getState()
  const cost = nextCost(generatorIndex, state)
  const affordable = canAfford(generatorIndex, state)
  if (!def) return null
  const stage = getStageForQuantity(quantity)
  const milestoneStr = getMilestoneString(generatorIndex, quantity, state)
  const timeToAfford = getTimeToAffordString(generatorIndex, state)

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
        'card flex items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl transition-all duration-150 relative border',
        affordable
          ? 'border-(--border-accent)/40 bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.06)]'
          : 'border-(--border-default) bg-(--bg-surface)',
        isLocked ? 'opacity-40' : ''
      ].join(' ')}
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* Left: SVG Icon Badge */}
      <div className="shrink-0 rounded-lg p-1 bg-(--bg-elevated) border border-(--border-default) flex items-center justify-center">
        <GeneratorIcon
          generatorIndex={generatorIndex}
          stage={stage}
          size={38}
        />
      </div>

      {/* Middle: Info and Progression */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
            {def.name}
          </span>
          {quantity > 0n && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) shrink-0">
              x{quantity.toString()}
            </span>
          )}
        </div>

        {/* Cost & Countdown */}
        <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
          <span
            className={
              affordable
                ? 'font-bold text-(--status-success)'
                : 'text-(--text-secondary)'
            }
          >
            {formatPoints(cost)} RP
          </span>
          {timeToAfford && (
            <span className="text-[11px] text-(--status-warning)">
              ({timeToAfford})
            </span>
          )}
        </div>

        {/* Milestone Indicator */}
        {quantity > 0n && (
          <span className="text-[10px] font-mono text-(--text-secondary)/80 truncate">
            {milestoneStr}
          </span>
        )}
      </div>

      {/* Right: Buy action */}
      <div className="shrink-0 flex flex-col items-center">
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

      {/* Tooltip on hover */}
      {showTooltip && efficiency && (
        <div
          className="absolute left-3 right-3 -bottom-7 z-20 px-2.5 py-1 bg-[#080c14] border border-(--border-accent)/50 rounded text-[10px] font-mono text-(--text-accent) pointer-events-none shadow-xl"
          aria-hidden="true"
        >
          {efficiency}
        </div>
      )}
    </div>
  )
}

export default memo(GeneratorCard)
