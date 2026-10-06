'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { buyPrestigeUpgrade } from '@/app/stores/actions'
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
              className={[
                'card rounded-xl p-3 flex items-center justify-between gap-3 border transition-colors',
                atCap
                  ? 'border-(--status-success)/40 bg-(--status-success)/5'
                  : 'border-(--border-default) bg-(--bg-surface)'
              ].join(' ')}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-xs font-bold text-(--text-primary) truncate">
                    {def.label}
                  </span>
                  {def.maxLevel > 1 && !atCap && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)">
                      {currentLevel}/{def.maxLevel}
                    </span>
                  )}
                  {atCap && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--status-success)/30 bg-(--status-success)/10 text-(--status-success)">
                      MAX
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-(--text-secondary) leading-snug">
                  {def.effectAtLevel(currentLevel)}
                </p>
              </div>

              {!atCap && (
                <button
                  onClick={() => buyPrestigeUpgrade(def.id, 'ar')}
                  disabled={!canAfford}
                  className={[
                    'shrink-0 px-3 py-1.5 text-xs font-mono font-bold rounded-lg border transition-all cursor-pointer',
                    canAfford
                      ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110'
                      : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
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
