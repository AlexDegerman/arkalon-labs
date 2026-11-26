'use client'

import { memo, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  getModuleUpgradeCost,
  getModuleLevelCap,
  getTrackLevelCap,
  getModuleEffectLabel,
  isGeneratorChassisOverclocked,
  MODULE_DEFINITIONS
} from '@/lib/moduleDefs'
import { MODULE_SYNERGIES, GENERATORS } from '@/constants/generators'
import { formatPoints, formatPointsShort } from '@/lib/format'
import type { ModuleType } from '@/types/game'
import ProgressBar from '@/components/ui/ProgressBar'
import { buyModule } from '@/app/stores/actions/generatorActions'
import { getRelicSynergyBonus } from '@/lib/relicEffects'

interface ModuleTrackProps {
  generatorIndex: number
  moduleType: ModuleType
  currentLevel: number
  levelCap: number
  modulesDisabled: boolean
  sc4Tiers: number
  ac5Active: boolean
  hasSynergyLink: boolean
}

const ModuleTrack = memo(function ModuleTrack({
  generatorIndex,
  moduleType,
  currentLevel,
  levelCap,
  modulesDisabled,
  sc4Tiers,
  ac5Active,
  hasSynergyLink
}: ModuleTrackProps) {
  const def = MODULE_DEFINITIONS[moduleType]
  const atCap = currentLevel >= levelCap
  const cost = atCap
    ? 0n
    : getModuleUpgradeCost(generatorIndex, moduleType, currentLevel, sc4Tiers)
  const canAfford = useGameStore(
    (s) => !atCap && !modulesDisabled && s.researchPoints >= cost
  )
  const effectLabel = getModuleEffectLabel(moduleType, currentLevel, ac5Active)
  const hint =
    moduleType === 'synergy' && !hasSynergyLink
      ? 'Set-bonus track (max all 3 upgrades for 2x output)'
      : def.effectPerLevel

  function handleUpgrade() {
    if (atCap || modulesDisabled || !canAfford) return
    buyModule(generatorIndex, moduleType, currentLevel)
  }

  return (
    <div className="flex flex-col gap-1 p-2 rounded-lg bg-(--bg-elevated)/60 border border-(--border-default)/70">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-(--text-primary)">
          {def.label}
        </span>
        <span className="text-[10px] font-mono font-bold text-(--text-secondary)">
          Lv{currentLevel}/{levelCap}
        </span>
      </div>

      <ProgressBar
        progress={currentLevel / levelCap}
        variant={atCap ? 'success' : 'default'}
        height={3}
      />

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-[11px] text-(--text-secondary) font-mono leading-snug min-w-0">
          {currentLevel === 0 ? hint : `${effectLabel} · ${hint}`}
        </span>
        {!atCap ? (
          <button
            onClick={handleUpgrade}
            disabled={modulesDisabled || !canAfford}
            className={[
              'px-2.5 py-1 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer select-none whitespace-nowrap shrink-0',
              canAfford && !modulesDisabled
                ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) hover:bg-(--status-success) hover:text-black'
                : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            {modulesDisabled ? (
              'Restricted'
            ) : (
              <>
                <span className="@[420px]:hidden">
                  {formatPointsShort(cost)} RP
                </span>
                <span className="hidden @[420px]:inline">
                  {formatPoints(cost)} RP
                </span>
              </>
            )}
          </button>
        ) : (
          <span className="text-[10px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded bg-(--status-success)/10 border border-(--status-success)/30 shrink-0">
            MAX
          </span>
        )}
      </div>
    </div>
  )
})

interface Props {
  generatorIndex: number
}

function GeneratorModuleCard({ generatorIndex }: Props) {
  const gen = useGameStore((s) => s.generators[generatorIndex])
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const activeChallengeRestrictions = useGameStore(
    (s) => s.activeChallengeRestrictions
  )
  const capTier = useGameStore((s) => {
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
    if (s.stats.totalPrestigesTier3 > 0 || peakRP >= 10n ** 85n) return 3
    if (s.stats.totalPrestigesTier2 > 0 || peakRP >= 10n ** 35n) return 2
    if (s.stats.totalPrestigesTier1 > 0 || peakRP >= 10n ** 18n) return 1
    return 0
  })
  const completedResearchNodes = useGameStore((s) => s.completedResearchNodes)
  const levelCap = useGameStore(getModuleLevelCap)
  const sc4Tiers = challengeRecords['SC4']?.completedTiers ?? 0
  const relicBonus = useGameStore(getRelicSynergyBonus)
  const targetGenerators = useGameStore((s) => s.generators)
  const ac5Active = useGameStore((s) => s.activeChallengeId === 'AC5')
  const milestonesDisabled =
    activeChallengeRestrictions?.milestonesDisabled ?? false
  const modulesDisabled = activeChallengeRestrictions?.modulesDisabled ?? false

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
  const effCap = getTrackLevelCap(generatorIndex, 'efficiency', capCtx)
  const costCap = getTrackLevelCap(generatorIndex, 'cost_reduction', capCtx)
  const synCap = getTrackLevelCap(generatorIndex, 'synergy', capCtx)

  const isOverclocked = isGeneratorChassisOverclocked(gen, levelCap)
  const isFullyMaxed =
    Boolean(gen) &&
    gen.efficiencyLevel >= effCap &&
    gen.costReductionLevel >= costCap &&
    gen.synergyLevel >= synCap
  const [expanded, setExpanded] = useState(!isFullyMaxed)

  const def = GENERATORS[generatorIndex]
  if (!def) return null

  // Only show generators the player has purchased
  if (!gen || gen.quantity === 0n) return null

  // Active synergy targets for this generator's cross-boost upgrade
  const synergyTargets = MODULE_SYNERGIES.filter(
    (s) => s.sourceIndex === generatorIndex
  ).map((s) => ({
    targetIndex: s.targetIndex,
    targetName: GENERATORS[s.targetIndex]?.name ?? `Gen ${s.targetIndex + 1}`,
    name: s.name
  }))

  const MODULE_TYPES: ModuleType[] = ['efficiency', 'cost_reduction', 'synergy']

  if (isFullyMaxed && !expanded) {
    return (
      <div
        id={`module-card-${generatorIndex}`}
        className="card rounded-xl px-3 py-2 flex items-center justify-between gap-2 border border-cyan-400/60 bg-cyan-950/15"
      >
        <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
          <span className="text-xs font-bold text-(--text-primary) truncate">
            #{String(generatorIndex + 1).padStart(2, '0')} {def.name}
          </span>
          <span className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-cyan-400/20 border border-cyan-400/60 text-cyan-300 shrink-0">
            ⚡ 2x MAXED
          </span>
        </div>
        <button
          onClick={() => setExpanded(true)}
          className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) cursor-pointer shrink-0"
        >
          Details
        </button>
      </div>
    )
  }

  return (
    <div
      id={`module-card-${generatorIndex}`}
      className={[
        'card rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 border transition-all duration-300',
        isOverclocked
          ? 'border-cyan-400/80 bg-linear-to-b from-cyan-950/20 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_20px_rgba(0,240,255,0.18)]'
          : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-2 flex-wrap gap-1">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
            #{String(generatorIndex + 1).padStart(2, '0')} {def.name}
          </span>
          {isOverclocked && (
            <span
              title="All 3 upgrades maxed: 2x Generator Output & +25% Cross-Boost"
              className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded bg-cyan-400/20 border border-cyan-400/60 text-cyan-300 shrink-0"
            >
              ⚡ 2x MAXED
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
            x{gen.quantity.toString()} Owned
          </span>
          {isFullyMaxed && (
            <button
              onClick={() => setExpanded(false)}
              className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) cursor-pointer"
            >
              Collapse
            </button>
          )}
        </div>
      </div>

      {synergyTargets.length > 0 && (
        <div className="text-[11px] font-mono text-(--text-secondary) bg-(--bg-elevated) rounded-lg p-2 border border-(--border-default)/70 flex flex-col gap-1">
          <span className="text-[9px] font-bold uppercase tracking-wider text-(--text-secondary)/80">
            Boosts Another Generator:
          </span>
          {synergyTargets.map((t) => {
            const isTargetOwned =
              (targetGenerators[t.targetIndex]?.quantity ?? 0n) > 0n
            const synDef = MODULE_SYNERGIES.find((s) => s.name === t.name)
            const mutationMult =
              !milestonesDisabled && gen.quantity >= 250n ? 1.1 : 1
            const effectiveSynLevel = ac5Active
              ? gen.synergyLevel * 2
              : gen.synergyLevel
            const overclockMult = isOverclocked ? 1.25 : 1
            const isLinkActive =
              !modulesDisabled && gen.synergyLevel > 0 && isTargetOwned
            const bonus = isLinkActive
              ? Number(gen.quantity) *
                (synDef?.bonusPerSourcePerLevel ?? 0) *
                effectiveSynLevel *
                relicBonus *
                mutationMult *
                overclockMult *
                100
              : undefined

            return (
              <div
                key={t.name}
                className="flex items-center justify-between gap-2 flex-wrap text-[10px] bg-(--bg-surface)/70 px-2 py-1 rounded border border-(--border-default)/50"
              >
                <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                  <span
                    className={[
                      'w-1.5 h-1.5 rounded-full shrink-0',
                      isLinkActive
                        ? 'bg-(--status-success)'
                        : 'bg-(--border-default)'
                    ].join(' ')}
                  />
                  <span className="font-bold text-(--text-primary)">
                    {t.name}
                  </span>
                  <span className="text-(--text-secondary)/70 font-mono text-[9px]">
                    (→ #{String(t.targetIndex + 1).padStart(2, '0')}{' '}
                    {t.targetName})
                  </span>
                </div>
                <span
                  className={
                    isLinkActive
                      ? 'text-(--status-success) font-black shrink-0 ml-auto'
                      : 'text-(--text-secondary)/50 shrink-0 ml-auto'
                  }
                >
                  {isLinkActive && bonus !== undefined
                    ? `+${bonus.toFixed(1)}%`
                    : gen.synergyLevel === 0
                      ? 'Lv0 (Inactive)'
                      : 'Own target to activate'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        {MODULE_TYPES.map((type) => (
          <ModuleTrack
            key={type}
            generatorIndex={generatorIndex}
            moduleType={type}
            currentLevel={
              type === 'efficiency'
                ? gen.efficiencyLevel
                : type === 'cost_reduction'
                  ? gen.costReductionLevel
                  : gen.synergyLevel
            }
            levelCap={
              type === 'efficiency'
                ? effCap
                : type === 'cost_reduction'
                  ? costCap
                  : synCap
            }
            modulesDisabled={modulesDisabled}
            sc4Tiers={sc4Tiers}
            ac5Active={ac5Active}
            hasSynergyLink={synergyTargets.length > 0}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(GeneratorModuleCard)
