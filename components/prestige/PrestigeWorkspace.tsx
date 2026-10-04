'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  triggerTierI,
  triggerTierII,
  triggerTierIII
} from '@/app/stores/gameActions'
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
      <div className="flex flex-col gap-4 p-3 h-full overflow-y-auto scrollbar-dark">
        <div className="card rounded-lg p-4 border-#ef4444 flex flex-col gap-3">
          <p className="text-sm font-bold text-#ef4444 font-mono uppercase">
            Confirm Tier {confirmState.tier} Prestige
          </p>
          <p className="text-xs text-(--text-secondary)">
            You will earn{' '}
            <span className="text-(--text-accent) font-bold">
              {confirmState.gain} {currencyLabel}
            </span>
            .
          </p>

          {activeMegaproject && (
            <p className="text-xs text-(--status-warning)">
              Warning: Active megaproject progress will be lost.
            </p>
          )}

          <div className="flex flex-col gap-1">
            <p className="text-[0.65rem] font-semibold text-#ef4444 uppercase tracking-wide">
              Resets:
            </p>
            {summary.resets.map((r) => (
              <p key={r} className="text-[0.65rem] text-(--text-secondary)">
                - {r}
              </p>
            ))}
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[0.65rem] font-semibold text-(--status-success) uppercase tracking-wide">
              Retains:
            </p>
            {summary.retains.map((r) => (
              <p key={r} className="text-[0.65rem] text-(--text-secondary)">
                + {r}
              </p>
            ))}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={confirmPrestige}
              className="flex-1 py-2 text-xs font-bold font-mono rounded border border-#ef4444 text-#ef4444 hover:bg-#ef4444/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-#ef4444"
            >
              CONFIRM RESET
            </button>
            <button
              onClick={() => setConfirmState(null)}
              className="flex-1 py-2 text-xs font-mono rounded border border-(--border-default) text-(--text-secondary) hover:border-(--text-secondary) transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-dark">
      {/* Sub-tab bar */}
      <div className="flex border-b border-(--border-default)">
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
              'workspace-tab',
              subTab === tab.id ? 'workspace-tab-active' : '',
              tab.locked ? 'workspace-tab-locked' : ''
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
          <div className="card rounded-lg p-3 flex flex-col gap-2">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Current Run
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                Lifetime RP
              </span>
              <span className="text-xs font-mono text-(--text-accent)">
                {formatPoints(lifetimePoints)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                AR Balance
              </span>
              <span className="text-xs font-mono text-(--text-accent)">
                {arkalonResonance} AR
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                Projected gain
              </span>
              <span
                className={[
                  'text-xs font-mono font-bold',
                  canT1 ? 'text-(--status-success)' : 'text-(--text-secondary)'
                ].join(' ')}
              >
                {arGain > 0
                  ? `+${arGain} AR`
                  : `Need ${formatPoints(PRESTIGE_TIER1_THRESHOLD)} lifetime RP`}
              </span>
            </div>
          </div>

          {/* Prestige button */}
          <button
            onClick={() => handlePrestige(1)}
            disabled={!canT1}
            className={[
              'w-full py-3 text-sm font-bold font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
              canT1
                ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Reality Recalibration {canT1 ? `(+${arGain} AR)` : ''}
          </button>

          <div className="section-divider" />
          <ARUpgradeShop />
        </div>
      )}

      {/* Tier II */}
      {subTab === 'tier2' && (
        <div className="flex flex-col gap-4">
          <div className="card rounded-lg p-3 flex flex-col gap-2">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Timeline Severance
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                CF Balance
              </span>
              <span className="text-xs font-mono text-(--text-accent)">
                {chronalFractures} CF
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                Projected gain
              </span>
              <span
                className={[
                  'text-xs font-mono font-bold',
                  canT2 ? 'text-(--status-success)' : 'text-(--text-secondary)'
                ].join(' ')}
              >
                {cfGain > 0
                  ? `+${cfGain} CF`
                  : `Need ${formatPoints(PRESTIGE_TIER2_THRESHOLD)} + Chronos Array`}
              </span>
            </div>
          </div>
          <button
            onClick={() => handlePrestige(2)}
            disabled={!canT2}
            className={[
              'w-full py-3 text-sm font-bold font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
              canT2
                ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Timeline Severance {canT2 ? `(+${cfGain} CF)` : ''}
          </button>
          <div className="section-divider" />
          <ExpandedCFShop />
        </div>
      )}

      {/* Tier III */}
      {subTab === 'tier3' && (
        <div className="flex flex-col gap-4">
          <div className="card rounded-lg p-3 flex flex-col gap-2">
            <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
              Singular Synthesis
            </p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                OS Balance
              </span>
              <span className="text-xs font-mono text-(--text-accent)">
                {omniSpars} OS
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-(--text-secondary)">
                Projected gain
              </span>
              <span
                className={[
                  'text-xs font-mono font-bold',
                  canT3 ? 'text-(--status-success)' : 'text-(--text-secondary)'
                ].join(' ')}
              >
                {osGain > 0
                  ? `+${osGain} OS`
                  : `Need ${formatPoints(PRESTIGE_TIER3_THRESHOLD)} + Omega Sphere`}
              </span>
            </div>
          </div>
          <button
            onClick={() => handlePrestige(3)}
            disabled={!canT3}
            className={[
              'w-full py-3 text-sm font-bold font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--border-accent)',
              canT3
                ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            Singular Synthesis {canT3 ? `(+${osGain} OS)` : ''}
          </button>
          <div className="section-divider" />
          <OSUpgradeShop />
        </div>
      )}
    </div>
  )
}
