import { describe, it, expect, beforeEach } from 'vitest'
import {
  formatPoints,
  formatPointsCompact,
  setNotationMode,
  bigIntLog10,
  infNodeCostAtLevel,
  formatDuration,
  formatCountdown,
  formatRate,
  formatTimeToAfford,
  getNetSpendablePPS,
  getAmountColor
} from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'
import { getFeatureProgress, type ProgressState } from '@/lib/featureProgress'
import { getWorkspaceActionSignals } from '@/lib/actionableSignals'
import { TIER_THRESHOLDS } from '@/constants/tiers'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import type { FeatureKey } from '@/lib/featureRegistry'
import type { GameState, GeneratorState, ProbeState } from '@/types/game'

function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...makeInitialState(), ...overrides }
}

function withGens(
  base: GameState,
  patches: Record<number, Partial<GeneratorState>>
): GameState {
  return {
    ...base,
    generators: base.generators.map((g, i) =>
      patches[i] ? { ...g, ...patches[i] } : g
    )
  }
}

function progressState(overrides: Partial<ProgressState> = {}): ProgressState {
  const base = makeInitialState()
  return {
    lifetimePoints: base.lifetimePoints,
    generators: base.generators,
    completedResearchNodes: base.completedResearchNodes,
    achievementsCount: 0,
    stats: base.stats,
    ...overrides
  }
}

function idleProbe(): ProbeState {
  return {
    id: 1,
    status: 'idle',
    zone: null,
    timerRemaining: 0,
    repairTimerRemaining: 0,
    subsystem: 'none',
    veteranRank: 0,
    expeditionsCompleted: 0
  }
}

function allUnlocks(): GameState['unlocks'] {
  const unlocks = { ...makeInitialState().unlocks }
  for (const key of Object.keys(unlocks) as FeatureKey[]) unlocks[key] = true
  return unlocks
}

