'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyPrestigeUpgrade } from '@/app/stores/gameActions'
import { OS_UPGRADES, getUpgradeCost } from '@/lib/prestigeUpgradeDefs'

export default function OSUpgradeShop() {
  const os = useGameStore((s) => s.omniSpars)
  const osUpgrades = useGameStore((s) => s.osUpgrades)
  const totalPrestigesTier3 = useGameStore((s) => s.stats.totalPrestigesTier3)

  if (totalPrestigesTier3 === 0) {
    return (
      <p className="text-xs font-mono text-(--text-secondary) text-center py-4">
        Complete your first Singular Synthesis to unlock OS upgrades.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Omni-Spar Upgrades
      </p>
      <div className="grid grid-cols-1 gap-2">
        {OS_UPGRADES.map((def) => {
          const currentLevel = (osUpgrades as any)[def.id] ?? 0
          const atCap = currentLevel >= def.maxLevel
          const cost = atCap ? 0 : getUpgradeCost(def, currentLevel)
          const canAfford = os >= cost && !atCap

          // Automated Timeline Severance requires The Automated Lab
          const requiresAutomatedLab =
            def.id === 'automated_timeline_severance' &&
            (osUpgrades.the_automated_lab ?? 0) === 0

          return (
            <div
              key={def.id}
              className={[
                'card rounded-lg p-2.5 flex items-start gap-3',
                requiresAutomatedLab ? 'opacity-50' : ''
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-(--text-primary) truncate">
                    {def.label}
                  </span>
                  {atCap && (
                    <span className="chip border-(--status-success) text-(--status-success) text-[0.6rem] shrink-0">
                      MAX
                    </span>
                  )}
                </div>
                <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
                  {def.effectAtLevel(currentLevel)}
                </p>
                {requiresAutomatedLab && (
                  <p className="text-[0.6rem] text-(--status-warning) mt-0.5">
                    Requires: The Automated Lab
                  </p>
                )}
              </div>
              {!atCap && (
                <button
                  onClick={() => buyPrestigeUpgrade(def.id, 'os')}
                  disabled={!canAfford || requiresAutomatedLab}
                  className={[
                    'shrink-0 px-2 py-1 text-[0.65rem] font-mono rounded border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                    canAfford && !requiresAutomatedLab
                      ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                      : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  {cost} OS
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
