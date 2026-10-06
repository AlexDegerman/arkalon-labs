'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { AUTOMATION_FEATURES } from '@/lib/automationDefs'

export default function AutomationPanel() {
  const automation = useGameStore((s) => s.automation)
  const arUpgrades = useGameStore((s) => s.arUpgrades)
  const cfUpgrades = useGameStore((s) => s.cfUpgrades)
  const osUpgrades = useGameStore((s) => s.osUpgrades)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)

  // Determine which automation features are unlocked
  function isUnlocked(featureId: string): boolean {
    switch (featureId) {
      case 'autoBuyBasic':
        return arUpgrades.auto_buy_basic > 0
      case 'autoBuyOptimal':
        return (challengeRecords['SC6']?.completedTiers ?? 0) >= 3
      case 'autoResearchQueue':
        return arUpgrades.auto_research_queue > 0
      case 'autoStabilizeAnomaly':
        return (challengeRecords['SC5']?.completedTiers ?? 0) >= 5
      case 'autoPrestigeTierI':
        return osUpgrades.the_automated_lab > 0
      case 'autoPrestigeTierII':
        return osUpgrades.automated_timeline_severance > 0
      case 'autoEquipRelic':
        return (challengeRecords['AC6']?.completedTiers ?? 0) > 0
      case 'autoLaunchProbe':
        return (challengeRecords['SC12']?.completedTiers ?? 0) >= 3
      case 'autoModuleBuy':
        return cfUpgrades.auto_module_buyer > 0
      default:
        return false
    }
  }

  function toggleAutomation(featureId: string) {
    const current = (automation as any)[featureId] as boolean
    useGameStore.setState((s) => ({
      automation: { ...s.automation, [featureId]: !current }
    }))
  }

  const unlockedFeatures = AUTOMATION_FEATURES.filter((f) => isUnlocked(f.id))

  if (!prestige1Done) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Automation
        </p>
        <p className="text-[0.65rem] text-(--text-secondary)">
          Complete your first Reality Recalibration to begin unlocking
          automation features.
        </p>
      </div>
    )
  }

  if (unlockedFeatures.length === 0) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
          Automation
        </p>
        <p className="text-[0.65rem] text-(--text-secondary)">
          Purchase AR upgrades and complete challenges to unlock automation
          features.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Automation
      </p>
      <div className="flex flex-col gap-1.5">
        {unlockedFeatures.map((feature) => {
          const enabled = (automation as any)[feature.id] as boolean
          return (
            <div
              key={feature.id}
              className="card rounded-xl p-2.5 sm:p-3 flex items-center justify-between gap-3 border border-(--border-default) bg-(--bg-surface)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-(--text-primary) truncate">
                  {feature.label}
                </p>
                <p className="text-[11px] text-(--text-secondary) leading-snug">
                  {feature.description}
                </p>
              </div>

              <button
                onClick={() => toggleAutomation(feature.id)}
                role="switch"
                aria-checked={enabled}
                className={[
                  'relative w-10 h-5 rounded-full border transition-colors cursor-pointer shrink-0',
                  enabled
                    ? 'bg-(--status-success) border-(--status-success)'
                    : 'bg-(--bg-elevated) border-(--border-default)'
                ].join(' ')}
                aria-label={`Toggle ${feature.label}`}
              >
                <span
                  className={[
                    'absolute top-0.5 w-4 h-4 rounded-full bg-black transition-transform',
                    enabled ? 'translate-x-5' : 'translate-x-0.5'
                  ].join(' ')}
                />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
