'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { playSound } from '@/hooks/useSound'
import { AUTOMATION_FEATURES } from '@/lib/automationDefs'
import type { AutomationState } from '@/types/game'

export default function AutomationPanel() {
  const automation = useGameStore((s) => s.automation)
  const arUpgrades = useGameStore((s) => s.arUpgrades)
  const cfUpgrades = useGameStore((s) => s.cfUpgrades)
  const osUpgrades = useGameStore((s) => s.osUpgrades)
  const challengeRecords = useGameStore((s) => s.challengeRecords)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const autoPrestigeMode = useGameStore((s) => s.autoPrestigeMode ?? 'ratio')
  const autoPrestigeTargetAR = useGameStore(
    (s) => s.autoPrestigeTargetAR ?? 1000
  )
  const autoPrestigeRatio = useGameStore((s) => s.autoPrestigeRatio ?? 2)
  const autoPrestigeTargetCF = useGameStore((s) => s.autoPrestigeTargetCF ?? 10)
  const autoPrestigeTargetOS = useGameStore((s) => s.autoPrestigeTargetOS ?? 10)
  const autoPrestigeWaitForHigher = useGameStore(
    (s) => s.autoPrestigeWaitForHigher ?? true
  )
  const autoPrestigeHoldForDyson = useGameStore(
    (s) => s.autoPrestigeHoldForDyson ?? false
  )
  const activeMegaprojectId = useGameStore((s) => s.activeMegaprojectId)
  const autoBuyOptimalReservePercent = useGameStore(
    (s) => s.autoBuyOptimalReservePercent ?? 25
  )
  const autoRelicTargetLevel = useGameStore((s) => s.autoRelicTargetLevel ?? 20)
  const autoRelicDustReserve = useGameStore((s) => s.autoRelicDustReserve ?? 25)

  // Determine which automation features are unlocked
  function isUnlocked(featureId: keyof AutomationState): boolean {
    switch (featureId) {
      case 'autoBuyBasic':
        return arUpgrades.auto_buy_basic > 0
      case 'autoBuyOptimal':
        return (challengeRecords['SC6']?.completedTiers ?? 0) >= 3
      case 'autoBuySynthesizers':
        return (cfUpgrades.auto_buy_synthesizers ?? 0) > 0
      case 'autoResearchQueue':
        return arUpgrades.auto_research_queue > 0
      case 'autoPrestigeTierI':
        return osUpgrades.the_automated_lab > 0
      case 'autoPrestigeTierII':
        return osUpgrades.automated_timeline_severance > 0
      case 'autoPrestigeTierIII':
        return (osUpgrades.automated_singular_synthesis ?? 0) > 0
      case 'autoEquipRelic':
        return (challengeRecords['AC6']?.completedTiers ?? 0) > 0
      case 'autoUpgradeRelics':
        return (cfUpgrades.auto_upgrade_relics ?? 0) > 0
      case 'autoLaunchProbe':
        return (challengeRecords['SC12']?.completedTiers ?? 0) >= 3
      case 'autoModuleBuy':
        return cfUpgrades.auto_module_buyer > 0
      case 'autoDysonSwarm':
        return (osUpgrades.auto_dyson_swarm ?? 0) > 0
      default:
        return false
    }
  }

  function toggleAutomation(featureId: keyof AutomationState) {
    playSound('click')
    const current = automation[featureId]
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
          const enabled = automation[feature.id]
          return (
            <div
              key={feature.id}
              className="card rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 border border-(--border-default) bg-(--bg-surface)"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-(--text-primary)">
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

      {/* Smart Auto-Prestige Configuration */}
      {osUpgrades.the_automated_lab > 0 && (
        <div className="card rounded-xl p-3 bg-(--bg-surface) border border-cyan-400/40 flex flex-col gap-2 font-mono text-xs mt-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider">
              ✦ Smart Auto-Prestige Calibration
            </span>
            <span className="text-[9px] text-(--text-secondary)">
              Tier I Automation
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1">
            {(
              [
                { id: 'target', label: 'Fixed AR' },
                { id: 'ratio', label: 'Multiplier' },
                { id: 'stall', label: 'PPS Stall' }
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  playSound('click')
                  useGameStore.setState({ autoPrestigeMode: m.id })
                }}
                className={[
                  'py-1 rounded border text-[10px] uppercase font-bold transition-all cursor-pointer',
                  autoPrestigeMode === m.id
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                    : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                ].join(' ')}
              >
                {m.label}
              </button>
            ))}
          </div>

          {autoPrestigeMode === 'target' && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
              <span className="text-(--text-secondary)">Target AR Yield:</span>
              <input
                type="number"
                min={1}
                max={10000000}
                value={autoPrestigeTargetAR}
                onChange={(e) =>
                  useGameStore.setState({
                    autoPrestigeTargetAR: Math.max(
                      1,
                      Number(e.target.value) || 1
                    )
                  })
                }
                className="w-24 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {autoPrestigeMode === 'ratio' && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
              <span className="text-(--text-secondary)">
                Ratio vs Current AR:
              </span>
              <input
                type="number"
                step="0.5"
                min={1}
                max={100}
                value={autoPrestigeRatio}
                onChange={(e) =>
                  useGameStore.setState({
                    autoPrestigeRatio: Math.max(1, Number(e.target.value) || 1)
                  })
                }
                className="w-20 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-cyan-300 focus:outline-none focus:border-cyan-400"
              />
            </div>
          )}

          {autoPrestigeMode === 'stall' && (
            <p className="text-[10px] text-(--text-secondary) pt-1 border-t border-(--border-default)/50 leading-snug">
              Triggers when run duration exceeds 45s and RP/s growth stalls (≤1%
              gain over a 15s window).
            </p>
          )}

          {osUpgrades.automated_timeline_severance > 0 && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
              <span className="text-(--text-secondary)">Target CF Yield:</span>
              <input
                type="number"
                min={1}
                max={1000000}
                value={autoPrestigeTargetCF}
                onChange={(e) =>
                  useGameStore.setState({
                    autoPrestigeTargetCF: Math.max(
                      1,
                      Number(e.target.value) || 1
                    )
                  })
                }
                className="w-24 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-sky-300 focus:outline-none focus:border-sky-400"
              />
            </div>
          )}

          {(osUpgrades.automated_singular_synthesis ?? 0) > 0 && (
            <>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
                <span className="text-(--text-secondary)">
                  Target OS Yield:
                </span>
                <input
                  type="number"
                  min={1}
                  max={1000000}
                  value={autoPrestigeTargetOS}
                  onChange={(e) =>
                    useGameStore.setState({
                      autoPrestigeTargetOS: Math.max(
                        1,
                        Number(e.target.value) || 1
                      )
                    })
                  }
                  className="w-24 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
                <span className="text-(--text-secondary)">
                  Hold Tier II when T3 active:
                </span>
                <button
                  type="button"
                  onClick={() =>
                    useGameStore.setState({
                      autoPrestigeWaitForHigher: !autoPrestigeWaitForHigher
                    })
                  }
                  className={[
                    'px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer',
                    autoPrestigeWaitForHigher
                      ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success)'
                      : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
                  ].join(' ')}
                >
                  {autoPrestigeWaitForHigher ? 'HOLD T2' : 'ALLOW T2'}
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-2 pt-1 border-t border-(--border-default)/50 text-[11px]">
            <span className="text-(--text-secondary)">
              Pause Auto-Prestige during Dyson:
            </span>
            <button
              type="button"
              title="HOLD always pauses Auto-Prestige while Dyson is active; SMART holds when Dyson can finish within 5 minutes."
              onClick={() =>
                useGameStore.setState({
                  autoPrestigeHoldForDyson: !autoPrestigeHoldForDyson
                })
              }
              className={[
                'px-2 py-0.5 rounded border text-[10px] font-bold cursor-pointer',
                autoPrestigeHoldForDyson
                  ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success)'
                  : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
              ].join(' ')}
            >
              {autoPrestigeHoldForDyson ? 'HOLD' : 'SMART (≤5m)'}
            </button>
          </div>
          <p className="text-[10px] text-(--text-secondary)/75 leading-snug">
            One-time Megaprojects always pause Auto-Prestige while active; SMART
            holds Dyson when completion ETA is under 5m.
            {activeMegaprojectId &&
              (activeMegaprojectId !== 'dyson_swarm' ||
                autoPrestigeHoldForDyson) && (
                <span className="text-amber-300 font-bold ml-1">
                  (Currently paused for active Megaproject)
                </span>
              )}
          </p>
        </div>
      )}

      {/* Additional Automation Threshold Controls */}
      {(isUnlocked('autoBuyOptimal') || isUnlocked('autoUpgradeRelics')) && (
        <div className="card rounded-xl p-3 bg-(--bg-surface) border border-(--border-default) flex flex-col gap-2 font-mono text-[11px] mt-1">
          <span className="text-[10px] font-bold text-(--text-secondary) uppercase tracking-wider">
            Automation Reserves & Caps
          </span>

          {isUnlocked('autoBuyOptimal') && (
            <div className="flex items-center justify-between gap-2">
              <span className="text-(--text-secondary)">
                Optimal RP Reserve (%):
              </span>
              <input
                type="number"
                min={0}
                max={90}
                step={5}
                value={autoBuyOptimalReservePercent}
                onChange={(e) =>
                  useGameStore.setState({
                    autoBuyOptimalReservePercent: Math.max(
                      0,
                      Math.min(90, Number(e.target.value) || 0)
                    )
                  })
                }
                className="w-20 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-(--text-accent) focus:outline-none focus:border-(--border-accent)"
              />
            </div>
          )}

          {isUnlocked('autoUpgradeRelics') && (
            <>
              <div className="flex items-center justify-between gap-2">
                <span className="text-(--text-secondary)">
                  Relic Auto-Upgrade Cap:
                </span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={autoRelicTargetLevel}
                  onChange={(e) =>
                    useGameStore.setState({
                      autoRelicTargetLevel: Math.max(
                        1,
                        Math.min(100, Number(e.target.value) || 1)
                      )
                    })
                  }
                  className="w-20 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-(--text-secondary)">
                  Relic Dust Reserve:
                </span>
                <input
                  type="number"
                  min={0}
                  max={1000000}
                  value={autoRelicDustReserve}
                  onChange={(e) =>
                    useGameStore.setState({
                      autoRelicDustReserve: Math.max(
                        0,
                        Number(e.target.value) || 0
                      )
                    })
                  }
                  className="w-24 bg-(--bg-elevated) border border-(--border-default) px-2 py-0.5 rounded text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400"
                />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
