'use client'

import { memo, useCallback, useEffect, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { playSound } from '@/hooks/useSound'
import GeneratorModuleCard from '@/components/modules/GeneratorModuleCard'
import { buyAllModules } from '@/app/stores/actions/generatorActions'
import {
  getModuleUpgradeCost,
  getModuleLevelCap,
  getTrackLevelCap,
  getNextModuleCapHint,
  getOverclockedChassisCount,
  getUpgradeAllModulesPlan
} from '@/lib/moduleDefs'
import { MODULE_SYNERGIES, GENERATORS } from '@/constants/generators'
import { getRelicSynergyBonus } from '@/lib/relicEffects'
import { formatPoints, formatPointsShort } from '@/lib/format'

function getCapTierSnapshot(s: {
  lifetimePoints: bigint
  stats: {
    peakLifetimePoints?: bigint
    totalPrestigesTier1?: number
    totalPrestigesTier2?: number
    totalPrestigesTier3?: number
    o10EverCompleted?: boolean
  }
  completedResearchNodes: string[]
}): number {
  const peakRP =
    (s.stats.peakLifetimePoints ?? 0n) > s.lifetimePoints
      ? (s.stats.peakLifetimePoints ?? 0n)
      : s.lifetimePoints
  if (
    s.stats.o10EverCompleted ||
    s.completedResearchNodes.includes('O10') ||
    peakRP >= 10n ** 140n
  ) {
    return 4
  }
  if ((s.stats.totalPrestigesTier3 ?? 0) > 0 || peakRP >= 10n ** 85n) return 3
  if ((s.stats.totalPrestigesTier2 ?? 0) > 0 || peakRP >= 10n ** 35n) return 2
  if ((s.stats.totalPrestigesTier1 ?? 0) > 0 || peakRP >= 10n ** 18n) return 1
  return 0
}

const ModuleBulkToggle = memo(function ModuleBulkToggle() {
  const bulkAmount = useUIStore((s) => s.moduleBulkAmount)
  const setBulkAmount = useUIStore((s) => s.setModuleBulkAmount)

  return (
    <div
      className="flex items-center p-0.5 rounded-lg bg-(--bg-elevated) border border-(--border-default) shrink-0 font-mono text-[10px]"
      role="group"
      aria-label="Module purchase amount"
    >
      {([1, 'max'] as const).map((opt) => (
        <button
          key={String(opt)}
          type="button"
          onClick={() => {
            playSound('click')
            setBulkAmount(opt)
          }}
          title={
            opt === 1
              ? 'Buy 1 module level per click'
              : 'Buy max affordable module levels per click'
          }
          className={[
            'px-2 py-1 rounded font-bold uppercase transition-all cursor-pointer select-none whitespace-nowrap',
            bulkAmount === opt
              ? 'bg-(--border-accent) text-[#080c14] shadow-[0_0_8px_rgba(0,240,255,0.35)]'
              : 'text-(--text-secondary) hover:text-(--text-primary)'
          ].join(' ')}
          aria-pressed={bulkAmount === opt}
        >
          {opt === 1 ? 'x1' : 'MAX'}
        </button>
      ))}
    </div>
  )
})

const UpgradeAllModulesButton = memo(function UpgradeAllModulesButton() {
  const generators = useGameStore((s) => s.generators)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const activeChallengeRestrictions = useGameStore(
    (s) => s.activeChallengeRestrictions
  )
  const capTier = useGameStore(getCapTierSnapshot)
  const modulesDisabled = activeChallengeRestrictions?.modulesDisabled ?? false

  const [plan, setPlan] = useState(() =>
    getUpgradeAllModulesPlan(useGameStore.getState())
  )

  useEffect(() => {
    const sync = () => {
      setPlan(getUpgradeAllModulesPlan(useGameStore.getState()))
    }
    sync()
    const timer = setInterval(sync, 500)
    return () => clearInterval(timer)
  }, [generators, challengeRecords, activeChallengeRestrictions, capTier])

  const allOwnedMaxed = !modulesDisabled && plan.remainingToMaxCost === 0n
  const canBuyAny = !modulesDisabled && plan.purchaseCount > 0
  const postPurchaseRemaining = plan.remainingToMaxCost - plan.totalCost

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => buyAllModules()}
          disabled={!canBuyAny}
          className={[
            'flex-1 min-w-0 py-1.5 px-2 text-[10px] @[420px]:text-xs font-mono font-black uppercase tracking-wider rounded-lg border transition-all select-none truncate',
            modulesDisabled
              ? 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/50 cursor-not-allowed'
              : allOwnedMaxed
                ? 'border-(--status-success)/40 bg-(--status-success)/10 text-(--status-success) cursor-default'
                : canBuyAny
                  ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14] cursor-pointer shadow-[0_0_10px_rgba(0,240,255,0.22)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/50 cursor-not-allowed'
          ].join(' ')}
        >
          {modulesDisabled ? (
            'Modules Restricted'
          ) : allOwnedMaxed ? (
            'All Owned Generators Maxed'
          ) : canBuyAny ? (
            <>
              <span className="@[420px]:hidden">
                Upgrade All (+{plan.purchaseCount}) ·{' '}
                {formatPointsShort(plan.totalCost)} RP
              </span>
              <span className="hidden @[420px]:inline">
                Upgrade All (+{plan.purchaseCount}) ·{' '}
                {formatPoints(plan.totalCost)} RP
              </span>
            </>
          ) : plan.nextCheapestCost !== null ? (
            <>
              <span className="@[420px]:hidden">
                Upgrade All · Need {formatPointsShort(plan.nextCheapestCost)} RP
              </span>
              <span className="hidden @[420px]:inline">
                Upgrade All · Need {formatPoints(plan.nextCheapestCost)} RP
              </span>
            </>
          ) : (
            'Upgrade All'
          )}
        </button>
        <ModuleBulkToggle />
      </div>

      {!modulesDisabled && !allOwnedMaxed && (
        <div className="flex items-center justify-between gap-1 text-[9px] font-mono text-(--text-secondary)/80 px-0.5 flex-wrap">
          <span className="truncate">
            {canBuyAny && postPurchaseRemaining === 0n
              ? 'Maxes all owned generators'
              : canBuyAny
                ? `Remaining: ${formatPointsShort(postPurchaseRemaining)} RP to max owned`
                : `Full max cost: ${formatPointsShort(plan.remainingToMaxCost)} RP`}
          </span>
          {!canBuyAny && plan.nextCheapestCost !== null && (
            <span className="text-amber-300 font-bold shrink-0">
              Next: {formatPointsShort(plan.nextCheapestCost)} RP
            </span>
          )}
        </div>
      )}
    </div>
  )
})

