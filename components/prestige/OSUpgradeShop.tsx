'use client'

import { buyPrestigeUpgrade } from '@/app/stores/actions/prestigeActions'
import { useGameStore } from '@/app/stores/gameStore'
import { OS_UPGRADES, getUpgradeCost } from '@/lib/prestigeUpgradeDefs'

export default function OSUpgradeShop() {
  const os = useGameStore((s) => s.omniSpars)
  const osUpgrades = useGameStore((s) => s.osUpgrades)
  const prestigeDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.prestigeUpgradesDisabled ?? false
  )
  const totalPrestigesTier3 = useGameStore((s) => s.stats.totalPrestigesTier3)

  if (totalPrestigesTier3 === 0) {
    return (
      <div className="card rounded-xl p-4 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center">
        <p className="text-xs font-mono text-(--text-secondary)">
          Complete your first Singular Synthesis to unlock Omni-Spar upgrades.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Omni-Spar Upgrades
        </p>
        <span className="text-[10px] font-mono font-black g-tqgs">
          {os} OS Available
        </span>
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {OS_UPGRADES.map((def) => {
          const currentLevel = osUpgrades[def.id] ?? 0
          const atCap = currentLevel >= def.maxLevel
          const cost = atCap ? 0 : getUpgradeCost(def, currentLevel)
          const canAfford = os >= cost && !atCap && !prestigeDisabled

          const requiresAutomatedLab =
            def.id === 'automated_timeline_severance' &&
            (osUpgrades.the_automated_lab ?? 0) === 0
          const requiresTimelineSeverance =
            def.id === 'automated_singular_synthesis' &&
            (osUpgrades.automated_timeline_severance ?? 0) === 0
          const missingPrereq =
            requiresAutomatedLab || requiresTimelineSeverance
          const prereqLabel = requiresAutomatedLab
            ? 'Prerequisite: The Automated Lab'
            : 'Prerequisite: Automated Timeline Severance'

          return (
            <div
              key={def.id}
              className={[
                'card rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 border transition-colors',
                atCap
                  ? 'border-(--status-success)/40 bg-(--status-success)/5'
                  : 'border-(--border-default) bg-(--bg-surface)',
                missingPrereq ? 'opacity-40' : ''
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                  <span className="text-xs font-bold text-(--text-primary)">
                    {def.label}
                  </span>
                  {atCap && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10 text-(--status-success)">
                      MAX
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-(--text-secondary) leading-snug">
                  {def.description}
                </p>
                {currentLevel > 0 && (
                  <p className="text-[10px] font-mono text-(--status-success) mt-0.5">
                    Active: {def.effectAtLevel(currentLevel)}
                  </p>
                )}
                {missingPrereq && (
                  <p className="text-[10px] font-mono text-amber-400 mt-1">
                    {prereqLabel}
                  </p>
                )}
              </div>

              {!atCap && (
                <button
                  onClick={() => buyPrestigeUpgrade(def.id, 'os')}
                  disabled={!canAfford || missingPrereq}
                  className={[
                    'shrink-0 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                    canAfford && !missingPrereq
                      ? 'border-yellow-400 bg-yellow-400 text-black hover:brightness-110 shadow-[0_0_10px_rgba(250,204,21,0.35)]'
                      : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  {prestigeDisabled ? 'Suspended' : `${cost} OS`}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
