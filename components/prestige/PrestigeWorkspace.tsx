'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  triggerTierI,
  triggerTierII,
  triggerTierIII
} from '@/app/stores/actions'
import {
  calculateARGain,
  calculateCFGain,
  calculateOSGain,
  canPrestigeTier1,
  canPrestigeTier2,
  canPrestigeTier3,
  getPrestigeResetSummary
} from '@/lib/prestigeCalc'
import { formatPoints } from '@/lib/format'
import ARUpgradeShop from '@/components/prestige/ARUpgradeShop'
import {
  PRESTIGE_TIER1_THRESHOLD,
  PRESTIGE_TIER2_THRESHOLD,
  PRESTIGE_TIER3_THRESHOLD
} from '@/constants/game'
import ExpandedCFShop from './ExpandedCFShop'
import OSUpgradeShop from './OSUpgradeShop'
import AutomationPanel from './AutomationPanel'

type PrestigeSubTab = 'tier1' | 'tier2' | 'tier3'

interface ConfirmState {
  tier: 1 | 2 | 3
  gain: number
}

export default function PrestigeWorkspace() {
  const [subTab, setSubTab] = useState<PrestigeSubTab>('tier1')
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const store = useGameStore.getState()
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)
  const activeMegaproject = useGameStore((s) => s.activeMegaprojectId)

  const canT1 = canPrestigeTier1(store)
  const canT2 = canPrestigeTier2(store)
  const canT3 = canPrestigeTier3(store)

  const arGain = calculateARGain(store)
  const cfGain = calculateCFGain(store)
  const osGain = calculateOSGain(store)

  function handlePrestige(tier: 1 | 2 | 3) {
    const gain = tier === 1 ? arGain : tier === 2 ? cfGain : osGain
    setConfirmState({ tier, gain })
  }

  function confirmPrestige() {
    if (!confirmState) return
    if (confirmState.tier === 1) triggerTierI()
    else if (confirmState.tier === 2) triggerTierII()
    else triggerTierIII()
    setConfirmState(null)
  }

  const summary = confirmState
    ? getPrestigeResetSummary(confirmState.tier)
    : null

  if (confirmState && summary) {
    const currencyLabel =
      confirmState.tier === 1 ? 'AR' : confirmState.tier === 2 ? 'CF' : 'OS'

    return (
      <div className="flex flex-col gap-4 p-3 sm:p-4 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
        <div className="card rounded-2xl p-4 sm:p-5 border border-red-500/70 bg-red-950/30 flex flex-col gap-3.5 shadow-2xl backdrop-blur-md">
          <p className="text-sm sm:text-base font-black text-red-400 font-mono uppercase tracking-widest">
            Confirm Tier {confirmState.tier} Prestige
          </p>
          <p className="text-xs text-(--text-primary) font-mono">
            You will earn{' '}
            <span className="text-(--text-accent) font-bold text-sm">
              {confirmState.gain} {currencyLabel}
            </span>
            .
          </p>

          {activeMegaproject && (
            <p className="text-xs text-amber-400 font-mono bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg">
              Warning: Active megaproject progress will be lost.
            </p>
          )}

          <div className="flex flex-col gap-1 bg-black/40 p-3 rounded-lg border border-red-500/30 font-mono text-[11px]">
            <p className="font-black text-red-400 uppercase tracking-widest">
              Resets:
            </p>
            {summary.resets.map((r) => (
              <p key={r} className="text-(--text-secondary)">
                - {r}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1 bg-black/40 p-3 rounded-lg border border-(--status-success)/30 font-mono text-[11px]">
            <p className="font-black text-(--status-success) uppercase tracking-widest">
              Retains:
            </p>
            {summary.retains.map((r) => (
              <p key={r} className="text-(--text-secondary)">
                + {r}
              </p>
            ))}
          </div>

          <div className="flex gap-2.5 mt-2">
            <button
              onClick={confirmPrestige}
              className="flex-1 py-2.5 text-xs font-black font-mono uppercase rounded-lg border border-red-500 bg-red-500 text-black hover:brightness-110 transition-all cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.4)]"
            >
              CONFIRM RESET
            </button>
            <button
              onClick={() => setConfirmState(null)}
              className="flex-1 py-2.5 text-xs font-mono font-bold rounded-lg border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) hover:text-(--text-primary) transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 sm:p-4 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Sub-tab bar */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-(--bg-surface) border border-(--border-default) rounded-xl shrink-0">
        {(
          [
            { id: 'tier1' as const, label: 'Tier I', locked: false },
            {
              id: 'tier2' as const,
              label: 'Tier II',
              locked: !canT2 && chronalFractures === 0
            },
            {
              id: 'tier3' as const,
              label: 'Tier III',
              locked: !canT3 && omniSpars === 0
            }
          ] satisfies { id: PrestigeSubTab; label: string; locked: boolean }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={[
              'py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer',
              subTab === tab.id
                ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent)'
                : tab.locked
                  ? 'border-transparent text-(--text-secondary)/40 opacity-50 cursor-not-allowed'
                  : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tier I */}
      {subTab === 'tier1' && (
        <div className="flex flex-col gap-4">
          {/* Current run stats */}
          <div className="card rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 border border-(--border-default) bg-(--bg-surface)">
            <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Current Run
            </p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Lifetime RP:</span>
              <span className="font-bold text-(--text-primary)">
                {formatPoints(lifetimePoints)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">AR Balance:</span>
              <span className="font-bold text-purple-400">
                {formatPoints(BigInt(Math.floor(arkalonResonance)))} AR
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected gain:</span>
              <span
                className={[
                  'font-black',
                  canT1
                    ? 'text-(--status-success)'
                    : 'text-(--text-secondary)/70'
                ].join(' ')}
              >
                {arGain > 0
                  ? `+${formatPoints(BigInt(arGain))} AR`
                  : `Need ${formatPoints(PRESTIGE_TIER1_THRESHOLD)} lifetime RP`}
              </span>
            </div>
          </div>

          {/* Prestige button */}
          <button
            onClick={() => handlePrestige(1)}
            disabled={!canT1}
            className={[
              'w-full py-3 text-xs sm:text-sm font-black font-mono uppercase tracking-widest rounded-xl border transition-all cursor-pointer select-none',
              canT1
                ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Reality Recalibration {canT1 ? `(+${arGain} AR)` : ''}
          </button>

          <div className="section-divider" />
          <ARUpgradeShop />
          <div className="section-divider" />
          <AutomationPanel />
        </div>
      )}

      {/* Tier II */}
      {subTab === 'tier2' && (
        <div className="flex flex-col gap-3.5">
          <div className="card rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 border border-(--border-default) bg-(--bg-surface)">
            <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Timeline Severance Telemetry
            </p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Fractures Held:</span>
              <span className="font-bold text-cyan-400">
                {formatPoints(BigInt(Math.floor(chronalFractures)))} CF
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected Yield:</span>
              <span
                className={`font-black ${canT2 ? 'text-(--status-success)' : 'text-(--text-secondary)/70'}`}
              >
                {cfGain > 0
                  ? `+${formatPoints(BigInt(cfGain))} CF`
                  : `Requires ${formatPoints(PRESTIGE_TIER2_THRESHOLD)} + Chronos Array`}
              </span>
            </div>
          </div>

          <button
            onClick={() => handlePrestige(2)}
            disabled={!canT2}
            className={[
              'w-full py-3 text-xs sm:text-sm font-black font-mono uppercase tracking-widest rounded-xl border transition-all cursor-pointer select-none',
              canT2
                ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Execute Timeline Severance {canT2 ? `(+${cfGain} CF)` : ''}
          </button>

          <div className="section-divider" />
          <ExpandedCFShop />
        </div>
      )}

      {/* Tier III */}
      {subTab === 'tier3' && (
        <div className="flex flex-col gap-3.5">
          <div className="card rounded-xl p-3 sm:p-4 flex flex-col gap-2.5 border border-(--border-default) bg-(--bg-surface)">
            <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Singular Synthesis Telemetry
            </p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Omni-Spars Held:</span>
              <span className="font-bold text-yellow-300">
                {formatPoints(BigInt(Math.floor(omniSpars)))} OS
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected Yield:</span>
              <span
                className={`font-black ${canT3 ? 'text-(--status-success)' : 'text-(--text-secondary)/70'}`}
              >
                {osGain > 0
                  ? `+${formatPoints(BigInt(osGain))} OS`
                  : `Requires ${formatPoints(PRESTIGE_TIER3_THRESHOLD)} + Omega Sphere`}
              </span>
            </div>
          </div>

          <button
            onClick={() => handlePrestige(3)}
            disabled={!canT3}
            className={[
              'w-full py-3 text-xs sm:text-sm font-black font-mono uppercase tracking-widest rounded-xl border transition-all cursor-pointer select-none',
              canT3
                ? 'border-(--border-accent) bg-(--border-accent) text-[#080c14] hover:brightness-110 shadow-[0_0_15px_rgba(0,240,255,0.35)]'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Execute Singular Synthesis {canT3 ? `(+${osGain} OS)` : ''}
          </button>

          <div className="section-divider" />
          <OSUpgradeShop />
        </div>
      )}
    </div>
  )
}
