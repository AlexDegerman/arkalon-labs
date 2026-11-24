import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  buyGenerator,
  buyMaxAllGenerators,
  buyModule
} from '@/app/stores/actions/generatorActions'
import { buySynthesizer } from '@/app/stores/actions/synthesizerActions'
import {
  enterChallenge,
  exitChallenge,
  enterSandboxChallenge,
  checkChallengeCompletion
} from '@/app/stores/actions/challengeActions'
import {
  startResearch,
  overclockResearch,
  handleResearchCompletions
} from '@/app/stores/actions/researchActions'
import {
  triggerTierI,
  triggerTierII,
  triggerTierIII
} from '@/app/stores/actions/prestigeActions'
import { tick, resetTickSession } from '@/app/stores/actions/tickActions'
import {
  checkUnlocks,
  checkAchievements,
  resetUnlockSessionCaches
} from '@/lib/unlockWatcher'
import { resetDirtyFlags, consumeUnlocksDirty } from '@/lib/dirtyFlags'
import { nextCost } from '@/lib/generatorCosts'
import { setNotationMode } from '@/lib/format'
import type { ChallengeRestrictions, GameState } from '@/types/game'

vi.mock('@/hooks/useSound', () => ({
  playSound: vi.fn(),
  useSound: () => ({ play: vi.fn() }),
  SOUND_MAP: {}
}))

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

function seed(overrides: Partial<GameState> = {}): GameState {
  const next = { ...makeInitialState(), ...overrides }
  useGameStore.setState(next)
  return useGameStore.getState()
}

