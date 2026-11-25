import { describe, it, expect, beforeEach } from 'vitest'
import {
  canPrestigeTier1,
  canPrestigeTier2,
  canPrestigeTier3,
  calculateARGain,
  calculateCFGain,
  calculateOSGain,
  buildTier1ResetState,
  buildTier2ResetState,
  buildTier3ResetState,
  getPrestigeResetSummary
} from '@/lib/prestigeCalc'
import {
  AR_UPGRADES,
  CF_UPGRADES,
  OS_UPGRADES,
  getUpgradeCost,
  type PrestigeUpgradeDef
} from '@/lib/prestigeUpgradeDefs'
import { getCountedAR } from '@/lib/productionEngine'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
import {
  PRESTIGE_TIER1_THRESHOLD,
  PRESTIGE_TIER2_THRESHOLD,
  PRESTIGE_TIER3_THRESHOLD
} from '@/constants/game'
import type { GameState, GeneratorState } from '@/types/game'

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

function withRelic(
  base: GameState,
  relicId: number,
  level: number,
  slot = 0
): GameState {
  return {
    ...base,
    unlockedRelics: Array.from(new Set([...base.unlockedRelics, relicId])),
    relicLevels: { ...base.relicLevels, [relicId]: level },
    relicSlots: base.relicSlots.map((s, i) => (i === slot ? { relicId } : s))
  }
}

function ar(
  overrides: Partial<GameState['arUpgrades']>
): GameState['arUpgrades'] {
  return { ...makeInitialState().arUpgrades, ...overrides }
}

function cf(
  overrides: Partial<GameState['cfUpgrades']>
): GameState['cfUpgrades'] {
  return { ...makeInitialState().cfUpgrades, ...overrides }
}

function os(
  overrides: Partial<GameState['osUpgrades']>
): GameState['osUpgrades'] {
  return { ...makeInitialState().osUpgrades, ...overrides }
}

