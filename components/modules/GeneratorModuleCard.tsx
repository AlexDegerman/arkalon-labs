'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyModule } from '@/app/stores/actions'
import {
  getModuleUpgradeCost,
  getModuleLevelCap,
  getModuleEffectLabel,
  MODULE_DEFINITIONS
} from '@/lib/moduleDefs'
import { MODULE_SYNERGIES, GENERATORS } from '@/constants/generators'
import { getSynergyBonusSummary } from '@/lib/productionEngine'
import { formatPoints } from '@/lib/format'
import type { ModuleType } from '@/types/game'
import ProgressBar from '@/components/ui/ProgressBar'

interface ModuleTrackProps {
  generatorIndex: number
  moduleType: ModuleType
  currentLevel: number
  levelCap: number
  rp: bigint
}

const ModuleTrack = memo(function ModuleTrack({
  generatorIndex,
  moduleType,
  currentLevel,
  levelCap,
  rp
}: ModuleTrackProps) {
  const def = MODULE_DEFINITIONS[moduleType]
  const atCap = currentLevel >= levelCap
  const cost = atCap
    ? 0n
    : getModuleUpgradeCost(generatorIndex, moduleType, currentLevel)
  const canAfford = !atCap && rp >= cost
  const effectLabel = getModuleEffectLabel(moduleType, currentLevel)

  function handleUpgrade() {
    if (atCap || !canAfford) return
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
        <span className="text-[11px] text-(--text-secondary) font-mono">
          {effectLabel}
        </span>
        {!atCap ? (
          <button
            onClick={handleUpgrade}
            disabled={!canAfford}
            className={[
              'px-2 py-0.5 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer select-none',
              canAfford
                ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) hover:bg-(--status-success) hover:text-black'
                : 'border-(--border-default) bg-(--bg-surface) text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            {formatPoints(cost)} RP
          </button>
        ) : (
          <span className="text-[10px] font-mono font-bold text-(--status-success) px-1.5 py-0.2 rounded bg-(--status-success)/10 border border-(--status-success)/30">
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
  const rp = useGameStore((s) => s.researchPoints)
  const store = useGameStore.getState()
  const levelCap = getModuleLevelCap(store)

  const def = GENERATORS[generatorIndex]
  if (!def) return null

  // Only show generators the player has purchased
  if (!gen || gen.quantity === 0n) return null

  // Active synergy targets for this generator's synergy module
  const synergyTargets = MODULE_SYNERGIES.filter(
    (s) => s.sourceIndex === generatorIndex
  ).map((s) => ({
    targetIndex: s.targetIndex,
    targetName: GENERATORS[s.targetIndex]?.name ?? `Gen ${s.targetIndex}`,
    name: s.name
  }))

  const MODULE_TYPES: ModuleType[] = ['efficiency', 'cost_reduction', 'synergy']

  return (
    <div className="card rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 border border-(--border-default) bg-(--bg-surface)">
      <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-2">
        <span className="text-xs sm:text-sm font-bold text-(--text-primary)">
          #{String(generatorIndex + 1).padStart(2, '0')} {def.name}
        </span>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary)">
          x{gen.quantity.toString()} Owned
        </span>
      </div>

      {synergyTargets.length > 0 && gen.synergyLevel > 0 && (
        <div className="text-[11px] font-mono text-(--text-secondary) bg-(--bg-elevated) rounded-lg p-2 border border-(--border-default)/70 flex flex-col gap-1">
          {synergyTargets.map((t) => {
            const bonus = getSynergyBonusSummary(t.targetIndex, store).find(
              (e) => e.synergyName === t.name
            )?.bonus
            return (
              <span key={t.name}>
                <strong className="text-(--text-accent)">{t.name}:</strong>
                {' '}
                {bonus !== undefined && bonus > 0 && (
                  <strong className="text-(--status-success)">
                    (+{bonus.toFixed(1)}%)
                  </strong>
                )}
              </span>
            )
          })}
        </div>
      )}

      <div className="flex flex-col gap-2">
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
            levelCap={levelCap}
            rp={rp}
          />
        ))}
      </div>
    </div>
  )
}

export default memo(GeneratorModuleCard)
