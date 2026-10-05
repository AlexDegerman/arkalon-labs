'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyPrestigeUpgrade } from '@/app/stores/actions'
import { CF_UPGRADES, getUpgradeCost } from '@/lib/prestigeUpgradeDefs'

export default function ExpandedCFShop() {
  const cf = useGameStore((s) => s.chronalFractures)
  const cfUpgrades = useGameStore((s) => s.cfUpgrades)
  const totalPrestigesTier2 = useGameStore((s) => s.stats.totalPrestigesTier2)

  if (totalPrestigesTier2 === 0) {
    return (
      <p className="text-xs font-mono text-(--text-secondary) text-center py-4">
        Complete your first Timeline Severance to unlock CF upgrades.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Chronal Fracture Upgrades
      </p>
      <div className="grid grid-cols-1 gap-2">
        {CF_UPGRADES.map((def) => {
          const currentLevel = (cfUpgrades as any)[def.id] ?? 0
          const atCap = currentLevel >= def.maxLevel
          const cost = atCap ? 0 : getUpgradeCost(def, currentLevel)
          const canAfford = cf >= cost && !atCap

          return (
            <div
              key={def.id}
              className="card rounded-lg p-2.5 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-(--text-primary) truncate">
                    {def.label}
                  </span>
                  {def.maxLevel > 1 && (
                    <span className="chip border-(--border-default) text-(--text-secondary) text-[0.6rem] shrink-0">
                      {currentLevel}/{def.maxLevel}
                    </span>
                  )}
                  {atCap && (
                    <span className="chip border-(--status-success) text-(--status-success) text-[0.6rem] shrink-0">
                      MAX
                    </span>
                  )}
                </div>
                <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
                  {def.effectAtLevel(currentLevel)}
                </p>
              </div>
              {!atCap && (
                <button
                  onClick={() => buyPrestigeUpgrade(def.id, 'cf')}
                  disabled={!canAfford}
                  className={[
                    'shrink-0 px-2 py-1 text-[0.65rem] font-mono rounded border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                    canAfford
                      ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                      : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  {cost} CF
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