describe('prestigeCalc', () => {
  beforeEach(() => {
    useGameStore.setState(makeInitialState())
    useUIStore.setState({
      alertQueue: [],
      activeAlert: null,
      terminalLines: [],
      prestigeAnimating: false,
      autoPrestigePendingTier: 0,
      autoPrestigeCountdown: 0
    })
    setNotationMode('suffix')
  })

  it('gates each prestige tier behind RP thresholds and megaprojects', () => {
    expect(canPrestigeTier1(stateWith())).toBe(false)
    expect(
      canPrestigeTier1(
        stateWith({ lifetimePoints: PRESTIGE_TIER1_THRESHOLD - 1n })
      )
    ).toBe(false)
    expect(
      canPrestigeTier1(stateWith({ lifetimePoints: PRESTIGE_TIER1_THRESHOLD }))
    ).toBe(true)

    expect(
      canPrestigeTier2(stateWith({ lifetimePoints: PRESTIGE_TIER2_THRESHOLD }))
    ).toBe(false)
    expect(
      canPrestigeTier2(
        stateWith({
          lifetimePoints: PRESTIGE_TIER2_THRESHOLD,
          completedMegaprojects: ['chronos_array']
        })
      )
    ).toBe(true)
    expect(
      canPrestigeTier2(
        stateWith({
          lifetimePoints: PRESTIGE_TIER2_THRESHOLD - 1n,
          completedMegaprojects: ['chronos_array']
        })
      )
    ).toBe(false)

    expect(
      canPrestigeTier3(
        stateWith({
          lifetimePoints: PRESTIGE_TIER3_THRESHOLD,
          completedMegaprojects: ['omega_singularity_sphere']
        })
      )
    ).toBe(true)
    expect(
      canPrestigeTier3(stateWith({ lifetimePoints: PRESTIGE_TIER3_THRESHOLD }))
    ).toBe(false)

    const inChallenge = stateWith({
      lifetimePoints: 10n ** 100n,
      completedMegaprojects: ['chronos_array', 'omega_singularity_sphere'],
      activeChallengeId: 'SC1'
    })
    expect(canPrestigeTier1(inChallenge)).toBe(false)
    expect(canPrestigeTier2(inChallenge)).toBe(false)
    expect(canPrestigeTier3(inChallenge)).toBe(false)
  })

  it('computes AR gain with the 500k softcap, multipliers and hard cap', () => {
    expect(calculateARGain(stateWith())).toBe(0)
    expect(calculateARGain(stateWith({ lifetimePoints: 10n ** 9n }))).toBe(5)
    expect(calculateARGain(stateWith({ lifetimePoints: 10n ** 11n }))).toBe(50)
    expect(calculateARGain(stateWith({ lifetimePoints: 10n ** 18n }))).toBe(
      158_113
    )

    const softcapped = calculateARGain(
      stateWith({ lifetimePoints: 10n ** 21n })
    )
    expect(softcapped).toBeGreaterThan(800_000)
    expect(softcapped).toBeLessThan(1_000_000)

    const base = stateWith({ lifetimePoints: 10n ** 11n })
    expect(calculateARGain(withRelic(base, 9, 10))).toBe(65)
    expect(
      calculateARGain(
        stateWith({
          lifetimePoints: 10n ** 11n,
          chronalFractures: 4,
          cfUpgrades: cf({ resonance_amplification: 1 })
        })
      )
    ).toBe(300)
    expect(
      calculateARGain(
        stateWith({
          lifetimePoints: 10n ** 11n,
          chronalFractures: 0,
          cfUpgrades: cf({ resonance_amplification: 1 })
        })
      )
    ).toBe(75)
    expect(
      calculateARGain(
        stateWith({
          lifetimePoints: 10n ** 11n,
          challengeRecords: { EC3: { completedTiers: 1, bestRP: 0n } }
        })
      )
    ).toBe(62)
    expect(
      calculateARGain(
        stateWith({ lifetimePoints: 10n ** 11n, achievements: ['prestige_50'] })
      )
    ).toBe(55)
    expect(
      calculateARGain(
        stateWith({
          lifetimePoints: 10n ** 11n,
          chronalFractures: 4,
          cfUpgrades: cf({ resonance_amplification: 1 }),
          completedResearchNodes: ['R8']
        })
      )
    ).toBe(305)
    expect(calculateARGain(stateWith({ lifetimePoints: 10n ** 300n }))).toBe(
      2_000_000_000
    )
  })

  it('computes CF and OS gains with R8 amplification and hard caps', () => {
    expect(calculateCFGain(stateWith())).toBe(0)
    expect(
      calculateCFGain(stateWith({ lifetimePoints: 10n ** 35n - 1n }))
    ).toBe(0)
    expect(calculateCFGain(stateWith({ lifetimePoints: 10n ** 35n }))).toBe(10)
    expect(
      calculateCFGain(
        stateWith({
          lifetimePoints: 10n ** 35n,
          completedResearchNodes: ['R8']
        })
      )
    ).toBe(11)
    expect(calculateCFGain(stateWith({ lifetimePoints: 10n ** 300n }))).toBe(
      2_000_000_000
    )

    expect(calculateOSGain(stateWith())).toBe(0)
    expect(
      calculateOSGain(stateWith({ lifetimePoints: 10n ** 85n - 1n }))
    ).toBe(0)
    expect(calculateOSGain(stateWith({ lifetimePoints: 10n ** 85n }))).toBe(10)
    expect(
      calculateOSGain(
        stateWith({
          lifetimePoints: 10n ** 85n,
          completedResearchNodes: ['R8']
        })
      )
    ).toBe(21)
    expect(calculateOSGain(stateWith({ lifetimePoints: 10n ** 300n }))).toBe(
      2_000_000_000
    )

    const amplified = calculateCFGain(
      stateWith({ lifetimePoints: 10n ** 45n, completedResearchNodes: ['R8'] })
    )
    const plain = calculateCFGain(stateWith({ lifetimePoints: 10n ** 45n }))
    expect(amplified).toBeGreaterThan(plain)
  })

  it('resets the run in buildTier1ResetState while retaining modules and synthesizers', () => {
    const state = withGens(
      stateWith({
        researchPoints: 10n ** 12n,
        lifetimePoints: 10n ** 12n,
        synthesizers: [3, 2, 1, 1],
        completedResearchNodes: ['C1', 'C2', 'E1', 'R3'],
        activeResearchSlots: [
          { nodeId: 'C3', timerRemaining: 100 },
          { nodeId: null, timerRemaining: 0 }
        ],
        researchQueue: ['E2'],
        o6BypassUsed: true,
        activeMegaprojectId: 'chronos_array',
        megaprojectAllocationPercent: 50,
        megaprojectRPAbsorbed: 100n,
        activeAnomalyType: 'quantum_surge',
        anomalyTimeRemaining: 30,
        timeToNextAnomalyCheck: 100,
        manualOperationCycle: 2,
        arkalonResonance: 40,
        infiniteResearchLevels: { C_INF: 4 }
      }),
      {
        0: {
          quantity: 50n,
          efficiencyLevel: 3,
          costReductionLevel: 2,
          synergyLevel: 1
        }
      }
    )

    const patch = buildTier1ResetState(state, 7)
    expect(patch.researchPoints).toBe(35n)
    expect(patch.lifetimePoints).toBe(35n)
    expect(patch.generators?.[0]).toEqual({
      quantity: 0n,
      efficiencyLevel: 3,
      costReductionLevel: 2,
      synergyLevel: 1
    })
    expect(patch.generators?.every((g) => g.quantity === 0n)).toBe(true)
    expect(patch.synthesizers).toEqual([3, 2, 1, 1])
    expect(patch.completedResearchNodes).toEqual([])
    expect(patch.activeResearchSlots).toEqual([
      { nodeId: null, timerRemaining: 0 }
    ])
    expect(patch.researchQueue).toEqual([])
    expect(patch.o6BypassUsed).toBe(false)
    expect(patch.infiniteResearchLevels).toBeUndefined()
    expect(patch.activeMegaprojectId).toBeNull()
    expect(patch.megaprojectAllocationPercent).toBe(0)
    expect(patch.megaprojectRPAbsorbed).toBe(0n)
    expect(patch.activeAnomalyType).toBeNull()
    expect(patch.anomalyTimeRemaining).toBe(0)
    expect(patch.timeToNextAnomalyCheck).toBe(100)
    expect(patch.manualOperationCycle).toBeNull()
    expect(patch.arkalonResonance).toBe(47)
  })

  it('carries the anomaly spawn countdown across prestiges with a 30s floor and fresh challenge timers', () => {
    const carried = stateWith({ timeToNextAnomalyCheck: 200 })
    expect(buildTier1ResetState(carried, 0).timeToNextAnomalyCheck).toBe(200)

    const nearlyDue = stateWith({ timeToNextAnomalyCheck: 5 })
    expect(buildTier1ResetState(nearlyDue, 0).timeToNextAnomalyCheck).toBe(30)

    const drained = stateWith({ timeToNextAnomalyCheck: 0 })
    expect(buildTier1ResetState(drained, 0).timeToNextAnomalyCheck).toBe(30)

    const challenge = stateWith({ timeToNextAnomalyCheck: 200 })
    expect(
      buildTier1ResetState(challenge, 0, true).timeToNextAnomalyCheck
    ).toBe(120)

    const collapse = stateWith({ timeToNextAnomalyCheck: 200 })
    expect(
      buildTier1ResetState(collapse, 0, true, true).timeToNextAnomalyCheck
    ).toBe(120)
  })

  it('applies Tier I retention and seeding perks and suppresses them for challenges', () => {
    const persistent = stateWith({ completedResearchNodes: ['R5', 'R7', 'C1'] })
    const persistentPatch = buildTier1ResetState(persistent, 0)
    expect(persistentPatch.completedResearchNodes).toContain('R5')
    expect(persistentPatch.completedResearchNodes).toContain('R7')
    expect(persistentPatch.completedResearchNodes).not.toContain('C1')

    const memory = stateWith({
      completedResearchNodes: ['C4', 'E4', 'R4', 'O4', 'C1'],
      cfUpgrades: cf({ quantum_memory: 1 })
    })
    expect(buildTier1ResetState(memory, 0).completedResearchNodes).toEqual([
      'C4',
      'E4',
      'R4'
    ])

    const mirror = stateWith({
      completedMegaprojects: ['arkalon_matrix_mirror']
    })
    expect(buildTier1ResetState(mirror, 0).completedResearchNodes).toEqual([
      'C1',
      'C2',
      'E1',
      'E2',
      'R1',
      'R2',
      'O1',
      'O2'
    ])

    const anchored = stateWith({
      arUpgrades: ar({ chronal_anchor: 1 }),
      cachedPointsPerSecond: 200n,
      stats: { ...makeInitialState().stats, peakRPPerSec: 500n }
    })
    expect(buildTier1ResetState(anchored, 0).researchPoints).toBe(535n)
    expect(buildTier1ResetState(anchored, 0).lifetimePoints).toBe(535n)

    const blueprint = stateWith({
      arUpgrades: ar({ dimensional_blueprinting: 1 })
    })
    const blueprintPatch = buildTier1ResetState(blueprint, 0)
    expect(blueprintPatch.generators?.[0].quantity).toBe(5n)
    expect(blueprintPatch.generators?.[2].quantity).toBe(5n)
    expect(blueprintPatch.generators?.[3].quantity).toBe(0n)

    const tier2Seed = stateWith({
      stats: { ...makeInitialState().stats, totalPrestigesTier2: 1 }
    })
    const tier2Patch = buildTier1ResetState(tier2Seed, 0)
    expect(tier2Patch.generators?.[0].quantity).toBe(25n)
    expect(tier2Patch.generators?.[2].quantity).toBe(25n)
    expect(tier2Patch.generators?.[3].quantity).toBe(0n)

    const tier3Seed = stateWith({
      stats: {
        ...makeInitialState().stats,
        totalPrestigesTier2: 1,
        totalPrestigesTier3: 1
      }
    })
    const tier3Patch = buildTier1ResetState(tier3Seed, 0)
    expect(tier3Patch.generators?.[4].quantity).toBe(50n)
    expect(tier3Patch.generators?.[5].quantity).toBe(0n)

    const perked = withGens(
      stateWith({
        completedResearchNodes: ['R5', 'R7', 'C4'],
        completedMegaprojects: ['arkalon_matrix_mirror'],
        cfUpgrades: cf({ quantum_memory: 1 }),
        arUpgrades: ar({ chronal_anchor: 1, dimensional_blueprinting: 1 }),
        synthesizers: [4, 3, 2, 1],
        infiniteResearchLevels: { C_INF: 9 },
        cachedPointsPerSecond: 900n,
        stats: { ...makeInitialState().stats, totalPrestigesTier3: 2 }
      }),
      { 0: { quantity: 400n } }
    )
    const challengePatch = buildTier1ResetState(perked, 0, true)
    expect(challengePatch.researchPoints).toBe(35n)
    expect(challengePatch.completedResearchNodes).toEqual([])
    expect(challengePatch.generators?.every((g) => g.quantity === 0n)).toBe(
      true
    )
    expect(challengePatch.synthesizers).toEqual([0, 0, 0, 0])
    expect(challengePatch.infiniteResearchLevels).toEqual({})

    const collapsePatch = buildTier1ResetState(perked, 0, true, true)
    expect(collapsePatch.synthesizers).toEqual([4, 3, 2, 1])
    expect(collapsePatch.infiniteResearchLevels).toBeUndefined()
  })

  it('resets AR, synthesizers, infinite research and sockets in buildTier2ResetState', () => {
    const state = withRelic(
      stateWith({
        lifetimePoints: 10n ** 40n,
        arkalonResonance: 300,
        resonanceMemoryAR: 100,
        chronalFractures: 5,
        arUpgrades: ar({ chronal_anchor: 1 }),
        synthesizers: [4, 3, 2, 1],
        infiniteResearchLevels: { C_INF: 12, R_INF: 30 },
        completedResearchNodes: ['C1', 'R3'],
        challengeRecords: { SC11: { completedTiers: 2, bestRP: 0n } }
      }),
      1,
      25
    )

    expect(getCountedAR(state)).toBe(310)
    const patch = buildTier2ResetState(state, 3)
    expect(patch.arkalonResonance).toBe(0)
    expect(patch.chronalFractures).toBe(8)
    expect(patch.synthesizers).toEqual([0, 0, 0, 0])
    expect(patch.infiniteResearchLevels).toEqual({})
    expect(patch.completedResearchNodes).toEqual([])
    expect(patch.resonanceMemoryAR).toBe(310)
    expect(patch.relicSlots).toHaveLength(5)
    expect(patch.relicSlots?.every((s) => s.relicId === null)).toBe(true)
    expect(patch.unlockedRelics).toBeUndefined()
    expect(patch.relicLevels).toBeUndefined()

    const mirrorPatch = buildTier2ResetState(
      stateWith({ completedMegaprojects: ['arkalon_matrix_mirror'] }),
      1
    )
    expect(mirrorPatch.completedResearchNodes).toEqual([
      'C1',
      'C2',
      'E1',
      'E2',
      'R1',
      'R2',
      'O1',
      'O2'
    ])
  })

  it('resets CF and economic upgrades but keeps QoL automation in buildTier3ResetState', () => {
    const automation = {
      ...makeInitialState().automation,
      autoBuyBasic: true,
      autoResearchQueue: true,
      autoModuleBuy: true
    }
    const state = stateWith({
      lifetimePoints: 10n ** 90n,
      arkalonResonance: 250,
      chronalFractures: 12,
      omniSpars: 4,
      arUpgrades: ar({
        bulk_procurement: 1,
        auto_buy_basic: 1,
        auto_research_queue: 1,
        generator_priming: 5,
        quantum_overdrive: 3
      }),
      cfUpgrades: cf({
        auto_module_buyer: 1,
        auto_buy_synthesizers: 1,
        auto_upgrade_relics: 1,
        temporal_compression: 1,
        deep_research_slots: 1
      }),
      osUpgrades: os({ the_automated_lab: 1 }),
      automation
    })

    const patch = buildTier3ResetState(state, 6)
    expect(patch.chronalFractures).toBe(0)
    expect(patch.omniSpars).toBe(10)
    expect(patch.arkalonResonance).toBe(0)
    expect(patch.arUpgrades?.bulk_procurement).toBe(1)
    expect(patch.arUpgrades?.auto_buy_basic).toBe(1)
    expect(patch.arUpgrades?.auto_research_queue).toBe(1)
    expect(patch.arUpgrades?.generator_priming).toBe(0)
    expect(patch.arUpgrades?.quantum_overdrive).toBe(0)
    expect(patch.cfUpgrades?.auto_module_buyer).toBe(1)
    expect(patch.cfUpgrades?.auto_buy_synthesizers).toBe(1)
    expect(patch.cfUpgrades?.auto_upgrade_relics).toBe(1)
    expect(patch.cfUpgrades?.temporal_compression).toBe(0)
    expect(patch.cfUpgrades?.deep_research_slots).toBe(0)
    expect(patch.automation).toEqual(automation)
    expect(patch.osUpgrades).toBeUndefined()
    expect(patch.resonanceMemoryAR).toBeGreaterThanOrEqual(getCountedAR(state))
  })

  it('prices prestige upgrades linearly, exponentially and with a hard ceiling', () => {
    const chronalAnchor = AR_UPGRADES.find((u) => u.id === 'chronal_anchor')!
    const pipeline = AR_UPGRADES.find((u) => u.id === 'neural_pipeline')!
    const priming = AR_UPGRADES.find((u) => u.id === 'generator_priming')!
    const overdrive = AR_UPGRADES.find((u) => u.id === 'quantum_overdrive')!
    const temporalCompression = CF_UPGRADES.find(
      (u) => u.id === 'temporal_compression'
    )!
    const automatedLab = OS_UPGRADES.find((u) => u.id === 'the_automated_lab')!

    expect(getUpgradeCost(chronalAnchor, chronalAnchor.maxLevel)).toBe(0)
    expect(getUpgradeCost(chronalAnchor, 0)).toBe(10)
    expect(getUpgradeCost(temporalCompression, 0)).toBe(10)
    expect(getUpgradeCost(automatedLab, 0)).toBe(8)

    expect(getUpgradeCost(pipeline, 0)).toBe(6)
    expect(getUpgradeCost(pipeline, 2)).toBe(18)
    expect(getUpgradeCost(pipeline, 4)).toBe(30)

    expect(getUpgradeCost(priming, 0)).toBe(2)
    expect(getUpgradeCost(priming, 3)).toBe(8)
    expect(getUpgradeCost(priming, 10)).toBe(219)
    expect(getUpgradeCost(overdrive, 0)).toBe(500)
    expect(getUpgradeCost(overdrive, 19)).toBe(262_144_000)

    const ceilingDef: PrestigeUpgradeDef = {
      id: 'synthetic_ceiling',
      label: 'Synthetic',
      description: 'Synthetic',
      baseCost: 1_000_000_000,
      maxLevel: 10,
      currency: 'ar',
      costScaling: 10,
      effectAtLevel: () => ''
    }
    expect(getUpgradeCost(ceilingDef, 3)).toBe(2_000_000_000)
    expect(getUpgradeCost(ceilingDef, 10)).toBe(0)
  })

  it('summarizes resets and retentions per tier including conditional entries', () => {
    const plain = stateWith()
    const tier1Plain = getPrestigeResetSummary(1, plain)
    expect(tier1Plain.resets).toContain('Research Points')
    expect(tier1Plain.resets).toContain('Generator quantities')
    expect(tier1Plain.resets).toContain('Megaproject progress')
    expect(tier1Plain.retains.some((r) => r.includes('R5'))).toBe(false)
    expect(tier1Plain.retains.some((r) => r.includes('R7'))).toBe(false)
    expect(tier1Plain.retains.some((r) => r.includes('Quantum Memory'))).toBe(
      false
    )
    expect(tier1Plain.retains.some((r) => r.includes('Matrix Mirror'))).toBe(
      false
    )

    const perked = stateWith({
      completedResearchNodes: ['R5', 'R7'],
      cfUpgrades: cf({ quantum_memory: 1 }),
      completedMegaprojects: ['arkalon_matrix_mirror']
    })
    const tier1Perked = getPrestigeResetSummary(1, perked)
    expect(tier1Perked.retains.some((r) => r.includes('R5'))).toBe(true)
    expect(tier1Perked.retains.some((r) => r.includes('R7'))).toBe(true)
    expect(tier1Perked.retains.some((r) => r.includes('Quantum Memory'))).toBe(
      true
    )
    expect(tier1Perked.retains.some((r) => r.includes('Matrix Mirror'))).toBe(
      true
    )

    const tier2 = getPrestigeResetSummary(2, perked)
    expect(tier2.resets).toContain('Synthesizers')
    expect(tier2.resets).toContain('Arkalon Resonance balance')
    expect(tier2.resets).toContain('Infinite research levels')
    expect(tier2.retains).toContain('Resonance Memory AR floor')
    expect(tier2.retains).toContain('Omni-Spars')
    expect(tier2.retains.some((r) => r.includes('Matrix Mirror'))).toBe(true)

    const tier3 = getPrestigeResetSummary(3, plain)
    expect(tier3.resets).toContain('Chronal Fracture balance')
    expect(tier3.retains).toContain('Omni-Spar upgrades')
    expect(tier3.retains).toContain('QoL & Automation unlocks')
    expect(tier3.retains).toContain('Completed Megaprojects')
    expect(tier3.retains.some((r) => r.includes('Matrix Mirror'))).toBe(false)
  })
})
