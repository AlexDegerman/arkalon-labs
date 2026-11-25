import { describe, it, expect, beforeEach } from 'vitest'
import {
  isNodeAvailable,
  getNodeCost,
  getEffectiveStudyTime,
  getActiveSlotCount,
  getResearchQueueMax,
  getOverclockDetails,
  getO6BypassStatus,
  hasParallelResearch,
  hasThirdResearchSlot
} from '@/lib/researchNodes'
import {
  getRelicUpgradeCost,
  getRelicBulkUpgradeInfo,
  getRelicSlotCount,
  canEquipToSlot,
  getClassResonanceMultiplier,
  getEquippedClassCounts
} from '@/lib/relicDefs'
import {
  getRelicEffectiveMultiplier,
  getRelicPerGeneratorMultiplier,
  getRelicExponentBonus,
  getSuperrecursiveCoreLevel,
  getRelicOfflineEfficiencyBonus,
  getRelicARBonus,
  getRelicSynergyBonus,
  getRelicTechCostMultiplier,
  getRelicDarkEnergyCostMultiplier,
  getRelicRealityBranchCostMultiplier
} from '@/lib/relicEffects'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
import type {
  ChallengeRestrictions,
  GameState,
  GeneratorState
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

function techState(overrides: Partial<GameState> = {}): GameState {
  const base = stateWith(overrides)
  return { ...base, unlocks: { ...base.unlocks, techMatrix: true } }
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

function withRelics(
  base: GameState,
  entries: Array<[number, number]>
): GameState {
  const relicLevels: Record<number, number> = { ...base.relicLevels }
  for (const [id, level] of entries) relicLevels[id] = level
  return {
    ...base,
    unlockedRelics: Array.from(
      new Set([...base.unlockedRelics, ...entries.map(([id]) => id)])
    ),
    relicLevels,
    relicSlots: Array.from({ length: Math.max(3, entries.length) }, (_, i) =>
      entries[i] ? { relicId: entries[i][0] } : { relicId: null }
    )
  }
}

function resonance(base: GameState, level: number): GameState {
  return {
    ...base,
    arUpgrades: { ...base.arUpgrades, relic_resonance: level }
  }
}

describe('researchNodes and relics', () => {
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

  it('gates node availability behind unlocks, prerequisites and the O6 bypass', () => {
    expect(isNodeAvailable('NOPE', techState())).toBe(false)
    expect(isNodeAvailable('C1', stateWith())).toBe(false)
    expect(isNodeAvailable('C1', techState())).toBe(true)
    expect(isNodeAvailable('C2', techState())).toBe(false)
    expect(
      isNodeAvailable('C2', techState({ completedResearchNodes: ['C1'] }))
    ).toBe(true)
    expect(
      isNodeAvailable(
        'C1',
        techState({
          activeChallengeRestrictions: restrictions({
            techMatrixDisabled: true
          })
        })
      )
    ).toBe(false)

    const bypassReady = techState({ completedResearchNodes: ['O6'] })
    expect(getO6BypassStatus(bypassReady)).toEqual({
      unlocked: true,
      remaining: 1
    })
    expect(isNodeAvailable('C2', bypassReady)).toBe(true)

    const bypassUsed = techState({
      completedResearchNodes: ['O6'],
      o6BypassUsed: true
    })
    expect(getO6BypassStatus(bypassUsed)).toEqual({
      unlocked: true,
      remaining: 0
    })
    expect(isNodeAvailable('C2', bypassUsed)).toBe(false)
    expect(
      getO6BypassStatus(
        techState({
          completedResearchNodes: ['O6'],
          activeChallengeRestrictions: restrictions({
            techMatrixDisabled: true
          })
        })
      )
    ).toEqual({ unlocked: false, remaining: 0 })

    expect(isNodeAvailable('C_INF', techState())).toBe(false)
    expect(
      isNodeAvailable('C_INF', techState({ completedResearchNodes: ['C8'] }))
    ).toBe(true)
    expect(isNodeAvailable('C_INF', bypassReady)).toBe(false)
    expect(
      isNodeAvailable('R_INF', techState({ completedResearchNodes: ['R8'] }))
    ).toBe(true)
  })

  it('locks branches under SC3, SC7 and SC9 restrictions', () => {
    const energyLocked = techState({
      activeChallengeRestrictions: restrictions({ energyBranchLocked: true })
    })
    expect(isNodeAvailable('E1', energyLocked)).toBe(false)
    expect(isNodeAvailable('C1', energyLocked)).toBe(true)

    const arkalonLocked = techState({
      activeChallengeRestrictions: restrictions({ arkalonBranchLocked: true })
    })
    expect(isNodeAvailable('O1', arkalonLocked)).toBe(false)
    expect(isNodeAvailable('R1', arkalonLocked)).toBe(true)

    const specialised = techState({
      activeChallengeRestrictions: restrictions({ singleBranchOnly: true })
    })
    expect(isNodeAvailable('C1', specialised)).toBe(true)

    const completedBranch = techState({
      completedResearchNodes: ['C1'],
      activeChallengeRestrictions: restrictions({ singleBranchOnly: true })
    })
    expect(isNodeAvailable('C2', completedBranch)).toBe(true)
    expect(isNodeAvailable('E1', completedBranch)).toBe(false)
    expect(isNodeAvailable('R1', completedBranch)).toBe(false)
    expect(isNodeAvailable('O1', completedBranch)).toBe(false)

    const activeBranch = techState({
      activeResearchSlots: [{ nodeId: 'E1', timerRemaining: 10 }],
      activeChallengeRestrictions: restrictions({ singleBranchOnly: true })
    })
    expect(isNodeAvailable('E1', activeBranch)).toBe(true)
    expect(isNodeAvailable('C1', activeBranch)).toBe(false)

    const queuedBranch = techState({
      researchQueue: ['R1'],
      activeChallengeRestrictions: restrictions({ singleBranchOnly: true })
    })
    expect(isNodeAvailable('R1', queuedBranch)).toBe(true)
    expect(isNodeAvailable('C1', queuedBranch)).toBe(false)
  })

  it('applies infinite scaling and every node cost modifier', () => {
    expect(getNodeCost('C1', stateWith())).toBe(100n)
    expect(getNodeCost('NOPE', stateWith())).toBe(0n)
    expect(getNodeCost('C_INF', stateWith())).toBe(10n ** 20n)
    expect(
      getNodeCost('C_INF', stateWith({ infiniteResearchLevels: { C_INF: 1 } }))
    ).toBe(15n * 10n ** 19n)
    expect(
      getNodeCost('C_INF', stateWith({ infiniteResearchLevels: { C_INF: 2 } }))
    ).toBe(225n * 10n ** 18n)
    expect(
      getNodeCost('E_INF', stateWith({ infiniteResearchLevels: { E_INF: 1 } }))
    ).toBe(8n * 10n ** 20n)

    expect(getNodeCost('C1', withRelics(stateWith(), [[14, 10]]))).toBe(85n)
    expect(getNodeCost('C1', withRelics(stateWith(), [[14, 100]]))).toBe(10n)

    expect(getNodeCost('R1', withRelics(stateWith(), [[19, 10]]))).toBe(560n)
    expect(getNodeCost('R1', withRelics(stateWith(), [[19, 100]]))).toBe(80n)
    expect(getNodeCost('C1', withRelics(stateWith(), [[19, 10]]))).toBe(100n)

    expect(
      getNodeCost(
        'C1',
        stateWith({ completedMegaprojects: ['arkalon_matrix_mirror'] })
      )
    ).toBe(90n)
    expect(
      getNodeCost(
        'C1',
        stateWith({ activeAnomalyType: 'arkalon_resonance' })
      )
    ).toBe(100n)
    expect(
      getNodeCost(
        'C1',
        stateWith({ activeAnomalyType: 'fused_chronal_breach' })
      )
    ).toBe(100n)
    expect(
      getNodeCost('C1', stateWith({ activeAnomalyType: 'quantum_surge' }))
    ).toBe(100n)
    expect(
      getNodeCost(
        'C1',
        stateWith({
          completedMegaprojects: ['arkalon_matrix_mirror'],
          activeAnomalyType: 'arkalon_resonance'
        })
      )
    ).toBe(90n)
  })

  it('stacks study time reductions multiplicatively with the R_INF cap and 1s floor', () => {
    expect(getEffectiveStudyTime('C1', stateWith())).toBe(5)
    expect(getEffectiveStudyTime('C_INF', stateWith())).toBe(0)
    expect(getEffectiveStudyTime('NOPE', stateWith())).toBe(0)

    const instant = stateWith({
      challengeRecords: { SC2: { completedTiers: 1, bestRP: 0n } }
    })
    expect(getEffectiveStudyTime('C1', instant)).toBe(0)
    expect(getEffectiveStudyTime('E1', instant)).toBe(0)
    expect(getEffectiveStudyTime('R1', instant)).toBe(0)
    expect(getEffectiveStudyTime('O1', instant)).toBe(0)
    expect(getEffectiveStudyTime('C2', instant)).toBe(60)

    const stacked = withRelics(
      stateWith({
        completedResearchNodes: ['C2', 'R2', 'O2'],
        arUpgrades: {
          ...makeInitialState().arUpgrades,
          research_accelerant: 10
        },
        cfUpgrades: {
          ...makeInitialState().cfUpgrades,
          temporal_compression: 1
        },
        infiniteResearchLevels: { R_INF: 100 },
        challengeRecords: {
          SC3: { completedTiers: 3, bestRP: 0n },
          SC7: { completedTiers: 3, bestRP: 0n },
          AC3: { completedTiers: 3, bestRP: 0n }
        },
        achievements: ['research_all']
      }),
      [[1, 50]]
    )
    const expected =
      172800 *
      0.95 *
      0.85 *
      0.9 *
      Math.pow(0.97, 10) *
      0.75 *
      Math.pow(0.99, 100) *
      (1 / 2) *
      (1 / 1.45) *
      Math.pow(0.85, 3) *
      Math.pow(0.8, 3) *
      0.9
    expect(getEffectiveStudyTime('O8', stacked)).toBeCloseTo(expected, 6)

    const capped = stateWith({ infiniteResearchLevels: { R_INF: 299 } })
    expect(getEffectiveStudyTime('O8', capped)).toBeCloseTo(172800 * 0.05, 6)
    expect(
      getEffectiveStudyTime(
        'O8',
        stateWith({ infiniteResearchLevels: { R_INF: 900 } })
      )
    ).toBeCloseTo(172800 * 0.05, 6)
    expect(getEffectiveStudyTime('C1', capped)).toBe(1)

    const realityOnly = stateWith({
      operationArtifactsUnlocked: ['empirical_compass'],
      completedMegaprojects: ['chronos_array']
    })
    expect(getEffectiveStudyTime('R2', realityOnly)).toBeCloseTo(180 * 0.81, 6)
    expect(getEffectiveStudyTime('C2', realityOnly)).toBe(60)

    const prestigeLocked = stateWith({
      arUpgrades: { ...makeInitialState().arUpgrades, research_accelerant: 10 },
      cfUpgrades: { ...makeInitialState().cfUpgrades, temporal_compression: 1 },
      activeChallengeRestrictions: restrictions({
        prestigeUpgradesDisabled: true
      })
    })
    expect(getEffectiveStudyTime('O8', prestigeLocked)).toBe(172800)

    expect(
      getEffectiveStudyTime(
        'C1',
        stateWith({
          activeChallengeRestrictions: restrictions({
            researchTimerMultiplier: 2
          })
        })
      )
    ).toBe(10)
  })

  it('resolves research slots, queue capacity and overclock quotes', () => {
    expect(getActiveSlotCount(stateWith())).toBe(1)
    expect(hasParallelResearch(stateWith())).toBe(false)
    expect(
      getActiveSlotCount(stateWith({ completedResearchNodes: ['R3'] }))
    ).toBe(2)
    expect(
      getActiveSlotCount(
        stateWith({
          cfUpgrades: {
            ...makeInitialState().cfUpgrades,
            deep_research_slots: 1
          }
        })
      )
    ).toBe(2)
    const threeSlots = stateWith({
      completedResearchNodes: ['R3'],
      cfUpgrades: { ...makeInitialState().cfUpgrades, deep_research_slots: 1 }
    })
    expect(hasThirdResearchSlot(threeSlots)).toBe(true)
    expect(getActiveSlotCount(threeSlots)).toBe(3)
    expect(
      getActiveSlotCount({
        ...threeSlots,
        activeChallengeRestrictions: restrictions({ singleResearchSlot: true })
      })
    ).toBe(1)
    expect(
      getActiveSlotCount({
        ...threeSlots,
        activeChallengeRestrictions: restrictions({
          prestigeUpgradesDisabled: true
        })
      })
    ).toBe(2)

    expect(getResearchQueueMax(stateWith())).toBe(4)
    expect(
      getResearchQueueMax(
        stateWith({
          challengeRecords: { SC10: { completedTiers: 3, bestRP: 0n } }
        })
      )
    ).toBe(7)
    expect(
      getResearchQueueMax(
        stateWith({
          challengeRecords: {
            SC10: { completedTiers: 3, bestRP: 0n },
            AC8: { completedTiers: 1, bestRP: 0n }
          }
        })
      )
    ).toBe(8)

    expect(getOverclockDetails('C2', stateWith())).toEqual({
      cost: 5_000n,
      secondsReduced: 15
    })
    expect(getOverclockDetails('C2', stateWith(), 60)).toEqual({
      cost: 5_000n,
      secondsReduced: 15
    })
    expect(getOverclockDetails('C2', stateWith(), 7.5)).toEqual({
      cost: 2_500n,
      secondsReduced: 15
    })
    expect(getOverclockDetails('C1', stateWith()).secondsReduced).toBe(5)
    expect(getOverclockDetails('C1', stateWith(), 1).cost).toBe(20n)
    expect(
      getOverclockDetails('C1', withRelics(stateWith(), [[14, 100]]), 0.1).cost
    ).toBe(1n)
  })

  it('prices relic dust upgrades and bulk quotes with per-relic level caps', () => {
    expect(getRelicUpgradeCost(1, 0)).toBe(10)
    expect(getRelicUpgradeCost(1, 1)).toBe(11)
    expect(getRelicUpgradeCost(1, 10)).toBe(22)
    expect(getRelicUpgradeCost(99, 0)).toBe(0)
    expect(getRelicUpgradeCost(1, 100)).toBe(0)
    expect(getRelicUpgradeCost(1, 99)).toBeGreaterThan(0)
    expect(getRelicUpgradeCost(20, 20)).toBe(0)
    expect(getRelicUpgradeCost(20, 19)).toBeGreaterThan(0)

    expect(getRelicBulkUpgradeInfo(1, 0, 10, 1)).toEqual({
      levels: 1,
      cost: 10
    })
    expect(getRelicBulkUpgradeInfo(1, 0, 9, 1)).toEqual({ levels: 0, cost: 0 })
    expect(getRelicBulkUpgradeInfo(1, 0, 1000, 10)).toEqual({
      levels: 10,
      cost: 148
    })
    expect(getRelicBulkUpgradeInfo(1, 0, 147, 10)).toEqual({
      levels: 9,
      cost: 128
    })
    expect(getRelicBulkUpgradeInfo(1, 0, 33, 'max')).toEqual({
      levels: 3,
      cost: 33
    })
    expect(getRelicBulkUpgradeInfo(99, 0, 1000, 'max')).toEqual({
      levels: 0,
      cost: 0
    })

    const omegaMax = getRelicBulkUpgradeInfo(20, 18, 10_000_000, 'max')
    expect(omegaMax.levels).toBe(2)
    expect(omegaMax.cost).toBeGreaterThan(0)
    expect(omegaMax.cost).toBeLessThanOrEqual(10_000_000)
    expect(getRelicBulkUpgradeInfo(20, 20, 10_000_000, 'max')).toEqual({
      levels: 0,
      cost: 0
    })
    expect(getRelicBulkUpgradeInfo(1, 99, 10_000_000, 'max').levels).toBe(1)
  })

  it('expands relic slots via SC11, gates equipping on empty slots and boosts via relic_preservation', () => {
    expect(getRelicSlotCount(stateWith())).toBe(3)
    expect(
      getRelicSlotCount(
        stateWith({
          challengeRecords: { SC11: { completedTiers: 1, bestRP: 0n } }
        })
      )
    ).toBe(4)
    expect(
      getRelicSlotCount(
        stateWith({
          challengeRecords: { SC11: { completedTiers: 3, bestRP: 0n } }
        })
      )
    ).toBe(6)
    expect(
      getRelicSlotCount(
        stateWith({
          challengeRecords: { SC11: { completedTiers: 9, bestRP: 0n } }
        })
      )
    ).toBe(6)

    expect(canEquipToSlot({ relicId: null })).toBe(true)
    expect(canEquipToSlot({ relicId: 1 })).toBe(false)

    expect(getRelicEffectiveMultiplier(1, stateWith())).toBe(1)
    const preserved = stateWith({
      cfUpgrades: { ...makeInitialState().cfUpgrades, relic_preservation: 1 }
    })
    expect(getRelicEffectiveMultiplier(1, preserved)).toBeCloseTo(1.25, 6)
    expect(
      getRelicEffectiveMultiplier(1, {
        ...preserved,
        activeChallengeRestrictions: restrictions({
          prestigeUpgradesDisabled: true
        })
      })
    ).toBe(1)
  })

  it('grants class resonance at 2 and 3 matching equipped relics', () => {
    const pair = withRelics(stateWith(), [
      [4, 5],
      [6, 5]
    ])
    expect(getEquippedClassCounts(pair).computation).toBe(2)
    expect(getClassResonanceMultiplier(4, pair)).toBeCloseTo(1.15, 6)
    expect(getRelicEffectiveMultiplier(4, pair)).toBeCloseTo(1.15, 6)
    expect(getRelicPerGeneratorMultiplier(0, pair)).toBe(1)

    const trio = withRelics(stateWith(), [
      [4, 5],
      [6, 5],
      [11, 5]
    ])
    expect(getEquippedClassCounts(trio).computation).toBe(3)
    expect(getClassResonanceMultiplier(11, trio)).toBeCloseTo(1.35, 6)
    expect(getRelicPerGeneratorMultiplier(0, trio)).toBeCloseTo(1.1, 6)
    expect(getRelicPerGeneratorMultiplier(5, trio)).toBe(1)

    const solo = withRelics(stateWith(), [[7, 10]])
    expect(getRelicPerGeneratorMultiplier(0, solo)).toBeCloseTo(2, 6)
    const boostedPair = withRelics(stateWith(), [
      [7, 10],
      [4, 1]
    ])
    expect(getRelicPerGeneratorMultiplier(0, boostedPair)).toBeCloseTo(2.15, 6)
    const boostedTrio = withRelics(stateWith(), [
      [7, 10],
      [4, 1],
      [6, 1]
    ])
    expect(getRelicPerGeneratorMultiplier(0, boostedTrio)).toBeCloseTo(2.585, 6)
    expect(getClassResonanceMultiplier(3, boostedTrio)).toBe(1)
  })

  it('neutralises every relic effect while relicsDisabled is active', () => {
    const groupA = withRelics(
      stateWith({
        challengeRecords: { SC11: { completedTiers: 3, bestRP: 0n } }
      }),
      [
        [8, 20],
        [5, 20],
        [9, 20],
        [11, 20],
        [13, 20],
        [14, 20]
      ]
    )
    const groupB = withRelics(stateWith(), [
      [3, 20],
      [17, 20],
      [19, 20]
    ])

    expect(getRelicPerGeneratorMultiplier(5, groupB)).not.toBe(1)
    expect(getRelicExponentBonus(groupA)).toBeGreaterThan(0)
    expect(getSuperrecursiveCoreLevel(groupA)).toBeGreaterThan(0)
    expect(getRelicOfflineEfficiencyBonus(groupA)).toBeGreaterThan(0)
    expect(getRelicARBonus(groupA)).toBeGreaterThan(1)
    expect(getRelicSynergyBonus(groupA)).toBeGreaterThan(1)
    expect(getRelicTechCostMultiplier(groupA)).toBeLessThan(1)
    expect(getRelicDarkEnergyCostMultiplier(12, groupB)).toBeLessThan(1)
    expect(getRelicRealityBranchCostMultiplier(groupB)).toBeLessThan(1)

    const disabled = restrictions({ relicsDisabled: true })
    const offA: GameState = { ...groupA, activeChallengeRestrictions: disabled }
    const offB: GameState = { ...groupB, activeChallengeRestrictions: disabled }

    expect(getRelicPerGeneratorMultiplier(5, offB)).toBe(1)
    expect(getRelicExponentBonus(offA)).toBe(0)
    expect(getSuperrecursiveCoreLevel(offA)).toBe(0)
    expect(getRelicOfflineEfficiencyBonus(offA)).toBe(0)
    expect(getRelicARBonus(offA)).toBe(1)
    expect(getRelicSynergyBonus(offA)).toBe(1)
    expect(getRelicTechCostMultiplier(offA)).toBe(1)
    expect(getRelicDarkEnergyCostMultiplier(12, offB)).toBe(1)
    expect(getRelicDarkEnergyCostMultiplier(13, offB)).toBe(1)
    expect(getRelicRealityBranchCostMultiplier(offB)).toBe(1)
  })

  it('scales individual relic effects with relic_resonance', () => {
    const energy = withRelics(stateWith(), [[3, 10]])
    expect(getRelicPerGeneratorMultiplier(5, energy)).toBeCloseTo(1.5, 6)
    expect(getRelicPerGeneratorMultiplier(0, energy)).toBe(1)
    expect(
      getRelicPerGeneratorMultiplier(5, resonance(energy, 10))
    ).toBeCloseTo(1.75, 6)

    const compute = withRelics(stateWith(), [[7, 10]])
    expect(getRelicPerGeneratorMultiplier(0, compute)).toBeCloseTo(2, 6)
    expect(
      getRelicPerGeneratorMultiplier(0, resonance(compute, 10))
    ).toBeCloseTo(2.5, 6)

    const lens = withRelics(stateWith(), [[10, 10]])
    expect(getRelicPerGeneratorMultiplier(5, lens)).toBeCloseTo(2.5, 6)
    expect(getRelicPerGeneratorMultiplier(6, lens)).toBe(1)
    expect(getRelicPerGeneratorMultiplier(5, resonance(lens, 10))).toBeCloseTo(
      3.25,
      6
    )

    const siphon = withGens(withRelics(stateWith(), [[12, 10]]), {
      14: { quantity: 100n }
    })
    expect(getRelicPerGeneratorMultiplier(5, siphon)).toBeCloseTo(6, 6)
    expect(
      getRelicPerGeneratorMultiplier(5, resonance(siphon, 10))
    ).toBeCloseTo(8.5, 6)

    const monolith = withGens(withRelics(stateWith(), [[16, 10]]), {
      0: { quantity: 1n },
      1: { quantity: 1n },
      2: { quantity: 1n },
      6: { quantity: 1n }
    })
    expect(getRelicPerGeneratorMultiplier(6, monolith)).toBeCloseTo(1.6, 6)
    expect(
      getRelicPerGeneratorMultiplier(6, resonance(monolith, 10))
    ).toBeCloseTo(1.9, 6)
    expect(getRelicPerGeneratorMultiplier(0, monolith)).toBe(1)

    const darkCore = withRelics(stateWith(), [[17, 10]])
    expect(getRelicDarkEnergyCostMultiplier(12, darkCore)).toBeCloseTo(0.8, 6)
    expect(getRelicDarkEnergyCostMultiplier(13, darkCore)).toBeCloseTo(0.8, 6)
    expect(getRelicDarkEnergyCostMultiplier(11, darkCore)).toBe(1)
    expect(
      getRelicDarkEnergyCostMultiplier(12, resonance(darkCore, 10))
    ).toBeCloseTo(0.7, 6)
    expect(
      getRelicDarkEnergyCostMultiplier(12, withRelics(stateWith(), [[17, 100]]))
    ).toBeCloseTo(0.1, 6)

    const omega = withRelics(stateWith(), [[20, 20]])
    expect(getRelicPerGeneratorMultiplier(19, omega)).toBeCloseTo(11, 6)
    expect(
      getRelicPerGeneratorMultiplier(19, resonance(omega, 10))
    ).toBeCloseTo(16, 6)
    expect(
      getRelicPerGeneratorMultiplier(19, withRelics(stateWith(), [[20, 50]]))
    ).toBeCloseTo(11, 6)
    expect(getRelicPerGeneratorMultiplier(18, omega)).toBe(1)
  })
})
