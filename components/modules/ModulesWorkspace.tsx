'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import GeneratorModuleCard from '@/components/modules/GeneratorModuleCard'
import { buyAllModules } from '@/app/stores/actions/generatorActions'
import { getModuleLevelCap, getOverclockedChassisCount } from '@/lib/moduleDefs'
import { MODULE_SYNERGIES, GENERATORS } from '@/constants/generators'
import { getRelicSynergyBonus } from '@/lib/relicEffects'

export default function ModulesWorkspace() {
  const [showConstellation, setShowConstellation] = useState(false)
  const generators = useGameStore((s) => s.generators)
  const cap = useGameStore(getModuleLevelCap)
  const overclockedCount = useGameStore(getOverclockedChassisCount)
  const relicBonus = useGameStore(getRelicSynergyBonus)
  const milestonesDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.milestonesDisabled ?? false
  )
  const modulesDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.modulesDisabled ?? false
  )
  const isAC5 = useGameStore((s) => s.activeChallengeId === 'AC5')
  const canBulkUpgrade = useGameStore(
    (s) =>
      s.arUpgrades.bulk_procurement > 0 &&
      !s.activeChallengeRestrictions?.prestigeUpgradesDisabled
  )

  // Only show generators the player has purchased at least one of
  const ownedGeneratorIndices = generators
    .map((g, i) => (g.quantity > 0n ? i : -1))
    .filter((i) => i !== -1)

  const totalInstalledModules = generators.reduce(
    (sum, g) => sum + g.efficiencyLevel + g.costReductionLevel + g.synergyLevel,
    0
  )
  const maxPossibleModules = ownedGeneratorIndices.length * cap * 3

  if (ownedGeneratorIndices.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 p-4">
        <div className="card rounded-xl p-6 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center max-w-sm">
          <p className="text-xs font-mono text-(--text-secondary) leading-relaxed">
            Purchase a Server Cluster to unlock module installation.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="@container flex flex-col gap-2 p-2 sm:p-3 overflow-y-auto scrollbar-dark h-full bg-(--bg-primary)/40">
      <div className="flex items-center justify-between px-1 flex-wrap gap-2">
        <div className="flex flex-col gap-0.5">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            Generator Modules & Synergy Constellation
          </p>
          <p className="text-xs text-(--text-secondary)">
            Install hardware modules to compound efficiency and link
            cross-chassis synergies.
          </p>
        </div>
        <button
          onClick={() => setShowConstellation((prev) => !prev)}
          className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-accent) transition-all cursor-pointer"
        >
          {showConstellation ? 'Hide Constellation' : 'Synergy Matrix ◈'}
        </button>
      </div>

      {/* Distribute Modules Master Bar */}
      <div className="card rounded-xl p-2.5 bg-(--bg-surface) border border-(--border-default) flex flex-col gap-2 shadow-sm">
        <div className="flex items-center justify-between flex-wrap gap-1.5 text-xs font-mono">
          <div className="flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
              Facility Upgrades:
            </span>
            <span className="font-bold text-(--text-primary)">
              {totalInstalledModules} / {maxPossibleModules}
            </span>
          </div>
          {overclockedCount > 0 && (
            <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-400/40 px-2 py-0.5 rounded whitespace-nowrap">
              ⚡ {overclockedCount} Overclocked Chassis
            </span>
          )}
        </div>

        {canBulkUpgrade ? (
          <div className="grid grid-cols-2 @[420px]:grid-cols-4 gap-1.5">
            <button
              onClick={() => buyAllModules()}
              title="Upgrade all affordable module tracks across all generators"
              className="py-1.5 px-2 text-[11px] font-mono font-bold uppercase rounded-lg border border-(--border-accent) bg-(--border-accent)/15 text-(--border-accent) hover:bg-(--border-accent) hover:text-[#080c14] transition-all cursor-pointer shadow-[0_0_8px_rgba(0,240,255,0.2)]"
            >
              Upgrade All
            </button>
            <button
              onClick={() => buyAllModules('efficiency')}
              title="Max affordable Efficiency modules"
              className="py-1.5 px-2 text-[11px] font-mono font-bold uppercase rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-default)/80 transition-all cursor-pointer"
            >
              All Efficiency
            </button>
            <button
              onClick={() => buyAllModules('cost_reduction')}
              title="Max affordable Cost Curve modules"
              className="py-1.5 px-2 text-[11px] font-mono font-bold uppercase rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-default)/80 transition-all cursor-pointer"
            >
              All Cost Curves
            </button>
            <button
              onClick={() => buyAllModules('synergy')}
              title="Max affordable Synergy modules"
              className="py-1.5 px-2 text-[11px] font-mono font-bold uppercase rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border-default)/80 transition-all cursor-pointer"
            >
              All Synergies
            </button>
          </div>
        ) : (
          <p className="text-[10px] font-mono text-(--text-secondary)/70">
            Bulk module sweep unlocks via Bulk Procurement (Prestige AR Shop).
          </p>
        )}
      </div>

      {/* Synergy Constellation Matrix View */}
      {showConstellation && (
        <div className="card rounded-xl p-2.5 bg-(--bg-surface) border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.1)] flex flex-col gap-1.5">
          <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-1.5 gap-2 flex-wrap">
            <span className="text-xs font-mono font-black uppercase text-cyan-300 tracking-wider">
              ✦ Facility Synergy Constellation Matrix
            </span>
            <span className="text-[10px] font-mono text-(--text-secondary)">
              10 Inter-Chassis Conduits
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
                          ? 'Gated'
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
        {ownedGeneratorIndices.map((index) => (
          <GeneratorModuleCard key={index} generatorIndex={index} />
        ))}
      </div>
    </div>
  )
}