describe('store and challenges', () => {
  beforeEach(() => {
    useGameStore.setState(makeInitialState())
    useUIStore.setState({
      alertQueue: [],
      activeAlert: null,
      terminalLines: [],
      offlineModalOpen: false,
      offlinePayload: null,
      challengeCompleteModalOpen: false,
      challengeCompletePayload: null,
      victoryModalOpen: false,
      victoryPayload: null,
      prestigeAnimating: false,
      unseenUnlockedTabs: [],
      bulkAmount: 1,
      autoPrestigePendingTier: 0,
      autoPrestigeCountdown: 0
    })
    resetTickSession()
    resetUnlockSessionCaches()
    resetDirtyFlags()
    setNotationMode('suffix')
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('buys generators within challenge limits and sweeps max-all only when unlocked', () => {
    seed()
    buyGenerator(0, 1)
    let s = useGameStore.getState()
    expect(s.researchPoints).toBe(20n)
    expect(s.generators[0].quantity).toBe(1n)
    expect(s.cachedPointsPerSecond).toBe(1n)

    seed({
      researchPoints: 10_000n,
      activeChallengeRestrictions: restrictions({ maxGeneratorTier: 1 })
    })
    buyGenerator(1, 1)
    expect(useGameStore.getState().generators[1].quantity).toBe(0n)

    seed({
      researchPoints: 100n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 1n } : g
      ),
      activeChallengeRestrictions: restrictions({ maxGeneratorQuantity: 2n })
    })
    buyGenerator(0, 10)
    s = useGameStore.getState()
    expect(s.generators[0].quantity).toBe(2n)
    expect(s.researchPoints).toBe(82n)
    buyGenerator(0, 1)
    expect(useGameStore.getState().generators[0].quantity).toBe(2n)

    seed({ researchPoints: 10_000n })
    buyMaxAllGenerators()
    expect(
      useGameStore.getState().generators.every((g) => g.quantity === 0n)
    ).toBe(true)

    seed({
      researchPoints: 10_000n,
      arUpgrades: { ...makeInitialState().arUpgrades, bulk_procurement: 1 }
    })
    buyMaxAllGenerators()
    s = useGameStore.getState()
    expect(s.generators[2].quantity).toBeGreaterThan(0n)
    expect(s.generators[1].quantity).toBeGreaterThan(0n)
    expect(s.generators[0].quantity).toBeGreaterThan(0n)
    expect(s.generators[3].quantity).toBe(0n)
    expect(s.researchPoints).toBeGreaterThanOrEqual(0n)
    expect(s.researchPoints).toBeLessThan(nextCost(0, s))
  })

  it('buys synthesizers behind unlock gates and modules behind caps', () => {
    seed({ researchPoints: 10_000n })
    buySynthesizer(0, 1)
    expect(useGameStore.getState().synthesizers).toEqual([0, 0, 0, 0])

    seed({
      researchPoints: 10_000n,
      unlocks: { ...makeInitialState().unlocks, relics: true }
    })
    buySynthesizer(0, 1)
    let s = useGameStore.getState()
    expect(s.synthesizers).toEqual([1, 0, 0, 0])
    expect(s.researchPoints).toBe(0n)

    seed({
      researchPoints: 41_726n,
      unlocks: { ...makeInitialState().unlocks, relics: true }
    })
    buySynthesizer(0, 'max')
    s = useGameStore.getState()
    expect(s.synthesizers[0]).toBe(3)
    expect(s.researchPoints).toBe(0n)

    seed({
      researchPoints: 150n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 1n } : g
      )
    })
    buyModule(0, 'efficiency')
    s = useGameStore.getState()
    expect(s.generators[0].efficiencyLevel).toBe(1)
    expect(s.researchPoints).toBe(0n)

    seed({
      researchPoints: 10n ** 12n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 1n } : g
      ),
      activeChallengeRestrictions: restrictions({ modulesDisabled: true })
    })
    buyModule(0, 'efficiency')
    expect(useGameStore.getState().generators[0].efficiencyLevel).toBe(0)

    seed({
      researchPoints: 10n ** 12n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 1n, efficiencyLevel: 5 } : g
      )
    })
    buyModule(0, 'efficiency')
    expect(useGameStore.getState().generators[0].efficiencyLevel).toBe(5)
  })

  it('snapshots the run on challenge entry and restores or rewards on exit', () => {
    seed({
      researchPoints: 5_000n,
      lifetimePoints: 10n ** 9n,
      synthesizers: [2, 0, 0, 0],
      completedResearchNodes: ['C1'],
      activeMegaprojectId: 'chronos_array',
      megaprojectAllocationPercent: 40,
      megaprojectRPAbsorbed: 123n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 10n, efficiencyLevel: 3 } : g
      ),
      stats: { ...makeInitialState().stats, totalPrestigesTier1: 1 }
    })

    enterChallenge('SC1')
    let s = useGameStore.getState()
    expect(s.activeChallengeId).toBe('SC1')
    expect(s.activeChallengeRestrictions?.maxGeneratorTier).toBe(3)
    expect(s.researchPoints).toBe(35n)
    expect(s.generators[0].quantity).toBe(0n)
    expect(s.generators[0].efficiencyLevel).toBe(3)
    expect(s.activeMegaprojectId).toBeNull()
    expect(s.preChallengeSnapshot?.researchPoints).toBe('5000')

    exitChallenge(false)
    s = useGameStore.getState()
    expect(s.activeChallengeId).toBeNull()
    expect(s.activeChallengeRestrictions).toBeNull()
    expect(s.preChallengeSnapshot).toBeNull()
    expect(s.researchPoints).toBe(5_000n)
    expect(s.lifetimePoints).toBe(10n ** 9n)
    expect(s.generators[0].quantity).toBe(10n)
    expect(s.synthesizers).toEqual([2, 0, 0, 0])
    expect(s.completedResearchNodes).toEqual(['C1'])
    expect(s.activeMegaprojectId).toBe('chronos_array')
    expect(s.megaprojectAllocationPercent).toBe(40)
    expect(s.megaprojectRPAbsorbed).toBe(123n)
    expect(s.challengeRecords.SC1.completedTiers).toBe(0)

    enterChallenge('SC11')
    expect(useGameStore.getState().relicSlots).toHaveLength(3)
    useGameStore.setState({ lifetimePoints: 10n ** 10n })
    exitChallenge(true)
    s = useGameStore.getState()
    expect(s.challengeRecords.SC11.completedTiers).toBe(1)
    expect(s.relicSlots).toHaveLength(4)
    expect(s.activeChallengeId).toBeNull()
    expect(useUIStore.getState().challengeCompleteModalOpen).toBe(true)
  })

  it('switches EC2 generator type and records sandbox completions', () => {
    seed({
      stats: {
        ...makeInitialState().stats,
        totalPrestigesTier1: 1,
        totalPrestigesTier3: 1
      }
    })
    enterChallenge('EC2')
    expect(
      useGameStore.getState().activeChallengeRestrictions?.onlyGeneratorType
    ).toBe(0)
    useGameStore.setState({ researchPoints: 5_000n })
    buyGenerator(2, 1)
    expect(
      useGameStore.getState().activeChallengeRestrictions?.onlyGeneratorType
    ).toBe(2)
    exitChallenge(false)

    seed({ stats: { ...makeInitialState().stats, totalPrestigesTier1: 1 } })
    enterSandboxChallenge(restrictions(), 10n ** 20n)
    expect(useGameStore.getState().activeChallengeId).toBeNull()

    seed({
      stats: { ...makeInitialState().stats, totalPrestigesTier1: 1 },
      challengeRecords: { EC4: { completedTiers: 1, bestRP: 0n } }
    })
    enterSandboxChallenge(restrictions(), 0n)
    expect(useGameStore.getState().activeChallengeId).toBeNull()

    enterSandboxChallenge(restrictions(), 10n ** 20n)
    let s = useGameStore.getState()
    expect(s.activeChallengeId).toBe('SANDBOX')
    expect(s.sandboxTargetRP).toBe(10n ** 20n)

    useGameStore.setState({ lifetimePoints: 2n * 10n ** 20n })
    exitChallenge(true)
    s = useGameStore.getState()
    expect(s.activeChallengeId).toBeNull()
    expect(s.sandboxCompletions).toBe(1)
    expect(s.sandboxBestRP).toBe(2n * 10n ** 20n)
    expect(s.sandboxTargetRP).toBe(0n)
    expect(useUIStore.getState().challengeCompleteModalOpen).toBe(true)
  })

  it('accumulates tick RP with remainder carry and advances playtime once per second', () => {
    seed({ cachedPointsPerSecond: 15n })
    for (let i = 0; i < 10; i++) tick()
    const s = useGameStore.getState()
    expect(s.researchPoints).toBe(50n)
    expect(s.lifetimePoints).toBe(50n)
    expect(s.stats.totalSessionPlaytime).toBe(1)
  })

  it('siphons tick RP into megaprojects and completes them', () => {
    seed({
      cachedPointsPerSecond: 100n,
      activeMegaprojectId: 'chronos_array',
      megaprojectAllocationPercent: 50
    })
    tick()
    let s = useGameStore.getState()
    expect(s.megaprojectRPAbsorbed).toBe(5n)
    expect(s.researchPoints).toBe(40n)
    expect(s.lifetimePoints).toBe(45n)
    expect(s.activeMegaprojectId).toBe('chronos_array')

    seed({
      cachedPointsPerSecond: 100n,
      activeMegaprojectId: 'chronos_array',
      megaprojectAllocationPercent: 50,
      megaprojectRPAbsorbed: 5n * 10n ** 25n - 5n
    })
    tick()
    s = useGameStore.getState()
    expect(s.completedMegaprojects).toContain('chronos_array')
    expect(s.activeMegaprojectId).toBeNull()
    expect(s.megaprojectAllocationPercent).toBe(0)
    expect(s.megaprojectRPAbsorbed).toBe(0n)

    seed({
      cachedPointsPerSecond: 100n,
      activeMegaprojectId: 'dyson_swarm',
      megaprojectAllocationPercent: 50,
      megaprojectRPAbsorbed: 10n ** 85n - 5n,
      completedMegaprojects: ['omega_singularity_sphere']
    })
    tick()
    s = useGameStore.getState()
    expect(s.dysonSwarmLevel).toBe(1)
    expect(s.megaprojectRPAbsorbed).toBe(0n)
    expect(s.activeMegaprojectId).toBe('dyson_swarm')
  })

  it('forces an EC3 recursive collapse at the 300 second boundary', () => {
    seed({
      researchPoints: 1_000n,
      cachedPointsPerSecond: 10n,
      activeChallengeId: 'EC3',
      activeChallengeRestrictions: restrictions({
        autoPrestigeIntervalSeconds: 300
      }),
      synthesizers: [1, 0, 0, 0],
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 5n } : g
      ),
      stats: { ...makeInitialState().stats, currentRunSeconds: 299 }
    })

    for (let i = 0; i < 10; i++) tick()
    const s = useGameStore.getState()
    expect(s.activeChallengeId).toBe('EC3')
    expect(s.activeChallengeRestrictions?.autoPrestigeIntervalSeconds).toBe(300)
    expect(s.researchPoints).toBe(35n)
    expect(s.generators[0].quantity).toBe(0n)
    expect(s.synthesizers).toEqual([1, 0, 0, 0])
    expect(s.stats.currentRunSeconds).toBe(0)
  })

  it('runs the research lifecycle from start through overclock and auto-queue', () => {
    seed({
      researchPoints: 10_000n,
      unlocks: { ...makeInitialState().unlocks, techMatrix: true }
    })
    startResearch('C1')
    let s = useGameStore.getState()
    expect(s.activeResearchSlots[0]).toEqual({
      nodeId: 'C1',
      timerRemaining: 5
    })
    expect(s.researchPoints).toBe(9_900n)

    overclockResearch(0)
    s = useGameStore.getState()
    expect(s.completedResearchNodes).toContain('C1')
    expect(s.activeResearchSlots[0].nodeId).toBeNull()

    seed({
      researchPoints: 100_000n,
      unlocks: { ...makeInitialState().unlocks, techMatrix: true },
      completedResearchNodes: ['O6', 'R3'],
      activeResearchSlots: [
        { nodeId: 'C1', timerRemaining: 5 },
        { nodeId: null, timerRemaining: 0 }
      ]
    })
    startResearch('C2')
    s = useGameStore.getState()
    expect(s.activeResearchSlots[1].nodeId).toBeNull()
    expect(useUIStore.getState().activeAlert?.title).toBe('Branch Busy')

    seed({
      researchPoints: 100_000n,
      unlocks: { ...makeInitialState().unlocks, techMatrix: true },
      completedResearchNodes: ['O6']
    })
    startResearch('C2')
    s = useGameStore.getState()
    expect(s.o6BypassUsed).toBe(true)
    expect(s.activeResearchSlots[0].nodeId).toBe('C2')

    seed({
      researchPoints: 10_000n,
      unlocks: { ...makeInitialState().unlocks, techMatrix: true },
      completedResearchNodes: ['C1', 'R3'],
      activeResearchSlots: [
        { nodeId: 'C2', timerRemaining: 0 },
        { nodeId: null, timerRemaining: 0 }
      ],
      researchQueue: ['E1'],
      arUpgrades: { ...makeInitialState().arUpgrades, auto_research_queue: 1 },
      automation: { ...makeInitialState().automation, autoResearchQueue: true }
    })
    handleResearchCompletions(useGameStore.getState().activeResearchSlots)
    s = useGameStore.getState()
    expect(s.completedResearchNodes).toContain('C2')
    expect(s.researchQueue).toEqual([])
    expect(s.activeResearchSlots[0]).toEqual({
      nodeId: 'E1',
      timerRemaining: 9.5
    })
    expect(s.researchPoints).toBe(9_700n)
  })

  it('executes all three prestige tiers and unlocks operations on the first', () => {
    seed({
      researchPoints: 5_000n,
      lifetimePoints: 10n ** 9n,
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 10n } : g
      )
    })
    triggerTierI()
    let s = useGameStore.getState()
    expect(s.arkalonResonance).toBe(5)
    expect(s.researchPoints).toBe(35n)
    expect(s.stats.totalPrestigesTier1).toBe(1)
    expect(s.stats.currentRunSeconds).toBe(0)
    expect(s.unlocks.anomalousOperations).toBe(true)
    expect(s.cachedPointsPerSecond).toBe(0n)

    seed({
      lifetimePoints: 10n ** 35n,
      completedMegaprojects: ['chronos_array'],
      arkalonResonance: 300,
      arUpgrades: { ...makeInitialState().arUpgrades, chronal_anchor: 1 }
    })
    triggerTierII()
    s = useGameStore.getState()
    expect(s.chronalFractures).toBe(10)
    expect(s.arkalonResonance).toBe(0)
    expect(s.resonanceMemoryAR).toBe(310)
    expect(s.stats.totalPrestigesTier2).toBe(1)
    expect(s.unlockedRelics).toContain(8)

    seed({
      lifetimePoints: 10n ** 85n,
      completedMegaprojects: ['chronos_array', 'omega_singularity_sphere'],
      chronalFractures: 12,
      osUpgrades: { ...makeInitialState().osUpgrades, the_automated_lab: 1 }
    })
    triggerTierIII()
    s = useGameStore.getState()
    expect(s.omniSpars).toBe(10)
    expect(s.chronalFractures).toBe(0)
    expect(s.osUpgrades.the_automated_lab).toBe(1)
    expect(s.stats.totalPrestigesTier3).toBe(1)
    expect(s.unlockedRelics).toContain(3)
    expect(s.cachedPointsPerSecond).toBe(0n)
  })

  it('staggers unlocks, awards achievements and completes challenge targets', () => {
    seed({
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 10n } : g
      )
    })
    checkUnlocks(useGameStore.getState())
    expect(useGameStore.getState().unlocks.techMatrix).toBe(true)

    useGameStore.setState({ lifetimePoints: 5_000n })
    checkUnlocks(useGameStore.getState())
    expect(useGameStore.getState().unlocks.statistics).toBe(false)
    expect(consumeUnlocksDirty()).toBe(true)

    const realNow = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(realNow + 5_000)
    checkUnlocks(useGameStore.getState())
    expect(useGameStore.getState().unlocks.statistics).toBe(true)
    vi.spyOn(Date, 'now').mockReturnValue(realNow)

    resetUnlockSessionCaches()
    seed({
      generators: makeInitialState().generators.map((g, i) =>
        i === 0 ? { ...g, quantity: 10n } : g
      )
    })
    checkAchievements(useGameStore.getState())
    const achievements = useGameStore.getState().achievements
    expect(achievements).toContain('gen_first')
    expect(achievements).toContain('gen_10')

    resetUnlockSessionCaches()
    seed({
      activeChallengeId: 'SC1',
      activeChallengeRestrictions: restrictions({ maxGeneratorTier: 3 }),
      lifetimePoints: 1_000_000n
    })
    checkChallengeCompletion()
    const s = useGameStore.getState()
    expect(s.activeChallengeId).toBeNull()
    expect(s.challengeRecords.SC1.completedTiers).toBe(1)
  })
})