describe('format and utils', () => {
  beforeEach(() => {
    useGameStore.setState(makeInitialState())
    useUIStore.setState({
      alertQueue: [],
      activeAlert: null,
      terminalLines: [],
      offlineModalOpen: false,
      offlinePayload: null
    })
    setNotationMode('suffix')
  })

  it('formats points in suffix and scientific notation', () => {
    expect(formatPoints(0n)).toBe('0')
    expect(formatPoints(999n)).toBe('999')
    expect(formatPoints(-5n)).toBe('0')
    expect(formatPoints(1_500n)).toBe('1.50K')
    expect(formatPoints(1_500_000n)).toBe('1.50 Million')
    expect(formatPoints(10n ** 162n)).toBe('1.00 Trequinquagintillion')
    expect(formatPoints(10n ** 168n)).toBe('1.00e168')

    setNotationMode('scientific')
    expect(formatPoints(1_500_000n)).toBe('1.50e6')
    expect(formatPoints(999n)).toBe('999')
    expect(formatPoints(10n ** 162n)).toBe('1.00e162')
  })

  it('rounds compact labels and switches symbols by magnitude', () => {
    expect(formatPointsCompact(0n)).toBe('0')
    expect(formatPointsCompact(999n)).toBe('999')
    expect(formatPointsCompact(1_500n)).toBe('1.5K')
    expect(formatPointsCompact(1_990_000n)).toBe('1.9M')
    expect(formatPointsCompact(1_500_000n)).toBe('1.5M')
    expect(formatPointsCompact(1_000_000_000n)).toBe('1B')
    expect(formatPointsCompact(10n ** 12n)).toBe('1T')
    expect(formatPointsCompact(10n ** 162n)).toBe('1Tqgs')
    expect(formatPointsCompact(150_000n)).toBe('150K')
    expect(formatPointsCompact(123n * 10n ** 153n)).toBe('123Qg')
    expect(formatPointsCompact(-1_500n)).toBe('-1.5K')
    expect(formatPointsCompact(10n ** 168n)).toBe('1.00e168')

    setNotationMode('scientific')
    expect(formatPointsCompact(1_500_000n)).toBe('1.50e6')
  })

  it('computes bigIntLog10 accurately across huge magnitudes', () => {
    expect(bigIntLog10(0n)).toBe(0)
    expect(bigIntLog10(-10n)).toBe(0)
    expect(bigIntLog10(1n)).toBeCloseTo(0, 6)
    expect(bigIntLog10(1_000n)).toBeCloseTo(3, 6)
    expect(Math.abs(bigIntLog10(10n ** 162n) - 162)).toBeLessThan(0.001)
    expect(Math.abs(bigIntLog10(10n ** 500n) - 500)).toBeLessThan(0.001)
    expect(Math.abs(bigIntLog10(10n ** 1000n) - 1000)).toBeLessThan(0.001)
  })

  it('keeps infNodeCostAtLevel exact below 1000 and monotonic above it', () => {
    const base = 10n ** 20n
    expect(infNodeCostAtLevel(base, 1.5, 0)).toBe(base)
    expect(infNodeCostAtLevel(base, 1.5, 1)).toBe(15n * 10n ** 19n)
    expect(infNodeCostAtLevel(base, 1.5, 3)).toBe(
      (base * 1500n ** 3n) / 1000n ** 3n
    )

    const exact1000 = infNodeCostAtLevel(base, 1.5, 1000)
    expect(exact1000).toBe((base * 1500n ** 1000n) / 1000n ** 1000n)

    const log1001 = infNodeCostAtLevel(base, 1.5, 1001)
    const log1200 = infNodeCostAtLevel(base, 1.5, 1200)
    expect(log1001).toBeGreaterThan(exact1000)
    expect(log1200).toBeGreaterThan(log1001)
    expect(Number(log1001) / Number(exact1000)).toBeCloseTo(1.5, 2)
    expect(Number.isFinite(Number(log1200))).toBe(true)

    const levels = [0, 1, 2, 10, 100, 1000, 1001, 1200]
    const costs = levels.map((l) => infNodeCostAtLevel(base, 1.5, l))
    for (let i = 1; i < costs.length; i++) {
      expect(costs[i]).toBeGreaterThan(costs[i - 1])
    }
  })

  it('formats durations, countdowns, rates and affordability windows', () => {
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(45.2)).toBe('46s')
    expect(formatDuration(60)).toBe('1m')
    expect(formatDuration(90)).toBe('1m 30s')
    expect(formatDuration(3600)).toBe('1h')
    expect(formatDuration(5400)).toBe('1h 30m')
    expect(formatDuration(86400)).toBe('1d')
    expect(formatDuration(90000)).toBe('1d 1h')
    expect(formatDuration(-1)).toBe('--')
    expect(formatDuration(Infinity)).toBe('--')

    expect(formatCountdown(0)).toBe('00:00')
    expect(formatCountdown(65)).toBe('01:05')
    expect(formatCountdown(3661)).toBe('1:01:01')
    expect(formatCountdown(-5)).toBe('00:00')

    expect(formatRate(1_500n)).toBe('1.50K/sec')

    expect(getNetSpendablePPS(100n, null, 50)).toBe(100n)
    expect(getNetSpendablePPS(100n, 'chronos_array', 0)).toBe(100n)
    expect(getNetSpendablePPS(100n, 'chronos_array', 25)).toBe(75n)
    expect(getNetSpendablePPS(100n, 'chronos_array', 150)).toBe(0n)
    expect(getNetSpendablePPS(0n, 'chronos_array', 50)).toBe(0n)

    expect(formatTimeToAfford(100n, 200n, 10n)).toBe('')
    expect(formatTimeToAfford(100n, 0n, 0n)).toBe('--')
    expect(formatTimeToAfford(100n, 0n, 10n)).toBe('10s')
    expect(formatTimeToAfford(110n, 0n, 10n)).toBe('11s')
  })

  it('maps amount colors and era thresholds', () => {
    expect(TIER_THRESHOLDS).toHaveLength(60)
    for (let i = 1; i < TIER_THRESHOLDS.length; i++) {
      expect(TIER_THRESHOLDS[i].min).toBeLessThan(TIER_THRESHOLDS[i - 1].min)
    }
    expect(getAmountColor(999n)).toBe('')
    expect(getAmountColor(1_000n)).toBe('g-k1')
    expect(getAmountColor(10n ** 12n)).toBe('g-t')
    expect(getAmountColor(10n ** 162n)).toBe('g-tqgs')
    expect(getAmountColor(10n ** 168n)).toBe('g-tqgs')

    expect(getCurrentEra(0n).era).toBe(1)
    expect(getCurrentEra(0n).name).toBe('Foundational Research')
    expect(getCurrentEra(10n ** 9n).era).toBe(2)
    expect(getCurrentEra(10n ** 18n).era).toBe(3)
    expect(getCurrentEra(10n ** 35n).era).toBe(4)
    expect(getCurrentEra(10n ** 60n).era).toBe(5)
    expect(getCurrentEra(10n ** 85n).era).toBe(6)
    expect(getCurrentEra(10n ** 140n).era).toBe(7)
    expect(getCurrentEra(10n ** 140n - 1n).era).toBe(6)
  })

  it('reports unlock progress labels and fractions per feature', () => {
    const desks = progressState({
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 5n } : g
      )
    })
    expect(getFeatureProgress('techMatrix', desks)).toEqual({
      label: '5/10 Desks',
      fraction: 0.5
    })

    expect(
      getFeatureProgress(
        'statistics',
        progressState({ lifetimePoints: 2_500n })
      )
    ).toEqual({
      label: '2.5K/5K RP',
      fraction: 0.5
    })

    const clusters = progressState({
      generators: makeInitialState().generators.map((g, i) =>
        i === 1 ? { ...g, quantity: 5n } : g
      )
    })
    expect(getFeatureProgress('modules', clusters)?.label).toBe(
      '5/10 Server Clusters'
    )
    expect(getFeatureProgress('modules', clusters)?.fraction).toBe(0.5)

    expect(
      getFeatureProgress(
        'anomalies',
        progressState({ completedResearchNodes: ['C1', 'C2', 'C_INF'] })
      )
    ).toEqual({ label: '2/2 Research Nodes', fraction: 1 })

    const played = progressState({
      stats: { ...makeInitialState().stats, totalSessionPlaytime: 120 }
    })
    expect(getFeatureProgress('achievements', played)).toEqual({
      label: '2/5 min played',
      fraction: 0.4
    })
    expect(
      getFeatureProgress('achievements', { ...played, achievementsCount: 3 })
    ).toEqual({ label: '3/3 Achievements', fraction: 1 })

    expect(getFeatureProgress('relics', progressState())?.label).toBe(
      '0/1 Anomaly'
    )
    expect(
      getFeatureProgress(
        'relics',
        progressState({ completedResearchNodes: ['O1'] })
      )
    ).toEqual({ label: 'Node O1 Complete', fraction: 1 })

    const excavation = progressState({
      generators: makeInitialState().generators.map((g, i) =>
        i === 1 ? { ...g, quantity: 25n } : i === 2 ? { ...g, quantity: 5n } : g
      )
    })
    expect(getFeatureProgress('excavation', excavation)).toEqual({
      label: '25/25 Clusters · 5/10 Quantum',
      fraction: 0.5
    })

    expect(
      getFeatureProgress('prestige', progressState({ lifetimePoints: 50_000n }))
    ).toEqual({
      label: 'Requires 1B RP',
      fraction: 0
    })
    expect(
      getFeatureProgress(
        'prestige',
        progressState({ lifetimePoints: 500_000_000n })
      )
    ).toEqual({ label: '500M/1B RP', fraction: 0.5 })

    expect(
      getFeatureProgress(
        'megaprojects',
        progressState({ lifetimePoints: 10n ** 8n })
      )?.label
    ).toBe('Requires 1T RP · 0/10 Engines')
    const megaReady = progressState({
      lifetimePoints: 5n * 10n ** 11n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 4 ? { ...g, quantity: 10n } : g
      )
    })
    expect(getFeatureProgress('megaprojects', megaReady)).toEqual({
      label: '500B/1T RP · 10/10 Engines',
      fraction: 0.5
    })

    expect(getFeatureProgress('challenges', progressState())).toEqual({
      label: '0/1 Recalibration',
      fraction: 0
    })
    expect(
      getFeatureProgress(
        'anomalousOperations',
        progressState({
          stats: { ...makeInitialState().stats, totalPrestigesTier1: 1 }
        })
      )
    ).toEqual({ label: '1/1 Recalibration', fraction: 1 })

    expect(getFeatureProgress('nope' as FeatureKey, progressState())).toBeNull()
  })

  it('emits workspace action signals when systems are unlocked and ready', () => {
    const ready = withGens(
      stateWith({
        unlocks: allUnlocks(),
        researchPoints: 10n ** 90n,
        lifetimePoints: 10n ** 85n,
        completedMegaprojects: ['chronos_array', 'omega_singularity_sphere'],
        unlockedRelics: [1],
        relicLevels: { 1: 5 },
        probes: [idleProbe()],
        currentOperationPoints: 500
      }),
      { 1: { quantity: 25n }, 2: { quantity: 100n }, 4: { quantity: 50n } }
    )
    const signals = getWorkspaceActionSignals(ready)
    expect(signals.research).toBe('Study Ready')
    expect(signals.relics).toBe('Relic Ready')
    expect(signals.excavation).toBe('Probe Ready')
    expect(signals.prestige).toBe('Synth Ready')
    expect(signals.megaprojects).toBe('Build Ready')
    expect(signals.operations).toBe('Artifact Ready')

    const tier1 = stateWith({
      unlocks: allUnlocks(),
      lifetimePoints: 10n ** 9n
    })
    expect(getWorkspaceActionSignals(tier1).prestige).toBe('Recalibrate')

    const tier2 = stateWith({
      unlocks: allUnlocks(),
      lifetimePoints: 10n ** 35n,
      completedMegaprojects: ['chronos_array']
    })
    expect(getWorkspaceActionSignals(tier2).prestige).toBe('Sever Ready')

    const firstProbe = withGens(
      stateWith({ unlocks: allUnlocks(), researchPoints: 1_000_000n }),
      { 1: { quantity: 25n }, 2: { quantity: 10n } }
    )
    expect(getWorkspaceActionSignals(firstProbe).excavation).toBe('Probe Ready')
  })

  it('suppresses action signals behind locks, challenges and busy state', () => {
    expect(getWorkspaceActionSignals(stateWith())).toEqual({})

    const base = withGens(
      stateWith({
        unlocks: allUnlocks(),
        researchPoints: 10n ** 90n,
        lifetimePoints: 10n ** 85n,
        completedMegaprojects: ['chronos_array', 'omega_singularity_sphere'],
        unlockedRelics: [1],
        relicLevels: { 1: 5 },
        probes: [idleProbe()],
        currentOperationPoints: 500
      }),
      { 1: { quantity: 25n }, 2: { quantity: 100n }, 4: { quantity: 50n } }
    )

    const techOff = getWorkspaceActionSignals({
      ...base,
      activeChallengeRestrictions: {
        ...base.activeChallengeRestrictions!,
        techMatrixDisabled: true
      } as GameState['activeChallengeRestrictions']
    })
    expect(techOff.research).toBeUndefined()

    const busySlot = getWorkspaceActionSignals({
      ...base,
      activeResearchSlots: [{ nodeId: 'C1', timerRemaining: 10 }]
    })
    expect(busySlot.research).toBeUndefined()

    const equipped = getWorkspaceActionSignals({
      ...base,
      relicSlots: [{ relicId: 1 }, { relicId: null }, { relicId: null }]
    })
    expect(equipped.relics).toBeUndefined()

    const scanning = getWorkspaceActionSignals({
      ...base,
      researchPoints: 0n,
      probes: [
        {
          ...idleProbe(),
          status: 'scanning',
          zone: 'safe',
          timerRemaining: 100
        }
      ]
    })
    expect(scanning.excavation).toBeUndefined()

    const inChallenge = getWorkspaceActionSignals({
      ...base,
      activeChallengeId: 'SC1'
    })
    expect(inChallenge.prestige).toBeUndefined()
    expect(inChallenge.megaprojects).toBeUndefined()

    const building = getWorkspaceActionSignals({
      ...base,
      activeMegaprojectId: 'dyson_swarm'
    })
    expect(building.megaprojects).toBeUndefined()

    const broke = getWorkspaceActionSignals({
      ...base,
      currentOperationPoints: 0
    })
    expect(broke.operations).toBeUndefined()
  })
})
