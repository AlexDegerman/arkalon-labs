'use client'

import { useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import {
  buildTier2ResetState,
  buildTier3ResetState,
  calculateARGain,
  calculateCFGain,
  calculateOSGain,
  canPrestigeTier1,
  canPrestigeTier2,
  canPrestigeTier3,
  getPrestigeResetSummary
} from '@/lib/prestigeCalc'
import { computeARBonus, getCountedAR } from '@/lib/productionEngine'
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
import {
  triggerTierI,
  triggerTierII,
  triggerTierIII
} from '@/app/stores/actions/prestigeActions'

type PrestigeSubTab = 'constellation' | 'tier1' | 'tier2' | 'tier3'

function PrestigeConstellationMap() {
  const stats = useGameStore((s) => s.stats)
  const ar = useGameStore((s) => s.arkalonResonance)
  const cf = useGameStore((s) => s.chronalFractures)
  const os = useGameStore((s) => s.omniSpars)
  const megas = useGameStore((s) => s.completedMegaprojects)

  const hasT2Req = megas.includes('chronos_array')
  const hasT3Req = megas.includes('omega_singularity_sphere')

  return (
    <div className="card rounded-xl p-3.5 bg-(--bg-surface) border border-cyan-400/40 shadow-[0_0_15px_rgba(0,240,255,0.08)] flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-2">
        <span className="text-[10px] font-black uppercase text-cyan-300 tracking-wider">
          ✦ Prestige Tiers Overview
        </span>
        <span className="text-[9px] text-(--text-secondary)">
          Nested Reset Hierarchy
        </span>
      </div>

      <div className="grid grid-cols-1 @[420px]:grid-cols-3 gap-1.5">
        <div className="p-2.5 rounded-lg border border-purple-500/40 bg-purple-950/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-purple-300">
              Tier I: Reality Recalibration
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-purple-500/20 text-purple-200">
              {stats.totalPrestigesTier1} Runs
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            Earns: Arkalon Resonance ({Math.floor(ar)} AR)
          </span>
          <p className="text-[9px] text-(--text-secondary)/70 leading-tight">
            At 1.00 Billion RP. Resets RP & generators; keeps modules, AR perks,
            relics & operations.
          </p>
        </div>

        <div className="p-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-cyan-300">
              Tier II: Timeline Severance
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-200">
              {stats.totalPrestigesTier2} Runs
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            Earns: Chronal Fractures ({Math.floor(cf)} CF)
          </span>
          <p className="text-[9px] text-(--text-secondary)/70 leading-tight">
            Requires Chronos Array ({hasT2Req ? '✓' : 'Pending'}) + 100.00
            Decillion RP.
          </p>
        </div>

        <div className="p-2.5 rounded-lg border border-amber-500/40 bg-amber-950/20 flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300">
              Tier III: Singular Synthesis
            </span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-200">
              {stats.totalPrestigesTier3} Runs
            </span>
          </div>
          <span className="text-[10px] text-(--text-secondary)">
            Earns: Omni-Spars ({Math.floor(os)} OS)
          </span>
          <p className="text-[9px] text-(--text-secondary)/70 leading-tight">
            Requires Omega Sphere ({hasT3Req ? '✓' : 'Pending'}) + 10.00
            Septenvigintillion RP.
          </p>
        </div>
      </div>
    </div>
  )
}

interface ConfirmState {
  tier: 1 | 2 | 3
  gain: number
}

export default function PrestigeWorkspace() {
  const [subTab, setSubTab] = useState<PrestigeSubTab>('tier1')
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null)

  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)
  const totalPrestigesTier2 = useGameStore((s) => s.stats.totalPrestigesTier2)
  const totalPrestigesTier3 = useGameStore((s) => s.stats.totalPrestigesTier3)
  const activeMegaproject = useGameStore((s) => s.activeMegaprojectId)
  const completedMegaprojects = useGameStore((s) => s.completedMegaprojects)

  const hasChronosArray = completedMegaprojects.includes('chronos_array')
  const hasOmegaSphere = completedMegaprojects.includes(
    'omega_singularity_sphere'
  )
  const hasT2RP = lifetimePoints >= PRESTIGE_TIER2_THRESHOLD
  const hasT3RP = lifetimePoints >= PRESTIGE_TIER3_THRESHOLD

  const canT1 = useGameStore(canPrestigeTier1)
  const canT2 = useGameStore(canPrestigeTier2)
  const canT3 = useGameStore(canPrestigeTier3)

  const arGain = useGameStore(calculateARGain)
  const cfGain = useGameStore(calculateCFGain)
  const osGain = useGameStore(calculateOSGain)
  const lastPrestigeTime = useGameStore((s) => s.stats.lastPrestigeTime)
  const totalSessionPlaytime = useGameStore((s) => s.stats.totalSessionPlaytime)
  const resonanceMemoryAR = useGameStore((s) => s.resonanceMemoryAR ?? 0)
  const beforeARMult = useGameStore(computeARBonus)
  const currentCountedAR = useGameStore(getCountedAR)
  const afterT1ARMult = useGameStore((s) =>
    computeARBonus({ ...s, arkalonResonance: s.arkalonResonance + arGain })
  )
  const afterT2ARMult = useGameStore((s) => {
    const patch = buildTier2ResetState(s, cfGain)
    return computeARBonus({
      ...s,
      ...patch,
      chronalFractures: s.chronalFractures + cfGain
    })
  })
  const afterT3ARMult = useGameStore((s) => {
    const patch = buildTier3ResetState(s, osGain)
    return computeARBonus({
      ...s,
      ...patch,
      omniSpars: s.omniSpars + osGain
    })
  })

  const runSeconds = Math.max(
    60,
    lastPrestigeTime > 0
      ? (Date.now() - lastPrestigeTime) / 1000
      : totalSessionPlaytime
  )
  const arPerHour = arGain > 0 ? Math.round((arGain / runSeconds) * 3600) : 0

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
    ? getPrestigeResetSummary(confirmState.tier, useGameStore.getState())
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
          <div className="p-2.5 rounded-lg bg-black/40 border border-(--border-accent)/30 font-mono text-[11px] flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-(--text-secondary)">AR Multiplier:</span>
              <span className="font-bold text-cyan-300">
                {beforeARMult.toFixed(2)}x →{' '}
                {(confirmState.tier === 1
                  ? afterT1ARMult
                  : confirmState.tier === 2
                    ? afterT2ARMult
                    : afterT3ARMult
                ).toFixed(2)}
                x
              </span>
            </div>
            {confirmState.tier >= 2 && (
              <div className="flex items-center justify-between">
                <span className="text-(--text-secondary)">
                  Resonance Memory Floor:
                </span>
                <span className="font-bold text-(--status-success)">
                  {Math.max(
                    resonanceMemoryAR,
                    currentCountedAR
                  ).toLocaleString()}{' '}
                  AR kept
                </span>
              </div>
            )}
          </div>

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
    <div className="@container flex flex-col gap-2 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Sub-tab bar */}
      <div className="grid grid-cols-4 gap-1 p-1 bg-(--bg-surface) border border-(--border-default) rounded-xl shrink-0">
        {(
          [
            {
              id: 'constellation' as const,
              label: 'Overview ✦',
              locked: false
            },
            { id: 'tier1' as const, label: 'Tier I (AR)', locked: false },
            {
              id: 'tier2' as const,
              label: 'Tier II (CF)',
              locked: !canT2 && totalPrestigesTier2 === 0
            },
            {
              id: 'tier3' as const,
              label: 'Tier III (OS)',
              locked: !canT3 && totalPrestigesTier3 === 0
            }
          ] satisfies { id: PrestigeSubTab; label: string; locked: boolean }[]
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={[
              'py-1.5 px-1 text-[11px] @[380px]:text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer',
              subTab === tab.id
                ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent)'
                : tab.locked
                  ? 'border-transparent text-(--text-secondary)/55 hover:text-(--text-secondary)'
                  : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Constellation Topology View */}
      {subTab === 'constellation' && <PrestigeConstellationMap />}

      {/* Tier I */}
      {subTab === 'tier1' && (
        <div className="flex flex-col gap-2.5">
          {/* Current run stats */}
          <div className="card rounded-xl p-2.5 sm:p-3 flex flex-col gap-1.5 border border-(--border-default) bg-(--bg-surface)">
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
              <span className="font-black g-dd">
                {formatPoints(BigInt(Math.floor(arkalonResonance)))} AR
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected gain:</span>
              <span
                className={[
                  'font-black',
                  canT1 ? 'g-sp' : 'text-(--text-secondary)/70'
                ].join(' ')}
              >
                {arGain > 0
                  ? `+${formatPoints(BigInt(arGain))} AR (~${formatPoints(BigInt(arPerHour))}/hr)`
                  : `Need ${formatPoints(PRESTIGE_TIER1_THRESHOLD)} lifetime RP`}
              </span>
            </div>
            {resonanceMemoryAR > 0 && (
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-(--text-secondary)">
                  Resonance Memory:
                </span>
                <span className="font-bold text-(--status-success)">
                  {resonanceMemoryAR.toLocaleString()} AR floor
                </span>
              </div>
            )}
            <p className="text-[10px] font-mono text-(--text-secondary)/80 leading-snug pt-1 border-t border-(--border-default)/40">
              Resets RP, generators & research · Keeps modules, synthesizers, AR
              perks, relics & achievements.
            </p>
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
            {canT1
              ? `Recalibrate Reality · Claim +${arGain} AR`
              : 'Reality Recalibration Locked'}
          </button>

          <div className="pt-2 border-t border-(--border-default)/60">
            <ARUpgradeShop />
          </div>
          <div className="pt-2 border-t border-(--border-default)/60">
            <AutomationPanel />
          </div>
        </div>
      )}

      {/* Tier II */}
      {subTab === 'tier2' && (
        <div className="flex flex-col gap-3.5">
          <div className="card rounded-xl p-3 sm:p-4 flex flex-col gap-2 border border-(--border-default) bg-(--bg-surface)">
            <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Tier II Prestige // Timeline Severance
            </p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">CF Balance:</span>
              <span className="font-black g-sp">
                {formatPoints(BigInt(Math.floor(chronalFractures)))} CF
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Chronos Array:</span>
              <span
                className={
                  hasChronosArray
                    ? 'font-bold text-(--status-success)'
                    : 'text-amber-400'
                }
              >
                {hasChronosArray ? '✓ Complete' : 'Build in Megaprojects'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Lifetime RP Goal:</span>
              <span
                className={
                  hasT2RP
                    ? 'font-bold text-(--status-success)'
                    : 'text-(--text-secondary)'
                }
              >
                {formatPoints(lifetimePoints)} /{' '}
                {formatPoints(PRESTIGE_TIER2_THRESHOLD)} RP
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected Gain:</span>
              <span
                className={`font-black ${canT2 ? 'g-sp' : 'text-(--text-secondary)/70'}`}
              >
                {cfGain > 0 ? `+${formatPoints(BigInt(cfGain))} CF` : 'Locked'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-(--text-secondary)/80 leading-snug pt-1 border-t border-(--border-default)/40">
              Resets Tier I run, synthesizers, AR balance, research & empties
              relic sockets · Keeps AR/CF perks, Resonance Memory, megaprojects
              & unlocked relics.
            </p>
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
            {canT2
              ? `Prestige Tier II · Claim +${cfGain} CF`
              : 'Tier II Prestige Locked'}
          </button>

          <div className="section-divider" />
          <ExpandedCFShop />
        </div>
      )}

      {/* Tier III */}
      {subTab === 'tier3' && (
        <div className="flex flex-col gap-3.5">
          <div className="card rounded-xl p-3 sm:p-4 flex flex-col gap-2 border border-(--border-default) bg-(--bg-surface)">
            <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
              Tier III Prestige // Singular Synthesis
            </p>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">OS Balance:</span>
              <span className="font-black g-tqgs">
                {formatPoints(BigInt(Math.floor(omniSpars)))} OS
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Omega Sphere:</span>
              <span
                className={
                  hasOmegaSphere
                    ? 'font-bold text-(--status-success)'
                    : 'text-amber-400'
                }
              >
                {hasOmegaSphere ? '✓ Complete' : 'Build in Megaprojects'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-(--text-secondary)">Lifetime RP Goal:</span>
              <span
                className={
                  hasT3RP
                    ? 'font-bold text-(--status-success)'
                    : 'text-(--text-secondary)'
                }
              >
                {formatPoints(lifetimePoints)} /{' '}
                {formatPoints(PRESTIGE_TIER3_THRESHOLD)} RP
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono pt-1.5 border-t border-(--border-default)/50">
              <span className="text-(--text-secondary)">Projected Gain:</span>
              <span
                className={`font-black ${canT3 ? 'g-tqgs' : 'text-(--text-secondary)/70'}`}
              >
                {osGain > 0 ? `+${formatPoints(BigInt(osGain))} OS` : 'Locked'}
              </span>
            </div>
            <p className="text-[10px] font-mono text-(--text-secondary)/80 leading-snug pt-1 border-t border-(--border-default)/40">
              Resets Tier I/II, CF balance, economic AR/CF perks & empties relic
              sockets · Keeps QoL automation, OS perks, Resonance Memory, relics
              & achievements.
            </p>
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
            {canT3
              ? `Prestige Tier III · Claim +${osGain} OS`
              : 'Tier III Prestige Locked'}
          </button>

          <div className="section-divider" />
          <OSUpgradeShop />
        </div>
      )}
    </div>
  )
}
