import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  calculateOfflineProgress,
  applyOfflineProgress
} from '@/lib/offlineCalc'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
import {
  MAX_RP_HARD_CAP,
  DEFAULT_MAX_OFFLINE_SECONDS,
  CHRONOS_LOOM_OFFLINE_SECONDS,
  MAX_OFFLINE_SECONDS_HARD_CAP
} from '@/constants/game'
import type { OfflineProgressPayload } from '@/types/offline'
import type {
  ChallengeRestrictions,
  GameState,
  GeneratorState,
  ProbeState
} from '@/types/game'

const NO_RESTRICTIONS: ChallengeRestrictions = {
  maxGeneratorTier: null,
  maxGeneratorQuantity: null,
  techMatrixDisabled: false,
  modulesDisabled: false,
  anomaliesDisabled: false,
  excavationDisabled: false,
  generatorCostMultiplier: 1,
  researchTimerMultiplier: 1,
  milestonesDisabled: false,
  energyBranchLocked: false,
  arkalonBranchLocked: false,
  singleBranchOnly: false,
  singleResearchSlot: false,
  relicsDisabled: false,
  generatorProductionMultiplier: 1,
  moduleLevelCapOverride: null,
  onlyGeneratorType: null,
  autoPrestigeIntervalSeconds: null,
  anomalySpawnIntervalSeconds: null,
  anomalyDurationOverrideSeconds: null,
  noResearchTimerTick: false,
  noBaseGeneratorOutput: false,
  productionOnlyWhileResearching: false,
  prestigeUpgradesDisabled: false
}

function restrictions(
  overrides: Partial<ChallengeRestrictions> = {}
): ChallengeRestrictions {
  return { ...NO_RESTRICTIONS, ...overrides }
}

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

function probe(overrides: Partial<ProbeState> = {}): ProbeState {
  return {
    id: 1,
    status: 'idle',
    zone: null,
    timerRemaining: 0,
    repairTimerRemaining: 0,
    subsystem: 'none',
    veteranRank: 0,
    expeditionsCompleted: 0,
    ...overrides
  }
}

const NOW = 1_800_000_000_000

function run(
  state: GameState,
  seconds: number,
  efficiencyOverride?: number
): OfflineProgressPayload {
  return calculateOfflineProgress(
    state,
    NOW - seconds * 1000,
    NOW,
    efficiencyOverride
  )
}

