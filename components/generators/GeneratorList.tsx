'use client'

import { useEffect, useMemo, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import GeneratorCard from '@/components/generators/GeneratorCard'
import type { BulkBuyAmount } from '@/constants/game'
import { BULK_BUY_OPTIONS } from '@/constants/game'
import { GENERATORS } from '@/constants/generators'
import { isGeneratorVisible as checkGeneratorVisible } from '@/lib/generatorUtils'
import ExpansionBay from './ExpansionBay'
import SynthesizerList from './SynthesizerList'
import { useActiveTab } from '@/hooks/useActiveTab'
import { playSound } from '@/hooks/useSound'
import { buyMaxAllGenerators } from '@/app/stores/actions/generatorActions'

const BULK_LABELS: Record<string | number, string> = {
  1: 'x1',
  10: 'x10',
  100: 'x100',
  max: 'MAX'
}

const SORT_LABELS: Record<'tier_asc' | 'tier_desc' | 'yield_desc', string> = {
  tier_asc: '↕ Tier 1→20',
  tier_desc: '↕ Tier 20→1',
  yield_desc: '↕ Yield%'
}

const YIELD_SWAP_THRESHOLD_PP = 2

// Near-tied yields keep their previous order so auto-buy cannot shuffle cards mid-click
function orderYieldWithHysteresis(
  indices: number[],
  shares: number[] | undefined,
  prevOrder: number[]
): number[] {
  const share = (i: number) => shares?.[i] ?? 0
  const sorted = [...indices].sort((a, b) => {
    const diff = share(b) - share(a)
    return diff !== 0 ? diff : a - b
  })
  if (prevOrder.length === 0) return sorted
  const prevRank = new Map(prevOrder.map((id, i) => [id, i]))
  const result = [...sorted]
  for (let i = 0; i < result.length; i++) {
    for (let j = result.length - 1; j > i; j--) {
      const a = result[j - 1]
      const b = result[j]
      const ra = prevRank.get(a)
      const rb = prevRank.get(b)
      if (ra === undefined || rb === undefined) continue
      if (ra > rb && Math.abs(share(a) - share(b)) < YIELD_SWAP_THRESHOLD_PP) {
        result[j - 1] = b
        result[j] = a
      }
    }
  }
  return result
}

export default function GeneratorList() {
  const initialized = useGameStore((s) => s._initialized)
  const bulkAmount = useUIStore((s) => s.bulkAmount)
  const setBulkAmount = useUIStore((s) => s.setBulkAmount)
  const generatorSort = useUIStore((s) => s.generatorSort)
  const setGeneratorSort = useUIStore((s) => s.setGeneratorSort)
  const cycleGeneratorSort = useUIStore((s) => s.cycleGeneratorSort)
  const generators = useGameStore((s) => s.generators)
  const productionShares = useGameStore((s) => s.cachedProductionShares)
  const relicsUnlocked = useGameStore((s) => s.unlocks.relics)
  const equipmentTab = useActiveTab((s) => s.equipmentTab)
  const setEquipmentTab = useActiveTab((s) => s.setEquipmentTab)
  const maxGeneratorTier = useGameStore(
    (s) => s.activeChallengeRestrictions?.maxGeneratorTier ?? null
  )
  const noSynthesizersOwned = useGameStore((s) =>
    (s.synthesizers ?? [0, 0, 0, 0]).every((q) => q === 0)
  )
  const canMaxAll = useGameStore(
    (s) =>
      s.cfUpgrades.bulk_procurement > 0 &&
      !s.activeChallengeRestrictions?.prestigeUpgradesDisabled
  )

  const activeTab = relicsUnlocked ? equipmentTab : 'generators'

  useEffect(() => {
    try {
      const saved = localStorage.getItem('arkalon_labs_gen_sort')
      if (
        saved === 'tier_asc' ||
        saved === 'tier_desc' ||
        saved === 'yield_desc'
      ) {
        setGeneratorSort(saved)
      }
    } catch {}
  }, [setGeneratorSort])

  const lastPrestigeTime = useGameStore((s) => s.stats.lastPrestigeTime)
  const prevPrestigeRef = useRef<number | null>(null)
  
  useEffect(() => {
    if (!initialized) return
    const prev = prevPrestigeRef.current
    prevPrestigeRef.current = lastPrestigeTime
    if (prev === null || lastPrestigeTime <= prev) return
    if (useUIStore.getState().generatorSort !== 'tier_asc') {
      setGeneratorSort('tier_asc')
    }
  }, [initialized, lastPrestigeTime, setGeneratorSort])

  useEffect(() => {
    const handleCycle = () => {
      const prev = useUIStore.getState().bulkAmount
      const next: BulkBuyAmount =
        prev === 1 ? 10 : prev === 10 ? 100 : prev === 100 ? 'max' : 1
      setBulkAmount(next)
    }
    window.addEventListener('cycle-bulk-buy', handleCycle)
    return () => window.removeEventListener('cycle-bulk-buy', handleCycle)
  }, [setBulkAmount])

  // Determine which generators are visible
  function isGeneratorVisible(index: number): boolean {
    return checkGeneratorVisible(index, {
      generators,
      activeChallengeRestrictions:
        maxGeneratorTier !== null ? { maxGeneratorTier } : null
    })
  }

  const yieldOrderRef = useRef<number[]>([])

  const visibleIndices = useMemo(() => {
    const base = GENERATORS.map((_, index) => index).filter((index) =>
      checkGeneratorVisible(index, {
        generators,
        activeChallengeRestrictions:
          maxGeneratorTier !== null ? { maxGeneratorTier } : null
      })
    )
    if (generatorSort === 'tier_desc') {
      return [...base].reverse()
    }
    if (generatorSort === 'yield_desc') {
      return orderYieldWithHysteresis(
        base,
        productionShares,
        yieldOrderRef.current
      )
    }
    return base
  }, [generators, maxGeneratorTier, generatorSort, productionShares])

  useEffect(() => {
    if (generatorSort === 'yield_desc') {
      yieldOrderRef.current = visibleIndices
    }
  }, [visibleIndices, generatorSort])

  const nextHidden = GENERATORS.findIndex(
    (_, index) =>
      !isGeneratorVisible(index) &&
      (maxGeneratorTier === null || index < maxGeneratorTier)
  )
  const nextHiddenIndex = nextHidden === -1 ? null : nextHidden

  return (
    <div className="flex flex-col h-full bg-(--bg-primary)/40">
      {/* Equipment category switcher + inline generator sort (appears once Relics unlock) */}
      {relicsUnlocked && (
        <div
          className="flex items-center gap-1 px-2 py-0.5 sm:py-1 border-b border-(--border-default) bg-(--bg-surface) shrink-0"
          role="tablist"
          aria-label="Equipment categories"
        >
          <div className="flex-1 grid grid-cols-2 gap-1 min-w-0">
            {(
              [
                { id: 'generators' as const, label: 'Generators' },
                { id: 'synthesizers' as const, label: 'Synthesizers' }
              ] as const
            ).map((tab) => {
              const isSelected = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => {
                    playSound('click')
                    setEquipmentTab(tab.id)
                  }}
                  className={[
                    'py-1 px-1.5 text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-wider rounded-lg border transition-all cursor-pointer select-none truncate flex items-center justify-center gap-1',
                    isSelected
                      ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent)'
                      : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
                  ].join(' ')}
                >
                  <span>{tab.label}</span>
                  {tab.id === 'synthesizers' &&
                    noSynthesizersOwned &&
                    !isSelected && (
                      <span className="text-[8px] font-black px-1 py-0.2 rounded bg-(--status-success) text-[#080c14] shrink-0">
                        NEW
                      </span>
                    )}
                </button>
              )
            })}
          </div>
          {activeTab === 'generators' && (
            <button
              type="button"
              onClick={() => {
                playSound('click')
                cycleGeneratorSort()
              }}
              title="Cycle generator list order (Tier 1→20, Newest 20→1, Yield %)"
              className={[
                'shrink-0 px-2 py-1 text-[10px] font-mono font-bold rounded-lg border transition-colors cursor-pointer whitespace-nowrap',
                generatorSort !== 'tier_asc'
                  ? 'border-(--border-accent)/60 bg-(--border-accent)/10 text-(--text-accent)'
                  : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              {SORT_LABELS[generatorSort]}
            </button>
          )}
        </div>
      )}

      {/* Bulk buy selector bar */}
      <div className="flex items-center justify-between px-2 sm:px-3 py-1 sm:py-1.5 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0">
          {canMaxAll && activeTab === 'generators' ? (
            <button
              onClick={() => buyMaxAllGenerators()}
              title="Buy maximum affordable units for all equipment (Hotkey: M)"
              className="px-2 sm:px-2.5 py-1 text-xs font-mono font-black uppercase tracking-wider rounded-lg border border-(--border-accent)/60 bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14] transition-all cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.2)] flex items-center gap-1 shrink-0"
            >
              <span>MAX ALL</span>
              <kbd className="hidden sm:inline text-[9px] px-1 py-0.2 rounded bg-black/40 border border-(--border-accent)/40 font-mono">
                M
              </kbd>
            </button>
          ) : !relicsUnlocked &&
            activeTab === 'generators' &&
            visibleIndices.length > 4 ? (
            <button
              type="button"
              onClick={() => {
                playSound('click')
                cycleGeneratorSort()
              }}
              title="Cycle generator list order"
              className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) cursor-pointer whitespace-nowrap"
            >
              {SORT_LABELS[generatorSort]}
            </button>
          ) : (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--text-secondary)/70 truncate">
              Buy Amount
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {bulkAmount !== 1 && (
            <span className="hidden lg:inline text-[9px] font-mono text-(--text-secondary)/65">
              1–0: x1
            </span>
          )}
          <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 rounded-lg border border-(--border-default) bg-(--bg-elevated)">
            {([...BULK_BUY_OPTIONS, 'max'] as BulkBuyAmount[]).map((opt) => (
              <button
                key={String(opt)}
                onClick={() => {
                  playSound('click')
                  setBulkAmount(opt)
                }}
                className={[
                  'px-1.5 sm:px-2.5 py-1 text-[11px] sm:text-xs font-mono font-bold rounded transition-all cursor-pointer select-none',
                  bulkAmount === opt
                    ? 'bg-(--border-accent) text-[#080c14] shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'text-(--text-secondary) hover:text-(--text-primary)'
                ].join(' ')}
                aria-pressed={bulkAmount === opt}
              >
                {BULK_LABELS[String(opt)]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!initialized ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
            Synchronizing Equipment...
          </p>
        </div>
      ) : activeTab === 'synthesizers' ? (
        <SynthesizerList bulkAmount={bulkAmount} />
      ) : (
        <>
          {/* Scrollable generator list - sizes to content, never stretches */}
          <div className="@container flex-[0_1_auto] min-h-0 overflow-y-auto scrollbar-dark p-1 sm:p-2.5 flex flex-col gap-1 sm:gap-2">
            {visibleIndices.map((index) => (
              <GeneratorCard
                key={index}
                generatorIndex={index}
                bulkAmount={bulkAmount}
              />
            ))}
          </div>
          {/* Expansion bay absorbs leftover height on tall/wide devices */}
          <ExpansionBay nextHiddenIndex={nextHiddenIndex} />
        </>
      )}
    </div>
  )
}
