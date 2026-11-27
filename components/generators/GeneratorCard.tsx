'use client'

import { memo, useEffect, useMemo, useState, useCallback } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import { buyGenerator } from '@/app/stores/actions/generatorActions'
import { nextCost, costToBuyN, maxAffordable } from '@/lib/generatorCosts'
import { formatPoints, formatPointsShort, getAmountColor } from '@/lib/format'
import { GENERATORS, GENERATOR_CLASS } from '@/constants/generators'
import type { BulkBuyAmount } from '@/constants/game'
import GeneratorIcon from '@/components/generators/GeneratorIcon'
import BuyButton from '@/components/generators/BuyButton'
import TutorialHighlight from '@/components/tutorial/TutorialHighlight'
import TutorialArrow from '@/components/tutorial/TutorialArrow'
import ProgressBar from '@/components/ui/ProgressBar'
import { getStageForQuantity } from '@/hooks/useGeneratorStage'
import {
  formatMilestoneMultiplier,
  getNextMilestone,
  getTimeToAffordString,
  getActiveCenturyMutations,
  getNextCenturyMutation
} from '@/lib/generatorUtils'

interface Props {
  generatorIndex: number
  bulkAmount: BulkBuyAmount
}

function TimeToAffordBadge({
  generatorIndex,
  cost,
  affordable
}: {
  generatorIndex: number
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
      setText(getTimeToAffordString(generatorIndex, s))
      setIsNet(
        Boolean(s.activeMegaprojectId && s.megaprojectAllocationPercent > 0)
      )
    }
    update()
    const timer = setInterval(update, 1000)
    return () => clearInterval(timer)
  }, [generatorIndex, cost, affordable])

  if (!text || affordable) return null
  return (
    <span className="text-[11px] text-(--status-warning)">
      ({text}
      {isNet && text !== '--' ? ' net' : ''})
    </span>
  )
}