describe('offlineCalc', () => {
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

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('caps credited offline time while preserving the true gap', () => {
    const base = stateWith()
    const plain = run(base, 100_000)
    expect(plain.actualElapsedSeconds).toBe(100_000)
    expect(plain.elapsedSeconds).toBe(DEFAULT_MAX_OFFLINE_SECONDS)
    expect(plain.maxOfflineWindowSeconds).toBe(28_800)

    const loom = run(
      stateWith({ operationArtifactsUnlocked: ['chronos_loom'] }),
      100_000
    )
    expect(loom.elapsedSeconds).toBe(CHRONOS_LOOM_OFFLINE_SECONDS)
    expect(loom.maxOfflineWindowSeconds).toBe(43_200)

    const r9 = run(stateWith({ completedResearchNodes: ['R9'] }), 100_000)
    expect(r9.elapsedSeconds).toBe(MAX_OFFLINE_SECONDS_HARD_CAP)
    expect(r9.maxOfflineWindowSeconds).toBe(86_400)

    const r9Disabled = run(
      stateWith({
        completedResearchNodes: ['R9'],
        operationArtifactsUnlocked: ['chronos_loom'],
        activeChallengeRestrictions: restrictions({ techMatrixDisabled: true })
      }),
      100_000
    )
    expect(r9Disabled.maxOfflineWindowSeconds).toBe(43_200)

    const r9DisabledNoLoom = run(
      stateWith({
        completedResearchNodes: ['R9'],
        activeChallengeRestrictions: restrictions({ techMatrixDisabled: true })
      }),
      100_000
    )
    expect(r9DisabledNoLoom.maxOfflineWindowSeconds).toBe(28_800)

    const short = run(base, 60)
    expect(short.elapsedSeconds).toBe(60)
    expect(short.actualElapsedSeconds).toBe(60)
  })

  it('computes offline efficiency from research, SC9, relics and megaprojects', () => {
    expect(run(stateWith(), 60).efficiencyApplied).toBeCloseTo(0.5, 6)
    expect(
      run(stateWith({ completedResearchNodes: ['E1'] }), 60).efficiencyApplied
    ).toBeCloseTo(0.65, 6)
    expect(
      run(stateWith({ completedResearchNodes: ['E1', 'E2'] }), 60)
        .efficiencyApplied
    ).toBeCloseTo(0.85, 6)
    expect(
      run(
        stateWith({
          completedResearchNodes: ['E1', 'E2'],
          challengeRecords: { SC9: { completedTiers: 2, bestRP: 0n } }
        }),
        60
      ).efficiencyApplied
    ).toBe(1)

    const anchored = stateWith({
      unlockedRelics: [5],
      relicLevels: { 5: 10 },
      relicSlots: [{ relicId: 5 }, { relicId: null }, { relicId: null }]
    })
    expect(run(anchored, 60).efficiencyApplied).toBeCloseTo(0.6, 6)
    expect(
      run(
        {
          ...anchored,
          activeChallengeRestrictions: restrictions({ relicsDisabled: true })
        },
        60
      ).efficiencyApplied
    ).toBeCloseTo(0.5, 6)

    expect(
      run(
        stateWith({ completedMegaprojects: ['omega_singularity_sphere'] }),
        60
      ).efficiencyApplied
    ).toBeCloseTo(0.65, 6)

    expect(
      run(
        stateWith({
          completedResearchNodes: ['E1', 'E2'],
          activeChallengeRestrictions: restrictions({
            techMatrixDisabled: true
          })
        }),
        60
      ).efficiencyApplied
    ).toBeCloseTo(0.5, 6)

    expect(run(stateWith(), 60, 0.25).efficiencyApplied).toBe(0.25)
    expect(run(stateWith(), 60, 1).efficiencyApplied).toBe(1)
  })

  it('steps across anomaly expiration and counts resolved anomalies', () => {
    const state = withGens(
      stateWith({
        activeAnomalyType: 'quantum_surge',
        anomalyTimeRemaining: 60,
        timeToNextAnomalyCheck: 180
      }),
      { 0: { quantity: 1n } }
    )
    const payload = run(state, 120, 1)
    expect(payload.rpEarned).toBe(300n)
    expect(payload.anomaliesResolvedCount).toBe(1)
    expect(payload.cachedFinalAnomalyState?.activeAnomalyType).toBeNull()
    expect(payload.cachedFinalAnomalyState?.anomalyTimeRemaining).toBe(0)

    const patch = applyOfflineProgress(state, payload)
    expect(patch.stats?.totalAnomaliesResolved).toBe(1)
    expect(patch.activeAnomalyType).toBeNull()
    expect(patch.researchPoints).toBe(35n + 300n)

    const noAnomaly = run(
      withGens(stateWith(), { 0: { quantity: 1n } }),
      120,
      1
    )
    expect(noAnomaly.rpEarned).toBe(120n)
    expect(noAnomaly.anomaliesResolvedCount).toBe(0)
  })

  it('completes research mid-window, unlocks its bonus and auto-pulls the queue', () => {
    const state = withGens(
      stateWith({
        unlocks: { ...makeInitialState().unlocks, techMatrix: true },
        researchPoints: 10n ** 95n,
        completedResearchNodes: ['R1', 'R2', 'R3', 'R4'],
        activeResearchSlots: [
          { nodeId: 'R5', timerRemaining: 5 },
          { nodeId: null, timerRemaining: 0 }
        ],
        researchQueue: ['R6'],
        arUpgrades: {
          ...makeInitialState().arUpgrades,
          auto_research_queue: 1
        },
        automation: {
          ...makeInitialState().automation,
          autoResearchQueue: true
        }
      }),
      { 5: { quantity: 1n } }
    )

    const payload = run(state, 120, 1)
    expect(payload.researchCompletedNames).toEqual(['Dimensional Permeability'])
    expect(payload.cachedResearchResult?.completedResearchNodes).toContain('R5')
    expect(payload.cachedResearchResult?.newlyCompletedCount).toBe(1)
    expect(payload.cachedResearchResult?.researchQueue).toEqual([])
    expect(payload.cachedResearchResult?.activeResearchSlots[0].nodeId).toBe(
      'R6'
    )
    expect(payload.rpEarned).toBe(21_697_500n)

    const patch = applyOfflineProgress(state, payload)
    expect(patch.completedResearchNodes).toContain('R5')
    expect(patch.researchQueue).toEqual([])
    expect(patch.stats?.relic4PityCount).toBe(1)

    const manualQueue = run(
      {
        ...state,
        automation: { ...state.automation, autoResearchQueue: false }
      },
      120,
      1
    )
    expect(manualQueue.cachedResearchResult?.researchQueue).toEqual(['R6'])
    expect(
      manualQueue.cachedResearchResult?.activeResearchSlots[0].nodeId
    ).toBeNull()
  })

  it('freezes AC3 research timers unless an anomaly accelerates them 5x', () => {
    const frozen = withGens(
      stateWith({
        unlocks: { ...makeInitialState().unlocks, techMatrix: true },
        activeResearchSlots: [{ nodeId: 'C1', timerRemaining: 5 }],
        activeChallengeRestrictions: restrictions({ noResearchTimerTick: true })
      }),
      { 0: { quantity: 1n } }
    )
    const paused = run(frozen, 120, 1)
    expect(
      paused.cachedResearchResult?.activeResearchSlots[0].timerRemaining
    ).toBe(5)
    expect(paused.cachedResearchResult?.completedResearchNodes).toEqual([])
    expect(paused.researchCompletedNames).toEqual([])

    const surged = run(
      {
        ...frozen,
        activeAnomalyType: 'quantum_surge',
        anomalyTimeRemaining: 60
      },
      120,
      1
    )
    expect(surged.cachedResearchResult?.completedResearchNodes).toContain('C1')
    expect(surged.researchCompletedNames).toEqual(['Asymptotic Compaction'])

    const chronoFreeze = run(
      {
        ...frozen,
        activeResearchSlots: [{ nodeId: 'C2', timerRemaining: 60 }],
        completedResearchNodes: ['C1'],
        activeAnomalyType: 'operation_chrono_freeze',
        anomalyTimeRemaining: 10
      },
      120,
      1
    )
    expect(chronoFreeze.cachedResearchResult?.completedResearchNodes).toContain(
      'C2'
    )
    expect(
      chronoFreeze.cachedResearchResult?.activeResearchSlots[0].nodeId
    ).toBeNull()
  })

  it('siphons megaproject allocation, applies phase absorption and completes structures', () => {
    const base = withGens(
      stateWith({
        activeMegaprojectId: 'chronos_array',
        megaprojectAllocationPercent: 50
      }),
      { 5: { quantity: 1n } }
    )

    const partial = run(base, 120, 1)
    expect(partial.rpEarned).toBe(900_000n)
    expect(partial.megaprojectRPEarned).toBe(900_000n)
    expect(partial.megaprojectRPSiphoned).toBe(900_000n)
    expect(partial.cachedMegaprojectRPAbsorbed).toBe(900_000n)
    expect(partial.megaprojectCompletedId).toBeNull()

    const completing = run(
      { ...base, megaprojectRPAbsorbed: 5n * 10n ** 25n - 1_000n },
      120,
      1
    )
    expect(completing.megaprojectCompletedId).toBe('chronos_array')
    expect(completing.megaprojectRPEarned).toBe(1_000n)
    expect(completing.rpEarned).toBe(1_799_167n)
    expect(completing.cachedMegaprojectRPAbsorbed).toBe(0n)

    const completePatch = applyOfflineProgress(base, completing)
    expect(completePatch.completedMegaprojects).toContain('chronos_array')
    expect(completePatch.activeMegaprojectId).toBeNull()
    expect(completePatch.megaprojectAllocationPercent).toBe(0)
    expect(completePatch.megaprojectRPAbsorbed).toBe(0n)

    const phase3 = run(
      { ...base, megaprojectRPAbsorbed: 4n * 10n ** 25n },
      120,
      1
    )
    expect(phase3.megaprojectRPEarned).toBe(1_080_000n)
    expect(phase3.megaprojectRPSiphoned).toBe(900_000n)
    expect(phase3.megaprojectCompletedId).toBeNull()

    const dyson = run(
      withGens(
        stateWith({
          activeMegaprojectId: 'dyson_swarm',
          megaprojectAllocationPercent: 50,
          megaprojectRPAbsorbed: 10n ** 85n - 500n,
          completedMegaprojects: ['omega_singularity_sphere']
        }),
        { 5: { quantity: 1n } }
      ),
      120,
      1
    )
    expect(dyson.cachedDysonSwarmLevel).toBe(1)
    expect(dyson.megaprojectCompletedId).toBeNull()
    expect(dyson.megaprojectRPEarned).toBe(500n)
    expect(dyson.cachedMegaprojectRPAbsorbed).toBe(0n)

    const dysonPatch = applyOfflineProgress(base, dyson)
    expect(dysonPatch.dysonSwarmLevel).toBe(1)
  })

  it('simulates probe scans, repairs and auto-launch loops', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    const scanning = stateWith({
      probes: [
        probe({
          status: 'scanning',
          zone: 'safe',
          timerRemaining: 600,
          scanDuration: 3600
        })
      ]
    })
    const scanPayload = run(scanning, 1200, 1)
    expect(scanPayload.probesCompletedCount).toBe(1)
    expect(scanPayload.dustEarned).toBe(23)
    const scanned = scanPayload.cachedProbeResult?.probes[0]
    expect(scanned?.status).toBe('idle')
    expect(scanned?.zone).toBeNull()
    expect(scanned?.expeditionsCompleted).toBe(1)
    expect(scanned?.veteranRank).toBe(1)

    const unfinished = run(
      stateWith({
        probes: [
          probe({ status: 'scanning', zone: 'safe', timerRemaining: 5000 })
        ]
      }),
      1200,
      1
    )
    expect(unfinished.probesCompletedCount).toBe(0)
    expect(unfinished.cachedProbeResult?.probes[0].timerRemaining).toBe(3800)

    const repairing = run(
      stateWith({
        probes: [
          probe({ status: 'repairing', repairTimerRemaining: 300, zone: null })
        ]
      }),
      1200,
      1
    )
    expect(repairing.cachedProbeResult?.probes[0].status).toBe('idle')
    expect(repairing.cachedProbeResult?.probes[0].repairTimerRemaining).toBe(0)

    const autoLoop = stateWith({
      unlocks: { ...makeInitialState().unlocks, excavation: true },
      challengeRecords: { SC12: { completedTiers: 3, bestRP: 0n } },
      automation: { ...makeInitialState().automation, autoLaunchProbe: true },
      probes: [probe()]
    })
    const loopPayload = run(autoLoop, 7200, 1)
    expect(loopPayload.probesCompletedCount).toBe(2)
    expect(loopPayload.dustEarned).toBe(48)
    expect(loopPayload.cachedProbeResult?.probes[0].expeditionsCompleted).toBe(
      2
    )

    const noAuto = run(
      {
        ...autoLoop,
        automation: { ...autoLoop.automation, autoLaunchProbe: false }
      },
      7200,
      1
    )
    expect(noAuto.probesCompletedCount).toBe(0)
    expect(noAuto.cachedProbeResult?.probes[0].status).toBe('idle')

    const blocked = run(
      {
        ...autoLoop,
        activeChallengeRestrictions: restrictions({ excavationDisabled: true })
      },
      7200,
      1
    )
    expect(blocked.probesCompletedCount).toBe(0)
    expect(blocked.dustEarned).toBe(0)
  })

  it('triggers EC3 recursive collapse offline and preserves permanent assets', () => {
    const state = withGens(
      stateWith({
        activeChallengeId: 'EC3',
        activeChallengeRestrictions: restrictions({
          autoPrestigeIntervalSeconds: 300
        }),
        researchPoints: 1_000n,
        synthesizers: [1, 0, 0, 0],
        artifactDust: 50,
        unlockedRelics: [1],
        relicLevels: { 1: 5 },
        stats: { ...makeInitialState().stats, currentRunSeconds: 100 }
      }),
      { 0: { quantity: 1n } }
    )

    const payload = run(state, 1000, 1)
    expect(payload.ec3CollapseTriggered).toBe(true)
    expect(payload.ec3CollapseCount).toBe(3)
    expect(payload.ec3PostCollapseRunSeconds).toBe(200)
    expect(payload.ec3FinalPrestigeTimeMs).toBe(NOW - 200_000)
    expect(payload.rpEarned).toBe(200n)

    const patch = applyOfflineProgress(state, payload)
    expect(patch.researchPoints).toBe(35n)
    expect(patch.lifetimePoints).toBe(35n)
    expect(patch.generators?.every((g) => g.quantity === 0n)).toBe(true)
    expect(patch.synthesizers).toEqual([1, 0, 0, 0])
    expect(patch.artifactDust).toBe(58)
    expect(patch.unlockedRelics).toEqual([1])
    expect(patch.relicLevels).toEqual({ 1: 5 })
    expect(patch.activeChallengeId).toBe('EC3')
    expect(patch.activeChallengeRestrictions).toBe(
      state.activeChallengeRestrictions
    )
    expect(patch.challengeActiveSeconds).toBe(1000)
    expect(patch.stats?.currentRunSeconds).toBe(200)
    expect(patch.stats?.lastPrestigeTime).toBe(NOW - 200_000)

    const targetMet = run(
      {
        ...state,
        synthesizers: [0, 0, 0, 0],
        lifetimePoints: 10n ** 140n
      },
      1000,
      1
    )
    expect(targetMet.ec3CollapseTriggered).toBe(false)
  })

  it('clamps applyOfflineProgress to the hard cap and awards deterministic relics', () => {
    const state = stateWith({
      lifetimePoints: 10n ** 1000n,
      stats: {
        ...makeInitialState().stats,
        relic4PityCount: 24,
        totalAnomaliesResolved: 9
      }
    })

    const payload: OfflineProgressPayload = {
      elapsedSeconds: 60,
      actualElapsedSeconds: 60,
      rpEarned: 10n ** 1001n,
      efficiencyApplied: 1,
      maxOfflineWindowSeconds: 28_800,
      anomaliesResolvedCount: 1,
      cachedResearchResult: {
        completedResearchNodes: [
          'C1',
          'C2',
          'C3',
          'C4',
          'C5',
          'C6',
          'C7',
          'C8',
          'C9',
          'C10',
          'O8'
        ],
        activeResearchSlots: [{ nodeId: null, timerRemaining: 0 }],
        researchQueue: [],
        researchPointsAfterSpend: 10n ** 1001n,
        newlyCompletedCount: 1
      }
    }

    const patch = applyOfflineProgress(state, payload)
    expect(patch.researchPoints).toBe(MAX_RP_HARD_CAP)
    expect(patch.lifetimePoints).toBe(MAX_RP_HARD_CAP)
    expect(patch.stats?.allTimePoints).toBe(MAX_RP_HARD_CAP)
    expect(patch.stats?.peakLifetimePoints).toBe(MAX_RP_HARD_CAP)
    expect(patch.unlockedRelics).toEqual(
      expect.arrayContaining([2, 4, 6, 14, 16])
    )
    expect(patch.relicLevels?.[2]).toBeGreaterThanOrEqual(1)
    expect(patch.relicLevels?.[4]).toBeGreaterThanOrEqual(1)
    expect(patch.relicLevels?.[6]).toBeGreaterThanOrEqual(1)
    expect(patch.relicLevels?.[14]).toBeGreaterThanOrEqual(1)
    expect(patch.relicLevels?.[16]).toBeGreaterThanOrEqual(1)
    expect(patch.stats?.totalAnomaliesResolved).toBe(10)
    expect(patch.stats?.relic4PityCount).toBe(25)

    const challengeState = stateWith({ activeChallengeId: 'SC1' })
    const challengePatch = applyOfflineProgress(challengeState, {
      ...payload,
      rpEarned: 100n,
      cachedResearchResult: {
        completedResearchNodes: [],
        activeResearchSlots: [{ nodeId: null, timerRemaining: 0 }],
        researchQueue: [],
        researchPointsAfterSpend: 135n,
        newlyCompletedCount: 0
      }
    })
    expect(challengePatch.challengeActiveSeconds).toBe(60)
    expect(challengePatch.researchPoints).toBe(135n)
  })
})
