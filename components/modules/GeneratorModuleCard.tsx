'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyModule } from '@/app/stores/gameActions'
import {
  getModuleUpgradeCost,
  getModuleLevelCap,
  getModuleEffectLabel,
  MODULE_DEFINITIONS
} from '@/lib/moduleDefs'
import { MODULE_SYNERGIES } from '@/constants/generators'
import { GENERATORS } from '@/constants/generators'
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
  const effectLabel = getModuleEffectLabel(
    moduleType,
    currentLevel,
    generatorIndex
  )

  function handleUpgrade() {
    if (atCap || !canAfford) return
    buyModule(generatorIndex, moduleType, currentLevel)
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-(--text-primary)">
          {def.label}
        </span>
        <span className="text-xs font-mono text-(--text-secondary)">
          {currentLevel}/{levelCap}
        </span>
      </div>

      <ProgressBar
        progress={currentLevel / levelCap}
        variant={atCap ? 'success' : 'default'}
        height={3}
      />

      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.65rem] text-(--text-secondary)">
          {effectLabel}
        </span>
        {!atCap && (
          <button
            onClick={handleUpgrade}
            disabled={!canAfford}
            className={[
              'px-2 py-0.5 text-[0.65rem] font-mono rounded border shrink-0 transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
              canAfford
                ? 'border-(--status-success) text-(--status-success) hover:bg-(--status-success) hover:text-black'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
            ].join(' ')}
            aria-label={`Upgrade ${def.label} module - costs ${formatPoints(cost)} RP`}
          >
            {formatPoints(cost)} RP
          </button>
        )}
        {atCap && (
          <span className="text-[0.65rem] font-mono text-(--status-success)">
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
    targetName: GENERATORS[s.targetIndex]?.name ?? `Gen ${s.targetIndex}`,
    name: s.name
  }))

  const MODULE_TYPES: ModuleType[] = ['efficiency', 'cost_reduction', 'synergy']

  return (
    <div className="card rounded-lg p-3 flex flex-col gap-3">
      {/* Generator header */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-(--text-primary)">
          #{String(generatorIndex + 1).padStart(2, '0')} {def.name}
        </span>
        <span className="chip border-(--border-default) text-(--text-secondary) text-[0.6rem]">
          x{gen.quantity.toString()}
        </span>
      </div>

      {/* Synergy target info */}
      {synergyTargets.length > 0 && gen.synergyLevel > 0 && (
        <div className="text-[0.65rem] text-(--text-secondary) bg-(--bg-elevated) rounded px-2 py-1">
          <span className="text-(--text-accent)">
            {synergyTargets[0].name}:
          </span>{' '}
          boosts {synergyTargets[0].targetName}
        </div>
      )}

      {/* Module tracks */}
      <div className="flex flex-col gap-3">
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