function GeneratorCard({ generatorIndex, bulkAmount }: Props) {
  // All React Hooks at the top level unconditionally
  const quantity = useGameStore(
    (s) => s.generators[generatorIndex]?.quantity ?? 0n
  )

  const activeRestrictions = useGameStore((s) => s.activeChallengeRestrictions)

  const [maxUnits, setMaxUnits] = useState(0)
  useEffect(() => {
    if (bulkAmount !== 'max') {
      setMaxUnits(0)
      return
    }
    const update = () => {
      const s = useGameStore.getState()
      const affordableMax = maxAffordable(generatorIndex, s)
      const maxQty = s.activeChallengeRestrictions?.maxGeneratorQuantity
      if (maxQty !== null && maxQty !== undefined) {
        const current = s.generators[generatorIndex]?.quantity ?? 0n
        if (current >= maxQty) {
          setMaxUnits(0)
          return
        }
        setMaxUnits(Math.min(affordableMax, Number(maxQty - current)))
        return
      }
      setMaxUnits(affordableMax)
    }
    update()
    const timer = setInterval(update, 500)
    return () => clearInterval(timer)
  }, [generatorIndex, bulkAmount, quantity])

  const milestoneInfo = useGameStore(
    useShallow(
      useCallback(
        (s) => getNextMilestone(generatorIndex, quantity, s),
        [generatorIndex, quantity]
      )
    )
  )

  const buyCount = bulkAmount === 'max' ? Math.max(1, maxUnits) : bulkAmount

  const costReductionLevel = useGameStore(
    (s) => s.generators[generatorIndex]?.costReductionLevel ?? 0
  )
  const aiQuantity = useGameStore((s) => s.generators[6]?.quantity ?? 0n)
  const completedNodes = useGameStore((s) => s.completedResearchNodes)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const dimTranscendence = useGameStore(
    (s) => s.osUpgrades.dimensional_transcendence
  )
  const relicSlots = useGameStore((s) => s.relicSlots)
  const relicLevels = useGameStore((s) => s.relicLevels)
  const relicResonance = useGameStore((s) => s.arUpgrades.relic_resonance)
  const relicPreservation = useGameStore((s) => s.cfUpgrades.relic_preservation)
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)

  const cost = useMemo(() => {
    const s = useGameStore.getState()
    return buyCount === 1
      ? nextCost(generatorIndex, s)
      : costToBuyN(generatorIndex, buyCount, s)
  }, [
    generatorIndex,
    buyCount,
    quantity,
    costReductionLevel,
    aiQuantity,
    completedNodes,
    challengeRecords,
    dimTranscendence,
    relicSlots,
    relicLevels,
    relicResonance,
    relicPreservation,
    activeChallengeId,
    activeRestrictions
  ])

  const maxQty = activeRestrictions?.maxGeneratorQuantity
  const atQtyCap = maxQty !== null && maxQty !== undefined && quantity >= maxQty
  const exceedsQtyCap =
    bulkAmount !== 'max' &&
    maxQty !== null &&
    maxQty !== undefined &&
    quantity + BigInt(buyCount) > maxQty

  const fixedAffordable = useGameStore(
    useCallback(
      (s) => !atQtyCap && !exceedsQtyCap && s.researchPoints >= cost,
      [atQtyCap, exceedsQtyCap, cost]
    )
  )

  const affordable = bulkAmount === 'max' ? maxUnits > 0 : fixedAffordable

  const isLocked = useGameStore(
    useCallback(
      (s) => {
        const def = GENERATORS[generatorIndex]
        if (!def) return false
        const q = s.generators[generatorIndex]?.quantity ?? 0n
        if (q > 0n) return false
        let threshold = def.baseCost / 2n
        if (
          (generatorIndex === 1 || generatorIndex === 2) &&
          s.completedResearchNodes.includes('R1')
        ) {
          threshold = (def.baseCost * 35n) / 100n
        }
        return s.researchPoints < threshold
      },
      [generatorIndex]
    )
  )

  const productionShare = useGameStore(
    (s) => s.cachedProductionShares?.[generatorIndex] ?? 0
  )

  // Safe exit if index is invalid (only after all hooks are evaluated)
  const def = GENERATORS[generatorIndex]
  if (!def) return null

  const activeMutations = getActiveCenturyMutations(quantity)
  const nextMutation = getNextCenturyMutation(quantity)

  const genClass = GENERATOR_CLASS[generatorIndex] ?? 'computation'
  const CLASS_THEME = {
    computation: {
      border: 'border-cyan-400/35',
      bg: 'bg-cyan-950/15',
      glow: 'shadow-[0_0_12px_rgba(0,240,255,0.12)]',
      dot: 'bg-cyan-400',
      label: 'Computation'
    },
    energy: {
      border: 'border-amber-400/35',
      bg: 'bg-amber-950/15',
      glow: 'shadow-[0_0_12px_rgba(251,191,36,0.12)]',
      dot: 'bg-amber-400',
      label: 'Energy'
    },
    reality: {
      border: 'border-purple-400/35',
      bg: 'bg-purple-950/15',
      glow: 'shadow-[0_0_12px_rgba(168,85,247,0.12)]',
      dot: 'bg-purple-400',
      label: 'Reality'
    },
    arkalon: {
      border: 'border-fuchsia-400/35',
      bg: 'bg-fuchsia-950/15',
      glow: 'shadow-[0_0_12px_rgba(236,72,153,0.12)]',
      dot: 'bg-fuchsia-400',
      label: 'Arkalon'
    }
  }[genClass]

  const stage = getStageForQuantity(quantity)
  const multStr = formatMilestoneMultiplier(milestoneInfo.doublings)
  const unitsToNext = Math.max(0, milestoneInfo.next - Number(quantity))
  const isMilestoneClose = unitsToNext <= 3 && unitsToNext > 0
  const milestoneStr = `${milestoneInfo.current}/${milestoneInfo.next}`

  const milestoneProgress =
    milestoneInfo.next > 0
      ? Math.min(1, Number(quantity) / milestoneInfo.next)
      : 0

  function handleBuy() {
    buyGenerator(generatorIndex, bulkAmount)
  }

  return (
    <div
      className={[
        'card flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-2.5 rounded-xl transition-all duration-150 border',
        affordable
          ? `${CLASS_THEME.border} ${CLASS_THEME.bg} ${CLASS_THEME.glow}`
          : 'border-(--border-default) bg-(--bg-surface)',
        isLocked ? 'opacity-40' : ''
      ].join(' ')}
    >
      {/* Left: Icon Badge */}
      <div
        className={`shrink-0 rounded-xl p-1 sm:p-1.5 flex items-center justify-center border transition-all ${CLASS_THEME.border} bg-[#0c1322] ${CLASS_THEME.glow}`}
      >
        <GeneratorIcon
          generatorIndex={generatorIndex}
          stage={stage}
          size={36}
        />
      </div>

      {/* Middle: Name, Cost, Milestones & Yield */}
      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            title={`Buy hotkey: ${generatorIndex >= 10 ? 'Shift+' : ''}${
              generatorIndex % 10 === 9 ? '0' : (generatorIndex % 10) + 1
            }`}
            className="text-[9px] font-mono font-black px-1 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) shrink-0"
          >
            #{String(generatorIndex + 1).padStart(2, '0')}
          </span>
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
            {def.name}
          </span>
          {quantity > 0n && (
            <div className="flex items-center gap-1 font-mono text-[10px] text-(--text-secondary)">
              <span className={`w-1.5 h-1.5 rounded-full ${CLASS_THEME.dot}`} />
              <span className="hidden sm:inline">{CLASS_THEME.label}</span>
              <span className="hidden sm:inline">•</span>
              <span className="font-bold text-(--text-primary)">
                x{quantity.toString()}
              </span>
            </div>
          )}
          {!activeRestrictions?.milestonesDisabled &&
            activeMutations.length > 0 &&
            (() => {
              const latest = activeMutations[activeMutations.length - 1]
              const summary = activeMutations
                .map((m) => `${m.badge} (${m.name}): ${m.description}`)
                .join(' | ')
              return (
                <span
                  title={summary}
                  className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 shrink-0"
                >
                  {latest.badge}
                </span>
              )
            })()}
          {activeRestrictions?.onlyGeneratorType !== null &&
            activeRestrictions?.onlyGeneratorType !== undefined &&
            quantity > 0n && (
              <span
                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                  activeRestrictions.onlyGeneratorType === generatorIndex
                    ? 'border-(--status-success) text-(--status-success) bg-(--status-success)/10'
                    : 'border-amber-500/50 text-amber-400 bg-amber-500/10'
                }`}
              >
                {activeRestrictions.onlyGeneratorType === generatorIndex
                  ? 'ACTIVE'
                  : 'INACTIVE (PARADOX)'}
              </span>
            )}
        </div>

        {/* Cost & Countdown */}
        <div className="flex items-center gap-2 flex-wrap text-[11px] sm:text-xs font-mono">
          <span
            className={[
              'font-bold',
              getAmountColor(cost) || 'text-(--text-primary)',
              !affordable ? 'opacity-55' : ''
            ].join(' ')}
          >
            <span className="sm:hidden">{formatPointsShort(cost)} RP</span>
            <span className="hidden sm:inline">{formatPoints(cost)} RP</span>
          </span>
          <TimeToAffordBadge
            generatorIndex={generatorIndex}
            cost={cost}
            affordable={affordable}
          />
        </div>

        {/* Milestones & Progress */}
        {quantity > 0n && (
          <div className="flex flex-col gap-0.5 pt-0.5">
            {activeRestrictions?.milestonesDisabled ? (
              <span className="text-[9px] font-mono text-amber-400/80">
                Milestones Inactive (Challenge)
              </span>
            ) : (
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center justify-between flex-wrap gap-x-2 gap-y-0.5 text-[9px] sm:text-[10px] font-mono">
                  <span
                    className="min-w-0 flex items-center gap-1"
                    title={
                      milestoneInfo.doublings > 8
                        ? 'First 8 milestones double (2x up to 256x); steps 9-100 scale by 1.08x, then taper linearly (+5% per step).'
                        : undefined
                    }
                  >
                    <span
                      className={
                        isMilestoneClose
                          ? 'text-cyan-300 font-bold'
                          : 'text-(--text-secondary)/80'
                      }
                    >
                      {milestoneStr}
                    </span>
                    <span
                      className={
                        isMilestoneClose
                          ? 'text-cyan-200 font-bold'
                          : 'text-(--text-secondary)'
                      }
                    >
                      ({multStr})
                    </span>
                    {milestoneInfo.doublings > 8 && (
                      <span className="hidden sm:inline text-cyan-300/60 ml-0.5 text-[9px]">
                        ({milestoneInfo.doublings > 100 ? 'linear' : '1.08x'})
                      </span>
                    )}
                  </span>
                  {nextMutation && nextMutation.threshold - quantity <= 50n && (
                    <span
                      title={`Mutation at ${nextMutation.threshold}: ${nextMutation.name} (${nextMutation.description})`}
                      className="text-amber-400 font-bold shrink-0 text-[9px]"
                    >
                      ★ Mutation in {Number(nextMutation.threshold - quantity)}
                    </span>
                  )}
                </div>
                <div className="w-24 sm:w-28 opacity-90">
                  <ProgressBar
                    progress={milestoneProgress}
                    variant={isMilestoneClose ? 'success' : 'default'}
                    height={2}
                    animated={false}
                  />
                </div>
              </div>
            )}

            {/* Real-Time Production Share Bar */}
            {productionShare > 0 && (
              <div className="flex items-center gap-1.5 w-full mt-0.5 pt-1 border-t border-(--border-default)/40">
                <span className="text-[9px] font-mono text-(--text-secondary)/70 shrink-0">
                  Yield:
                </span>
                <div className="flex-1 min-w-0">
                  <ProgressBar
                    progress={productionShare / 100}
                    variant={productionShare >= 20 ? 'success' : 'default'}
                    height={2}
                    animated={false}
                  />
                </div>
                <span
                  className={`text-[9px] font-mono font-bold shrink-0 ${
                    productionShare >= 10
                      ? 'text-(--text-accent)'
                      : 'text-(--text-secondary)/80'
                  }`}
                >
                  {productionShare < 0.1
                    ? '<0.1%'
                    : `${productionShare.toFixed(1)}%`}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right: Buy Button */}
      <div className="shrink-0 flex flex-col items-center self-center">
        {generatorIndex === 0 && (
          <TutorialArrow targetId="generator-0-buy" direction="above" />
        )}
        <TutorialHighlight targetId={`generator-${generatorIndex}-buy`}>
          <BuyButton
            cost={cost}
            canAfford={affordable}
            onClick={handleBuy}
            label={
              activeRestrictions?.maxGeneratorQuantity !== null &&
              activeRestrictions?.maxGeneratorQuantity !== undefined &&
              quantity >= activeRestrictions.maxGeneratorQuantity
                ? `CAP (${activeRestrictions.maxGeneratorQuantity})`
                : bulkAmount === 'max'
                  ? maxUnits > 0
                    ? `MAX (${maxUnits.toLocaleString()})`
                    : 'MAX (0)'
                  : `x${bulkAmount}`
            }
          />
        </TutorialHighlight>
      </div>
    </div>
  )
}

export default memo(GeneratorCard)
