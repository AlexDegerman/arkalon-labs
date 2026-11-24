import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  serialiseState,
  deserialiseState,
  exportSave,
  importSave,
  saveToLocalStorage,
  loadFromLocalStorage,
  getLastSaveTime,
  clearLocalStorageSave
} from '@/lib/saveGame'
import { CHALLENGE_BALANCE_MAP } from '@/lib/challengeDefs'
import { makeInitialState, useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { setNotationMode } from '@/lib/format'
import type { GameState, PreChallengeSnapshot } from '@/types/game'

const SAVE_KEY = 'arkalon_labs_save'
const LAST_SAVE_KEY = 'arkalon_labs_last_save_time'

function stateWith(overrides: Partial<GameState> = {}): GameState {
  return { ...makeInitialState(), ...overrides }
}

function snapshot(): PreChallengeSnapshot {
  return {
    researchPoints: '5000',
    lifetimePoints: '9000',
    generators: Array.from({ length: 20 }, () => ({ quantity: '0' })),
    synthesizers: [0, 0, 0, 0],
    completedResearchNodes: ['C1'],
    activeResearchSlots: [{ nodeId: null, timerRemaining: 0 }],
    researchQueue: [],
    infiniteResearchLevels: {},
    o6BypassUsed: false,
    activeMegaprojectId: null,
    megaprojectAllocationPercent: 0,
    megaprojectRPAbsorbed: '0',
    activeAnomalyType: null,
    anomalyTimeRemaining: 0,
    timeToNextAnomalyCheck: 180,
    manualOperationCycle: null,
    lastPrestigeTime: 1000,
    currentRunSeconds: 10,
    startedAt: 2000
  }
}

function richState(): GameState {
  const base = stateWith()
  return {
    ...base,
    researchPoints: 10n ** 162n,
    lifetimePoints: 10n ** 162n,
    arkalonResonance: 1200,
    chronalFractures: 40,
    omniSpars: 12,
    artifactDust: 900,
    generators: base.generators.map((g, i) => ({
      quantity: BigInt(i * 7),
      efficiencyLevel: i % 5,
      costReductionLevel: (i + 1) % 5,
      synergyLevel: (i + 2) % 5
    })),
    synthesizers: [3, 2, 1, 4],
    completedResearchNodes: ['C1', 'C2', 'R1', 'O1', 'C_INF'],
    activeResearchSlots: [
      { nodeId: 'C3', timerRemaining: 12.5 },
      { nodeId: null, timerRemaining: 0 }
    ],
    researchQueue: ['C4', 'E1'],
    infiniteResearchLevels: { C_INF: 12, R_INF: 200 },
    o6BypassUsed: true,
    resonanceMemoryAR: 250,
    relicSlots: [{ relicId: 1 }, { relicId: null }, { relicId: null }],
    unlockedRelics: [1, 2],
    relicLevels: { 1: 5, 2: 10 },
    relicPresets: [[1, null, null], [2, null, null], []],
    probes: [
      {
        id: 1,
        status: 'scanning',
        zone: 'safe',
        timerRemaining: 1200,
        scanDuration: 3600,
        repairTimerRemaining: 0,
        subsystem: 'thrusters',
        veteranRank: 2,
        expeditionsCompleted: 3
      }
    ],
    dysonSwarmLevel: 3,
    completedMegaprojects: ['chronos_array'],
    activeMegaprojectId: 'dyson_swarm',
    megaprojectAllocationPercent: 40,
    megaprojectRPAbsorbed: 10n ** 80n,
    challengeRecords: { SC1: { completedTiers: 2, bestRP: 10n ** 12n } },
    preChallengeSnapshot: snapshot(),
    settings: {
      ...base.settings,
      notationMode: 'scientific',
      currentUITheme: 'matrix',
      crtScanlines: true,
      reducedMotion: true,
      volumeMusic: 0.2
    },
    tutorial: {
      tutorialCompleted: true,
      tutorialBeatsCompleted: ['boot'],
      tutorialHighlightTarget: 'Ω-matrix'
    },
    stats: {
      ...base.stats,
      peakRPPerSec: 10n ** 90n,
      peakLifetimePoints: 10n ** 162n,
      allTimePoints: 10n ** 163n,
      totalPrestigesTier1: 7,
      currentRunSeconds: 42,
      bestChallengeTimes: { SC1: 120 }
    },
    achievements: ['gen_first', 'rp_1k'],
    cachedPointsPerSecond: 10n ** 100n
  }
}

function encodeJson(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value))
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

function rawSave(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    version: 2,
    researchPoints: '35',
    lifetimePoints: '35',
    generators: [],
    ...overrides
  }
}