export default function ModulesWorkspace() {
  const [showSynergyLinks, setShowSynergyLinks] = useState(false)
  const [filterMode, setFilterMode] = useState<
    'all' | 'affordable' | 'upgradable'
  >('all')
  const [sortMode, setSortMode] = useState<'tier' | 'cost'>('tier')
  const generators = useGameStore((s) => s.generators)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const activeChallengeRestrictions = useGameStore(
    (s) => s.activeChallengeRestrictions
  )
  const capTier = useGameStore(getCapTierSnapshot)
  const completedResearchNodes = useGameStore((s) => s.completedResearchNodes)
  const cap = useGameStore(getModuleLevelCap)
  const overclockedCount = useGameStore(getOverclockedChassisCount)
  const relicBonus = useGameStore(getRelicSynergyBonus)
  const milestonesDisabled =
    activeChallengeRestrictions?.milestonesDisabled ?? false
  const modulesDisabled = activeChallengeRestrictions?.modulesDisabled ?? false
  const isAC5 = useGameStore((s) => s.activeChallengeId === 'AC5')
  const canBulkUpgrade = useGameStore(
    (s) =>
      s.arUpgrades.bulk_procurement > 0 &&
      !s.activeChallengeRestrictions?.prestigeUpgradesDisabled
  )
  const sc4Tiers = challengeRecords['SC4']?.completedTiers ?? 0

  const capTierThresholds = [
    0n,
    10n ** 18n,
    10n ** 35n,
    10n ** 85n,
    10n ** 140n
  ]
  const capCtx = {
    challengeRecords,
    activeChallengeRestrictions,
    lifetimePoints: capTierThresholds[capTier] ?? 0n,
    stats: useGameStore.getState().stats,
    completedResearchNodes
  }
  const capInfo = getNextModuleCapHint(capCtx)

  // Only show generators the player has purchased at least one of
  const ownedGeneratorIndices = generators
    .map((g, i) => (g.quantity > 0n ? i : -1))
    .filter((i) => i !== -1)

  const getLowestNextCost = useCallback(
    (index: number): bigint | null => {
      const g = generators[index]
      if (!g || g.quantity === 0n) return null
      let minCost: bigint | null = null
      const effCap = getTrackLevelCap(index, 'efficiency', capCtx)
      if (g.efficiencyLevel < effCap) {
        const c = getModuleUpgradeCost(
          index,
          'efficiency',
          g.efficiencyLevel,
          sc4Tiers
        )
        if (minCost === null || c < minCost) minCost = c
      }
      const costCap = getTrackLevelCap(index, 'cost_reduction', capCtx)
      if (g.costReductionLevel < costCap) {
        const c = getModuleUpgradeCost(
          index,
          'cost_reduction',
          g.costReductionLevel,
          sc4Tiers
        )
        if (minCost === null || c < minCost) minCost = c
      }
      const synCap = getTrackLevelCap(index, 'synergy', capCtx)
      if (g.synergyLevel < synCap) {
        const c = getModuleUpgradeCost(
          index,
          'synergy',
          g.synergyLevel,
          sc4Tiers
        )
        if (minCost === null || c < minCost) minCost = c
      }
      return minCost
    },
    [
      generators,
      capTier,
      challengeRecords,
      activeChallengeRestrictions,
      completedResearchNodes,
      sc4Tiers
    ]
  )

  const affordableIndices = useGameStore(
    useShallow(
      useCallback(
        (s) => {
          if (modulesDisabled) return []
          return ownedGeneratorIndices.filter((i) => {
            const min = getLowestNextCost(i)
            return min !== null && s.researchPoints >= min
          })
        },
        [modulesDisabled, ownedGeneratorIndices, getLowestNextCost]
      )
    )
  )

  const upgradableIndices = ownedGeneratorIndices.filter((i) => {
    const g = generators[i]
    return (
      g.efficiencyLevel < getTrackLevelCap(i, 'efficiency', capCtx) ||
      g.costReductionLevel < getTrackLevelCap(i, 'cost_reduction', capCtx) ||
      g.synergyLevel < getTrackLevelCap(i, 'synergy', capCtx)
    )
  })

  const filteredIndices =
    filterMode === 'affordable'
      ? affordableIndices
      : filterMode === 'upgradable'
        ? upgradableIndices
        : ownedGeneratorIndices

  const visibleIndices =
    sortMode === 'cost'
      ? [...filteredIndices].sort((a, b) => {
          const costA = getLowestNextCost(a)
          const costB = getLowestNextCost(b)
          if (costA === null && costB === null) return a - b
          if (costA === null) return 1
          if (costB === null) return -1
          if (costA !== costB) return costA < costB ? -1 : 1
          return a - b
        })
      : filteredIndices

  const totalInstalledModules = generators.reduce(
    (sum, g) => sum + g.efficiencyLevel + g.costReductionLevel + g.synergyLevel,
    0
  )
  const maxPossibleModules = ownedGeneratorIndices.reduce(
    (sum, i) =>
      sum +
      getTrackLevelCap(i, 'efficiency', capCtx) +
      getTrackLevelCap(i, 'cost_reduction', capCtx) +
      getTrackLevelCap(i, 'synergy', capCtx),
    0
  )

  if (ownedGeneratorIndices.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 p-4">
        <div className="card rounded-xl p-6 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center max-w-sm">
          <p className="text-xs font-mono text-(--text-secondary) leading-relaxed">
            Purchase a Server Cluster to unlock generator upgrades.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="@container flex flex-col gap-2 p-2 sm:p-3 overflow-y-auto scrollbar-dark h-full bg-(--bg-primary)/40">
      {modulesDisabled && (
        <div className="p-2.5 rounded-xl border border-amber-500/50 bg-amber-500/10 font-mono text-xs text-amber-300">
          ⚠️ Generator Modules Offline. Disabled by active challenge
          constraints.
        </div>
      )}
      <div className="flex items-center justify-between px-1 gap-2 shrink-0">
        <div className="flex flex-col min-w-0">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest leading-tight">
            Generator Upgrades
          </p>
          <p className="text-[11px] text-(--text-secondary)/85 leading-tight truncate">
            Max all 3 module tracks on a generator for a 2x output bonus.
          </p>
        </div>
        <button
          onClick={() => setShowSynergyLinks((prev) => !prev)}
          className="px-2 py-1 text-[10px] font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent) transition-all cursor-pointer shrink-0 whitespace-nowrap"
        >
          {showSynergyLinks ? 'Hide Links' : 'Synergy Links ◈'}
        </button>
      </div>

      {/* Distribute Modules Master Bar */}
      <div className="card rounded-xl p-2 sm:p-2.5 bg-(--bg-surface) border border-(--border-default) flex flex-col gap-1.5 shadow-sm">
        <div className="flex items-center justify-between gap-1.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
              Installed:
            </span>
            <span className="font-bold text-(--text-primary)">
              {totalInstalledModules}/{maxPossibleModules}
            </span>
            <span className="text-[10px] text-(--text-secondary)/70">
              (Cap Lv{capInfo.currentCap})
            </span>
          </div>
          {overclockedCount > 0 && (
            <span
              title={`${overclockedCount} generators have all 3 module tracks maxed for 2x output`}
              className="text-[9px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-400/40 px-1.5 py-0.2 rounded whitespace-nowrap shrink-0"
            >
              ⚡ {overclockedCount} Maxed (2x)
            </span>
          )}
        </div>
        {capInfo.nextHint && (
          <p className="text-[9px] font-mono text-cyan-300/75 leading-none truncate -mt-0.5">
            {capInfo.nextHint}
          </p>
        )}

        {canBulkUpgrade ? (
          <UpgradeAllModulesButton />
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-mono text-(--text-secondary)/70 min-w-0 leading-tight">
              Upgrade All unlocks via Bulk Procurement (Prestige AR Shop).
            </p>
            <ModuleBulkToggle />
          </div>
        )}

        <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-(--border-default)/50 font-mono text-[10px]">
          <div className="flex items-center p-0.5 rounded-lg bg-(--bg-elevated) border border-(--border-default) min-w-0">
            <button
              onClick={() => setFilterMode('all')}
              className={[
                'px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all cursor-pointer select-none whitespace-nowrap',
                filterMode === 'all'
                  ? 'bg-(--border-accent) text-[#080c14]'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              All ({ownedGeneratorIndices.length})
            </button>
            <button
              onClick={() => setFilterMode('affordable')}
              className={[
                'px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all cursor-pointer select-none whitespace-nowrap flex items-center gap-1',
                filterMode === 'affordable'
                  ? 'bg-(--status-success) text-[#080c14]'
                  : affordableIndices.length > 0
                    ? 'text-(--status-success) hover:bg-(--status-success)/10'
                    : 'text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              {affordableIndices.length > 0 && filterMode !== 'affordable' && (
                <span className="w-1.5 h-1.5 rounded-full bg-(--status-success) shrink-0" />
              )}
              <span>
                <span className="hidden @[380px]:inline">Affordable</span>
                <span className="@[380px]:hidden">Ready</span> (
                {affordableIndices.length})
              </span>
            </button>
            <button
              onClick={() => setFilterMode('upgradable')}
              className={[
                'px-1.5 sm:px-2 py-0.5 rounded font-bold transition-all cursor-pointer select-none whitespace-nowrap',
                filterMode === 'upgradable'
                  ? 'bg-(--border-accent) text-[#080c14]'
                  : 'text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              Unmaxed ({upgradableIndices.length})
            </button>
          </div>

          <button
            type="button"
            onClick={() =>
              setSortMode((prev) => (prev === 'tier' ? 'cost' : 'tier'))
            }
            title={
              sortMode === 'tier'
                ? 'Currently sorted by generator tier (#01→#20). Click to sort by lowest upgrade cost.'
                : 'Currently sorted by lowest upgrade cost. Click to sort by generator tier.'
            }
            className={[
              'px-2 py-1 rounded-lg border font-bold cursor-pointer transition-colors shrink-0 whitespace-nowrap',
              sortMode === 'cost'
                ? 'border-(--border-accent) bg-(--border-accent)/15 text-(--text-accent)'
                : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
          >
            {sortMode === 'tier' ? '↕ Tier' : '↕ Cost'}
          </button>
        </div>
      </div>

      {/* Cross-Generator Links Overview */}
      {showSynergyLinks && (
        <div className="card rounded-xl p-2.5 bg-(--bg-surface) border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.1)] flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-1.5 gap-2 flex-wrap">
            <span className="text-xs font-mono font-black uppercase text-cyan-300 tracking-wider">
              ✦ Cross-Generator Synergy Links
            </span>
            <span className="text-[10px] font-mono text-(--text-secondary)">
              Tiers 1–10 Links (Own both to activate)
            </span>
          </div>
          <div className="grid grid-cols-1 @[400px]:grid-cols-2 gap-1.5 font-mono text-xs">
            {MODULE_SYNERGIES.map((syn) => {
              const src = syn.sourceIndex
              const tgt = syn.targetIndex
              const srcGen = generators[src]
              const tgtGen = generators[tgt]
              const srcOwned = (srcGen?.quantity ?? 0n) > 0n
              const tgtOwned = (tgtGen?.quantity ?? 0n) > 0n
              const synLevel = srcGen?.synergyLevel ?? 0
              const effectiveSynLevel = isAC5 ? synLevel * 2 : synLevel
              const isFlowing =
                !modulesDisabled && srcOwned && tgtOwned && synLevel > 0
              const mutationMult =
                !milestonesDisabled && srcGen && srcGen.quantity >= 250n
                  ? 1.1
                  : 1
              const isSrcOverclocked =
                !modulesDisabled &&
                srcGen &&
                srcGen.efficiencyLevel >= cap &&
                srcGen.costReductionLevel >= cap &&
                srcGen.synergyLevel >= cap
              const overclockMult = isSrcOverclocked ? 1.25 : 1
              const bonus = isFlowing
                ? Number(srcGen.quantity) *
                  syn.bonusPerSourcePerLevel *
                  effectiveSynLevel *
                  relicBonus *
                  mutationMult *
                  overclockMult *
                  100
                : undefined

              return (
                <div
                  key={syn.name}
                  className={[
                    'p-2 rounded-lg border flex flex-col gap-1 transition-all',
                    isFlowing
                      ? 'border-cyan-400/50 bg-cyan-950/20 text-cyan-200'
                      : 'border-(--border-default)/50 bg-(--bg-elevated)/40 text-(--text-secondary)/60'
                  ].join(' ')}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[11px] text-(--text-primary)">
                      {syn.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold ${
                        isFlowing
                          ? 'text-(--status-success)'
                          : 'text-(--text-secondary)/50'
                      }`}
                    >
                      {isFlowing && bonus !== undefined
                        ? `+${bonus.toFixed(1)}%`
                        : !srcOwned || !tgtOwned
                          ? 'Need Both'
                          : 'Lv0'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-(--text-secondary)">
                    <span>
                      #{src + 1} {GENERATORS[src]?.name}
                    </span>
                    <span>──►</span>
                    <span>
                      #{tgt + 1} {GENERATORS[tgt]?.name}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Generator Modules List */}
      <div className="flex flex-col gap-2 pt-1 border-t border-(--border-default)/60">
        {visibleIndices.length === 0 ? (
          <p className="text-center text-xs font-mono text-(--text-secondary) py-4">
            {filterMode === 'affordable'
              ? 'No module upgrades currently affordable.'
              : 'All owned generators are maxed!'}
          </p>
        ) : (
          visibleIndices.map((index) => (
            <GeneratorModuleCard key={index} generatorIndex={index} />
          ))
        )}
      </div>
    </div>
  )
}