'use client'

import { useEffect, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ChallengeCard from '@/components/challenges/ChallengeCard'
import { CHALLENGE_DISPLAY } from '@/constants/challenges'
import type { ChallengeCategory } from '@/constants/challenges'
import { enterSandboxChallenge } from '@/app/stores/actions/challengeActions'
import { formatPoints } from '@/lib/format'
import type { ChallengeRestrictions } from '@/types/game'

type WorkspaceCategory = ChallengeCategory | 'sandbox'

const CATEGORY_TABS: { id: WorkspaceCategory; label: string }[] = [
  { id: 'standard', label: 'Standard (T1)' },
  { id: 'advanced', label: 'Advanced (T2)' },
  { id: 'extreme', label: 'Extreme (T3)' },
  { id: 'sandbox', label: 'Sandbox ⚙' }
]

function MutatorSandboxPanel() {
  const ec4Completed =
    useGameStore((s) => s.challengeRecords['EC4']?.completedTiers ?? 0) >= 1
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const sandboxBest = useGameStore((s) => s.sandboxBestRP ?? 0n)
  const sandboxWins = useGameStore((s) => s.sandboxCompletions ?? 0)

  const [maxGenTier3, setMaxGenTier3] = useState(false)
  const [techDisabled, setTechDisabled] = useState(false)
  const [relicsDisabled, setRelicsDisabled] = useState(false)
  const [timersFrozen, setTimersFrozen] = useState(false)
  const [anomaliesDisabled, setAnomaliesDisabled] = useState(false)
  const [targetExp, setTargetExp] = useState(40)

  if (!ec4Completed) {
    return (
      <div className="card rounded-xl p-8 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center font-mono text-xs text-(--text-secondary) flex flex-col gap-2">
        <span className="text-2xl select-none" aria-hidden="true">
          🔒
        </span>
        <p className="font-bold text-amber-300">Mutator Sandbox Offline</p>
        <p className="text-[11px] text-(--text-secondary)/80 max-w-sm mx-auto">
          Conquer Extreme Challenge 4 (The Final Observation) to unlock the
          Custom Constraint Mutator Sandbox.
        </p>
      </div>
    )
  }

  const targetRP = 10n ** BigInt(targetExp)
  const hasChronalDeadlock = timersFrozen && anomaliesDisabled && !techDisabled

  function handleStart() {
    if (hasChronalDeadlock) return
    const restrictions: ChallengeRestrictions = {
      maxGeneratorTier: maxGenTier3 ? 3 : null,
      maxGeneratorQuantity: null,
      techMatrixDisabled: techDisabled,
      modulesDisabled: false,
      anomaliesDisabled: anomaliesDisabled,
      excavationDisabled: false,
      generatorCostMultiplier: 1,
      researchTimerMultiplier: 1,
      milestonesDisabled: false,
      energyBranchLocked: false,
      arkalonBranchLocked: false,
      singleBranchOnly: false,
      singleResearchSlot: false,
      relicsDisabled: relicsDisabled,
      generatorProductionMultiplier: 1,
      moduleLevelCapOverride: null,
      onlyGeneratorType: null,
      autoPrestigeIntervalSeconds: null,
      anomalySpawnIntervalSeconds: null,
      anomalyDurationOverrideSeconds: null,
      noResearchTimerTick: timersFrozen,
      noBaseGeneratorOutput: false,
      productionOnlyWhileResearching: false,
      prestigeUpgradesDisabled: false
    }

    enterSandboxChallenge(restrictions, targetRP)
  }

  return (
    <div className="card rounded-xl p-4 bg-(--bg-surface) border border-cyan-400/40 flex flex-col gap-3 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-(--border-default)/50 pb-2">
        <span className="text-xs font-black uppercase text-cyan-300 tracking-wider">
          ⚙ Custom Simulation Sandbox
        </span>
        <span className="text-[10px] text-(--text-secondary)">
          {sandboxWins} Completions · Best: {formatPoints(sandboxBest)} RP
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="text-[10px] font-bold uppercase text-(--text-secondary)">
          Select Active Mutators:
        </span>
        <div className="@container grid grid-cols-1 @[380px]:grid-cols-2 gap-1.5">
          {[
            {
              label: 'Manual Labor (Max Gen Tier 3)',
              checked: maxGenTier3,
              toggle: () => setMaxGenTier3(!maxGenTier3)
            },
            {
              label: 'Blind Research (Tech Disabled)',
              checked: techDisabled,
              toggle: () => setTechDisabled(!techDisabled)
            },
            {
              label: 'Relic Vacuum (Relics Disabled)',
              checked: relicsDisabled,
              toggle: () => setRelicsDisabled(!relicsDisabled)
            },
            {
              label: 'Chronal Freeze (Timers Frozen)',
              checked: timersFrozen,
              toggle: () => setTimersFrozen(!timersFrozen)
            },
            {
              label: 'Stable Reality (No Anomalies)',
              checked: anomaliesDisabled,
              toggle: () => setAnomaliesDisabled(!anomaliesDisabled)
            }
          ].map((m) => (
            <button
              key={m.label}
              onClick={m.toggle}
              className={[
                'p-2 rounded-lg border text-left flex items-center justify-between gap-2 transition-all cursor-pointer',
                m.checked
                  ? 'border-amber-400 bg-amber-500/10 text-amber-300 font-bold'
                  : 'border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)'
              ].join(' ')}
            >
              <span className="text-[11px] leading-tight">{m.label}</span>
              <span className="shrink-0">{m.checked ? '✓' : '○'}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-1.5 pt-1 border-t border-(--border-default)/50">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase text-(--text-secondary)">
            Simulation Goal:
          </span>
          <span className="font-bold text-cyan-300">
            10^{targetExp} ({formatPoints(targetRP)} RP)
          </span>
        </div>
        <input
          type="range"
          min={20}
          max={150}
          step={5}
          value={targetExp}
          onChange={(e) => setTargetExp(Number(e.target.value))}
          className="w-full accent-cyan-400 cursor-pointer h-1.5"
        />
      </div>

      {hasChronalDeadlock && (
        <div className="p-2 rounded-lg border border-rose-500/50 bg-rose-500/10 text-[11px] text-rose-300 leading-snug">
          ⚠️ Incompatible mutators: <strong>Chronal Freeze</strong> requires
          anomalies unless <strong>Blind Research</strong> is enabled.
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={Boolean(activeChallengeId) || hasChronalDeadlock}
        className={[
          'w-full py-2.5 text-xs font-black uppercase tracking-wider rounded-lg border transition-all select-none cursor-pointer',
          !activeChallengeId && !hasChronalDeadlock
            ? 'border-cyan-400 bg-cyan-400 text-black hover:brightness-110 shadow-[0_0_12px_rgba(0,240,255,0.3)]'
            : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
        ].join(' ')}
      >
        {activeChallengeId
          ? 'Challenge in Progress'
          : hasChronalDeadlock
            ? 'Incompatible Mutator Combo'
            : 'Launch Custom Sandbox Run'}
      </button>
    </div>
  )
}

export default function ChallengeWorkspace() {
  const activeChallengeId = useGameStore((s) => s.activeChallengeId)
  const activeChallengeCategory = activeChallengeId
    ? (CHALLENGE_DISPLAY.find((c) => c.id === activeChallengeId)?.category ??
      'standard')
    : 'standard'

  const [activeCategory, setActiveCategory] = useState<WorkspaceCategory>(
    activeChallengeCategory
  )

  useEffect(() => {
    if (activeChallengeId) {
      const cat = CHALLENGE_DISPLAY.find(
        (c) => c.id === activeChallengeId
      )?.category
      if (cat) setActiveCategory(cat)
    }
  }, [activeChallengeId])

  const tier1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const tier2Done = useGameStore((s) => s.stats.totalPrestigesTier2 > 0)
  const tier3Done = useGameStore((s) => s.stats.totalPrestigesTier3 > 0)

  const challenges = CHALLENGE_DISPLAY.filter(
    (c) => c.category === activeCategory
  )

  const categoryUnlocked: Record<WorkspaceCategory, boolean> = {
    standard: tier1Done,
    advanced: tier2Done,
    extreme: tier3Done,
    sandbox: true
  }

  return (
    <div className="flex flex-col h-full overflow-hidden bg-(--bg-primary)/40">
      {/* Active challenge persistent alert bar */}
      {activeChallengeId && (
        <div className="flex items-center gap-2 px-3 py-2 bg-(--border-accent)/10 border-b border-(--border-accent) shrink-0 font-mono text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-(--border-accent)" />
          <span className="text-(--text-accent) truncate">
            Active Constraint:{' '}
            <strong className="text-white">
              {CHALLENGE_DISPLAY.find((c) => c.id === activeChallengeId)
                ?.name ?? activeChallengeId}
            </strong>
          </span>
        </div>
      )}

      {/* Category Selection Tabs */}
      <div
        className="grid grid-cols-4 gap-1 p-1 bg-(--bg-surface) border-b border-(--border-default) shrink-0"
        role="tablist"
      >
        {CATEGORY_TABS.map((tab) => {
          const unlocked = categoryUnlocked[tab.id]
          const isActive = activeCategory === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => setActiveCategory(tab.id)}
              className={[
                'py-1.5 px-1 text-[10px] sm:text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none text-center leading-tight',
                isActive
                  ? 'border-(--border-accent) bg-(--border-accent)/10 text-(--border-accent)'
                  : !unlocked
                    ? 'border-transparent text-(--text-secondary)/50 hover:text-(--text-secondary)'
                    : 'border-transparent text-(--text-secondary) hover:text-(--text-primary)'
              ].join(' ')}
            >
              {!unlocked && (
                <span className="mr-1 text-[0.6rem]" aria-hidden="true">
                  &#x1F512;
                </span>
              )}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Challenge List */}
      <div className="flex-1 overflow-y-auto scrollbar-dark p-2 sm:p-3 flex flex-col gap-2">
        {activeCategory !== 'sandbox' && (
          <p className="text-[10px] font-mono text-(--text-secondary)/80 leading-snug px-0.5">
            Challenges temporarily simulate a fresh run under constraints while
            your active run is paused. Permanent multipliers, unlocked relics
            (unless disabled), and modules (unless disabled) stay active; your
            main run restores automatically when you complete or exit.
          </p>
        )}
        {activeCategory === 'sandbox' ? (
          <MutatorSandboxPanel />
        ) : !categoryUnlocked[activeCategory as ChallengeCategory] ? (
          <div className="card rounded-xl p-8 border border-dashed border-(--border-default) bg-(--bg-surface)/40 text-center">
            <p className="text-xs font-mono text-(--text-secondary)">
              {activeCategory === 'advanced'
                ? 'Complete your first Timeline Severance to unlock Advanced Challenges.'
                : 'Complete your first Singular Synthesis to unlock Extreme Challenges.'}
            </p>
          </div>
        ) : (
          challenges.map((c) => <ChallengeCard key={c.id} challengeId={c.id} />)
        )}
      </div>
    </div>
  )
}