describe('saveGame', () => {
  beforeEach(() => {
    localStorage.clear()
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
    vi.unstubAllGlobals()
    localStorage.clear()
  })

  it('round-trips a full state through serialiseState and deserialiseState', () => {
    const state = richState()
    const raw = serialiseState(state)
    expect(raw.researchPoints).toBe((10n ** 162n).toString())
    expect(raw.version).toBe(2)

    const restored = deserialiseState(JSON.parse(JSON.stringify(raw)))
    expect(restored.researchPoints).toBe(10n ** 162n)
    expect(restored.lifetimePoints).toBe(10n ** 162n)
    expect(restored.generators).toHaveLength(20)
    expect(restored.generators).toEqual(state.generators)
    expect(restored.synthesizers).toEqual([3, 2, 1, 4])
    expect(restored.activeResearchSlots).toEqual(state.activeResearchSlots)
    expect(restored.researchQueue).toEqual(['C4', 'E1'])
    expect(restored.infiniteResearchLevels).toEqual({ C_INF: 12, R_INF: 200 })
    expect(restored.o6BypassUsed).toBe(true)
    expect(restored.resonanceMemoryAR).toBe(250)
    expect(restored.relicSlots).toEqual(state.relicSlots)
    expect(restored.relicLevels).toEqual({ 1: 5, 2: 10 })
    expect(restored.relicPresets).toEqual(state.relicPresets)
    expect(restored.probes).toEqual(state.probes)
    expect(restored.dysonSwarmLevel).toBe(3)
    expect(restored.megaprojectRPAbsorbed).toBe(10n ** 80n)
    expect(restored.challengeRecords).toEqual(state.challengeRecords)
    expect(restored.preChallengeSnapshot).toEqual(state.preChallengeSnapshot)
    expect(restored.settings).toEqual(state.settings)
    expect(restored.tutorial).toEqual(state.tutorial)
    expect(restored.stats).toEqual(state.stats)
    expect(restored.achievements).toEqual(state.achievements)
    expect(restored.cachedPointsPerSecond).toBe(10n ** 100n)
    expect(restored.lastSavedTime).toBe(raw.lastSavedTime)
  })

  it('round-trips base64 exports, trims whitespace and supports legacy decoding', () => {
    const state = richState()
    const encoded = exportSave(state)
    const imported = importSave(encoded)
    expect(imported).not.toBeNull()
    expect(imported?.researchPoints).toBe(10n ** 162n)
    expect(imported?.generators).toEqual(state.generators)
    expect(imported?.synthesizers).toEqual(state.synthesizers)
    expect(imported?.relicSlots).toEqual(state.relicSlots)
    expect(imported?.probes).toEqual(state.probes)
    expect(imported?.settings).toEqual(state.settings)
    expect(imported?.stats).toEqual(state.stats)
    expect(imported?.preChallengeSnapshot).toEqual(state.preChallengeSnapshot)

    const padded = importSave(`  \n${encoded}\t `)
    expect(padded?.researchPoints).toBe(10n ** 162n)

    const legacyJson = JSON.stringify(serialiseState(state))
    const legacyEncoded = btoa(unescape(encodeURIComponent(legacyJson)))
    const legacyImport = importSave(legacyEncoded)
    expect(legacyImport?.tutorial.tutorialHighlightTarget).toBe('Ω-matrix')
    expect(legacyImport?.researchPoints).toBe(10n ** 162n)

    vi.stubGlobal(
      'TextDecoder',
      class {
        decode(): string {
          throw new Error('decoder unavailable')
        }
      }
    )
    const fallbackImport = importSave(encoded)
    expect(fallbackImport?.researchPoints).toBe(10n ** 162n)
    expect(fallbackImport?.tutorial.tutorialHighlightTarget).toBe('Ω-matrix')
  })

  it('rejects malformed and structurally invalid imports', () => {
    expect(importSave('!!!not-base64!!!')).toBeNull()
    expect(importSave(btoa('this is not json'))).toBeNull()
    expect(importSave(encodeJson({ hello: 'world' }))).toBeNull()
    expect(
      importSave(encodeJson(rawSave({ generators: undefined })))
    ).toBeNull()
    expect(
      importSave(encodeJson(rawSave({ researchPoints: undefined })))
    ).toBeNull()
    expect(
      importSave(encodeJson(rawSave({ lifetimePoints: undefined })))
    ).toBeNull()
    expect(importSave(encodeJson(rawSave({ researchPoints: 35 })))).toBeNull()
    expect(
      importSave(
        encodeJson(
          rawSave({ activeChallengeId: 'SC1', preChallengeSnapshot: null })
        )
      )
    ).toBeNull()
    expect(
      importSave(
        encodeJson(
          rawSave({
            activeChallengeId: 'SC1',
            preChallengeSnapshot: snapshot()
          })
        )
      )
    ).not.toBeNull()
    expect(importSave(encodeJson(rawSave()))).not.toBeNull()
  })

  it('migrates v1 saves and clears orphaned challenge state', () => {
    const withSavedAt = deserialiseState({
      version: 1,
      savedAt: 12_345,
      researchPoints: '35',
      lifetimePoints: '35',
      generators: []
    })
    expect(withSavedAt.lastSavedTime).toBe(12_345)

    const orphaned = deserialiseState({
      version: 1,
      researchPoints: '35',
      lifetimePoints: '35',
      generators: [],
      activeChallengeId: 'SC1',
      preChallengeSnapshot: null
    })
    expect(orphaned.activeChallengeId).toBeNull()
    expect(orphaned.activeChallengeRestrictions).toBeNull()

    const corruptSnapshot = deserialiseState({
      version: 1,
      researchPoints: '35',
      lifetimePoints: '35',
      generators: [],
      activeChallengeId: 'SC1',
      preChallengeSnapshot: 'corrupt'
    })
    expect(corruptSnapshot.activeChallengeId).toBeNull()
    expect(corruptSnapshot.activeChallengeRestrictions).toBeNull()

    const validChallenge = deserialiseState({
      version: 1,
      researchPoints: '35',
      lifetimePoints: '35',
      generators: [],
      activeChallengeId: 'SC1',
      preChallengeSnapshot: snapshot()
    })
    expect(validChallenge.activeChallengeId).toBe('SC1')
    expect(validChallenge.activeChallengeRestrictions?.maxGeneratorTier).toBe(3)

    const sandboxNoRestrictions = deserialiseState(
      rawSave({
        activeChallengeId: 'SANDBOX',
        preChallengeSnapshot: snapshot()
      })
    )
    expect(sandboxNoRestrictions.activeChallengeId).toBeNull()
    expect(sandboxNoRestrictions.activeChallengeRestrictions).toBeNull()

    const sandboxWithRestrictions = deserialiseState(
      rawSave({
        activeChallengeId: 'SANDBOX',
        activeChallengeRestrictions: { techMatrixDisabled: true },
        preChallengeSnapshot: snapshot()
      })
    )
    expect(sandboxWithRestrictions.activeChallengeId).toBe('SANDBOX')
    expect(
      sandboxWithRestrictions.activeChallengeRestrictions?.techMatrixDisabled
    ).toBe(true)
  })

  it('sanitizes negative quantities, unknown ids and level caps on load', () => {
    const restored = deserialiseState(
      rawSave({
        generators: [
          {
            quantity: '-5',
            efficiencyLevel: -2,
            costReductionLevel: 1.7,
            synergyLevel: 0
          }
        ],
        artifactDust: -50,
        completedResearchNodes: ['C1', 'BOGUS', 'C_INF', 'C1'],
        researchQueue: ['C2', 'BOGUS', 'C_INF', 'C2'],
        infiniteResearchLevels: { R_INF: 500, C_INF: 400, BOGUS: 10 },
        unlockedRelics: [0, 21, 1.5, 1, 1],
        relicLevels: { '20': 50, '1': 200, '99': 5 },
        relicSlots: [{ relicId: 0 }, { relicId: 21 }, { relicId: 1.5 }]
      })
    )

    expect(restored.generators[0].quantity).toBe(0n)
    expect(restored.generators[0].efficiencyLevel).toBe(0)
    expect(restored.generators[0].costReductionLevel).toBe(1)
    expect(restored.generators).toHaveLength(20)
    expect(restored.artifactDust).toBe(0)
    expect(restored.completedResearchNodes).toEqual(['C1', 'C_INF'])
    expect(restored.researchQueue).toEqual(['C2'])
    expect(restored.infiniteResearchLevels).toEqual({ R_INF: 299, C_INF: 400 })
    expect(restored.unlockedRelics).toEqual([1])
    expect(restored.relicLevels).toEqual({ 20: 20, 1: 100 })
    expect(restored.relicSlots.every((s) => s.relicId === null)).toBe(true)
  })

  it('pads relic slots to the SC11 allowance and strips legacy cooldown fields', () => {
    const padded = deserialiseState(
      rawSave({
        challengeRecords: { SC11: { completedTiers: 3, bestRP: '0' } },
        relicSlots: [
          { relicId: 5, cooldownRemaining: 45 },
          { relicId: null, cooldownRemaining: 45 }
        ]
      })
    )
    expect(padded.relicSlots).toHaveLength(6)
    expect(padded.relicSlots[0]).toEqual({ relicId: 5 })
    expect(padded.relicSlots[1]).toEqual({ relicId: null })
    expect(padded.relicSlots[5]).toEqual({ relicId: null })

    const overflow = deserialiseState(
      rawSave({
        challengeRecords: { SC11: { completedTiers: 9, bestRP: '0' } },
        relicSlots: []
      })
    )
    expect(overflow.relicSlots).toHaveLength(6)

    const sanitized = deserialiseState(
      rawSave({ relicSlots: [{ relicId: null, cooldownRemaining: -20 }, null] })
    )
    expect(sanitized.relicSlots).toEqual([
      { relicId: null },
      { relicId: null },
      { relicId: null }
    ])
  })

  it('sanitizes probe status, zone, timers and veteran rank', () => {
    const restored = deserialiseState(
      rawSave({
        probes: [
          { id: 1, status: 'bogus', zone: 'safe', timerRemaining: 100 },
          { id: 2, status: 'scanning', zone: null, timerRemaining: 100 },
          {
            id: 3,
            status: 'scanning',
            zone: 'void',
            timerRemaining: -50,
            veteranRank: 9,
            subsystem: 'warp'
          },
          {
            id: 4,
            status: 'repairing',
            zone: 'safe',
            repairTimerRemaining: -10,
            veteranRank: -3
          },
          null
        ]
      })
    )

    expect(restored.probes).toHaveLength(4)
    expect(restored.probes[0].status).toBe('idle')
    expect(restored.probes[0].zone).toBeNull()
    expect(restored.probes[0].timerRemaining).toBe(0)
    expect(restored.probes[1].status).toBe('idle')
    expect(restored.probes[1].zone).toBeNull()
    expect(restored.probes[2].status).toBe('scanning')
    expect(restored.probes[2].zone).toBe('void')
    expect(restored.probes[2].timerRemaining).toBe(0)
    expect(restored.probes[2].veteranRank).toBe(5)
    expect(restored.probes[2].subsystem).toBe('none')
    expect(restored.probes[3].status).toBe('repairing')
    expect(restored.probes[3].zone).toBeNull()
    expect(restored.probes[3].repairTimerRemaining).toBe(0)
    expect(restored.probes[3].veteranRank).toBe(0)

    const zeroId = deserialiseState(
      rawSave({ probes: [{ id: 0, status: 'idle' }] })
    )
    expect(zeroId.probes[0].id).toBe(1)
  })

  it('rebuilds challenge restrictions from the balance map when missing', () => {
    const sc1 = deserialiseState(
      rawSave({ activeChallengeId: 'SC1', preChallengeSnapshot: snapshot() })
    )
    expect(sc1.activeChallengeRestrictions).toEqual(
      CHALLENGE_BALANCE_MAP['SC1'].buildRestrictions()
    )

    const ec4 = deserialiseState(
      rawSave({ activeChallengeId: 'EC4', preChallengeSnapshot: snapshot() })
    )
    expect(ec4.activeChallengeRestrictions).toEqual(
      CHALLENGE_BALANCE_MAP['EC4'].buildRestrictions()
    )
    expect(ec4.activeChallengeRestrictions?.techMatrixDisabled).toBe(true)
    expect(ec4.activeChallengeRestrictions?.relicsDisabled).toBe(true)

    const explicit = deserialiseState(
      rawSave({
        activeChallengeId: 'SC1',
        preChallengeSnapshot: snapshot(),
        activeChallengeRestrictions: { maxGeneratorTier: 7 }
      })
    )
    expect(explicit.activeChallengeRestrictions?.maxGeneratorTier).toBe(7)

    const unknown = deserialiseState(
      rawSave({ activeChallengeId: 'ZZZ', preChallengeSnapshot: snapshot() })
    )
    expect(unknown.activeChallengeRestrictions).toBeNull()

    const inactive = deserialiseState(
      rawSave({ activeChallengeRestrictions: { maxGeneratorTier: 7 } })
    )
    expect(inactive.activeChallengeId).toBeNull()
    expect(inactive.activeChallengeRestrictions).toBeNull()
  })

  it('persists and clears saves through the localStorage helpers', () => {
    expect(loadFromLocalStorage()).toBeNull()
    expect(getLastSaveTime()).toBe(0)

    const state = richState()
    saveToLocalStorage(state)
    expect(localStorage.getItem(SAVE_KEY)).not.toBeNull()
    expect(getLastSaveTime()).toBeGreaterThan(0)

    const loaded = loadFromLocalStorage()
    expect(loaded?.researchPoints).toBe(10n ** 162n)
    expect(loaded?.generators).toEqual(state.generators)
    expect(loaded?.settings.notationMode).toBe('scientific')

    clearLocalStorageSave()
    expect(localStorage.getItem(SAVE_KEY)).toBeNull()
    expect(localStorage.getItem(LAST_SAVE_KEY)).toBeNull()
    expect(getLastSaveTime()).toBe(0)
    expect(loadFromLocalStorage()).toBeNull()

    localStorage.setItem(SAVE_KEY, '{broken json')
    expect(loadFromLocalStorage()).toBeNull()

    localStorage.setItem(LAST_SAVE_KEY, 'not-a-number')
    expect(getLastSaveTime()).toBe(0)
  })
})
