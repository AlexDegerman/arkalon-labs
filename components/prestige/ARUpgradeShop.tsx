'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyPrestigeUpgrade } from '@/app/stores/gameActions'
import { AR_UPGRADES, getUpgradeCost } from '@/lib/prestigeUpgradeDefs'

export default function ARUpgradeShop() {
  const ar = useGameStore((s) => s.arkalonResonance)
  const arUpgrades = useGameStore((s) => s.arUpgrades)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Arkalon Resonance Upgrades
      </p>
      <div className="grid grid-cols-1 gap-2">
        {AR_UPGRADES.map((def) => {
          const currentLevel = (arUpgrades as any)[def.id] ?? 0
          const atCap = currentLevel >= def.maxLevel
          const cost = atCap ? 0 : getUpgradeCost(def, currentLevel)
          const canAfford = ar >= cost && !atCap

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
                  onClick={() => buyPrestigeUpgrade(def.id, 'ar')}
                  disabled={!canAfford}
                  className={[
                    'shrink-0 px-2 py-1 text-[0.65rem] font-mono rounded border transition-colors',
                    'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
                    canAfford
                      ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                      : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
                  ].join(' ')}
                >
                  {cost} AR
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
