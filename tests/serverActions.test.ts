import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { saveState } from '@/app/actions/saveState'
import { loadState } from '@/app/actions/loadState'
import { getOrCreateLabsPlayer } from '@/app/actions/getOrCreateLabsPlayer'
import { rerollPlayerName } from '@/app/actions/rerollPlayerName'
import { GET } from '@/app/api/health/route'
import { serialiseState, type SerializedSave } from '@/lib/saveGame'
import { makeInitialState } from '@/app/stores/gameStore'

const { mockPool, mockClient, mockCookieStore, cookieJar, mockCookies } =
  vi.hoisted(() => {
    const jar = new Map<string, string>()
    const client = { query: vi.fn(), release: vi.fn() }
    const pool = { connect: vi.fn() }
    const store = {
      get: vi.fn((name: string) =>
        jar.has(name) ? { name, value: jar.get(name) } : undefined
      ),
      set: vi.fn(
        (name: string, value: string, _options?: Record<string, unknown>) => {
          jar.set(name, value)
        }
      )
    }
    return {
      mockPool: pool,
      mockClient: client,
      mockCookieStore: store,
      cookieJar: jar,
      mockCookies: vi.fn(async () => store)
    }
  })

vi.mock('@/lib/db', () => ({ default: mockPool }))
vi.mock('next/headers', () => ({ cookies: mockCookies }))
vi.mock('next/server', () => ({
  NextResponse: {
    json: (
      body: unknown,
      init?: { status?: number; headers?: Record<string, string> }
    ) => ({
      status: init?.status ?? 200,
      headers: init?.headers ?? {},
      json: async () => body
    })
  }
}))

let uuidCounter = 0
function freshUuid(): string {
  uuidCounter += 1
  return `22222222-2222-4222-8222-${String(uuidCounter).padStart(12, '0')}`
}

function login(id: string): void {
  cookieJar.set('arkalon_core_id', id)
  cookieJar.set('arkalon_session', 'session-token')
}

function basePayload() {
  const save = serialiseState(makeInitialState())
  return {
    save,
    lastSavedTime: save.lastSavedTime,
    lifetimePoints: save.lifetimePoints,
    currentPoints: save.researchPoints,
    cachedPPS: save.cachedPointsPerSecond
  }
}

function fullRow(playerPoints = '1000') {
  return {
    current_points: playerPoints,
    lifetime_points: '5000',
    arkalon_resonance: 12,
    chronal_fractures: 3,
    omni_spars: 1,
    artifact_dust: 50,
    generator_data: [
      {
        quantity: '2',
        efficiencyLevel: 1,
        costReductionLevel: 0,
        synergyLevel: 0
      }
    ],
    research_data: {
      completedNodes: ['C1'],
      activeSlots: [{ nodeId: 'C2', timerRemaining: 5 }],
      queue: ['E1'],
      infiniteLevels: { C_INF: 3 },
      o6BypassUsed: true
    },
    prestige_upgrades: {
      ar: { chronal_anchor: 1 },
      cf: { temporal_compression: 1 },
      os: { the_automated_lab: 1 },
      resonanceMemoryAR: 250,
      autoPrestigeMode: 'target',
      autoPrestigeTargetAR: 500
    },
    relic_data: {
      slots: [{ relicId: 1, cooldownRemaining: 0 }],
      unlocked: [1],
      levels: { 1: 5 },
      presets: [[1, null, null], [], []],
      synthesizers: [2, 0, 0, 0],
      artifactDust: 77
    },
    excavation_data: [],
    megaproject_data: {
      activeId: 'chronos_array',
      allocationPercent: 40,
      lastAllocationPercent: 40,
      rpAbsorbed: '123',
      completed: [],
      dysonSwarmLevel: 2
    },
    anomaly_data: {
      activeType: 'quantum_surge',
      timeRemaining: 30,
      timeToNextCheck: 100
    },
    feature_flags: { techMatrix: true },
    tutorial_data: {
      tutorialCompleted: true,
      tutorialBeatsCompleted: ['boot'],
      tutorialHighlightTarget: null
    },
    challenge_data: {
      activeChallengeId: 'SC1',
      challengeActiveSeconds: 60,
      activeChallengeRestrictions: null,
      preChallengeSnapshot: null,
      records: { SC1: { completedTiers: 1, bestRP: '1000' } },
      sandboxTargetRP: '0',
      sandboxBestRP: '5',
      sandboxCompletions: 2
    },
    automation_data: { autoBuyBasic: true },
    operation_data: {
      points: 500,
      artifactsUnlocked: ['chronos_loom'],
      currentCycle: 2,
      manualCycle: 3,
      cosmicAttunementLevel: 2,
      cosmicTemporalLevel: 1
    },
    achievements: ['gen_first'],
    stats_data: {
      totalPrestigesTier1: 2,
      peakRPPerSec: '50',
      allTimePoints: '9000',
      totalSessionPlaytime: 120,
      currentRunSeconds: 45,
      lastPrestigeTime: 1000
    },
    client_settings: { notationMode: 'scientific' },
    last_saved_time: '1700000000000'
  }
}

describe('server actions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    cookieJar.clear()
    mockPool.connect.mockResolvedValue(mockClient)
    mockClient.query.mockResolvedValue({ rows: [] })
    vi.stubEnv('NODE_ENV', 'test')
    vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/arkalon_test')
    vi.stubEnv('DATABASE_SSL', 'false')
    vi.stubEnv('INTERNAL_NETWORK_URL', 'http://hub.test')
    vi.stubEnv('INTERNAL_SERVICE_SECRET', 'test-secret')
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('rejects saveState without an active session cookie', async () => {
    const result = await saveState(basePayload())
    expect(result).toEqual({
      success: false,
      error: 'Unauthorized: No active Arkalon session'
    })
    expect(mockPool.connect).not.toHaveBeenCalled()
  })

  it('rejects invalid timestamps, types and impossible balances', async () => {
    login(freshUuid())

    expect(await saveState({ ...basePayload(), lastSavedTime: 0 })).toEqual({
      success: false,
      error: 'Invalid save timestamp'
    })
    expect(await saveState({ ...basePayload(), lastSavedTime: -1 })).toEqual({
      success: false,
      error: 'Invalid save timestamp'
    })
    expect(
      await saveState({
        ...basePayload(),
        lastSavedTime: Date.now() + 400_000
      })
    ).toEqual({
      success: false,
      error: 'Save rejected: values exceed theoretical ceiling'
    })
    expect(await saveState({ ...basePayload(), lifetimePoints: '-1' })).toEqual(
      { success: false, error: 'Negative point values rejected' }
    )
    expect(await saveState({ ...basePayload(), currentPoints: 'abc' })).toEqual(
      { success: false, error: 'Invalid point values' }
    )
    expect(
      await saveState({
        ...basePayload(),
        lifetimePoints: 5000 as unknown as string
      })
    ).toEqual({ success: false, error: 'Invalid point value types' })
    expect(
      await saveState({
        ...basePayload(),
        currentPoints: '2000',
        lifetimePoints: '500'
      })
    ).toEqual({
      success: false,
      error: 'Save rejected: values exceed theoretical ceiling'
    })
    expect(
      await saveState({
        ...basePayload(),
        save: null as unknown as SerializedSave
      })
    ).toEqual({ success: false, error: 'Invalid save payload' })
    expect(mockPool.connect).not.toHaveBeenCalled()
  })

  it('upserts a valid save and rate limits an immediate repeat', async () => {
    const playerId = freshUuid()
    login(playerId)

    const first = await saveState(basePayload())
    expect(first).toEqual({ success: true })
    expect(mockPool.connect).toHaveBeenCalledTimes(1)
    expect(mockClient.query).toHaveBeenCalledTimes(1)

    const [sql, params] = mockClient.query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('INSERT INTO game_states')
    expect(sql).toContain('ON CONFLICT (player_id) DO UPDATE')
    expect(params).toHaveLength(23)
    expect(params[0]).toBe(playerId)
    expect(mockClient.release).toHaveBeenCalledTimes(1)

    const second = await saveState(basePayload())
    expect(second).toEqual({ success: false, error: 'Rate limited' })
    expect(mockClient.query).toHaveBeenCalledTimes(1)
    expect(mockClient.release).toHaveBeenCalledTimes(1)
  })

  it('reconstructs a full save row and handles an empty result', async () => {
    login(freshUuid())

    mockClient.query.mockResolvedValueOnce({ rows: [] })
    expect(await loadState()).toEqual({ success: true, state: undefined })

    mockClient.query.mockResolvedValueOnce({ rows: [fullRow()] })
    const result = await loadState()
    expect(result.success).toBe(true)
    const state = result.state as Record<string, unknown>
    expect(state.researchPoints).toBe('1000')
    expect(state.lifetimePoints).toBe('5000')
    expect(state.artifactDust).toBe(77)
    expect(state.completedResearchNodes).toEqual(['C1'])
    expect(state.researchQueue).toEqual(['E1'])
    expect(state.infiniteResearchLevels).toEqual({ C_INF: 3 })
    expect(state.o6BypassUsed).toBe(true)
    expect(state.resonanceMemoryAR).toBe(250)
    expect(state.arUpgrades).toEqual({ chronal_anchor: 1 })
    expect(state.autoPrestigeMode).toBe('target')
    expect(state.autoPrestigeTargetAR).toBe(500)
    expect(state.synthesizers).toEqual([2, 0, 0, 0])
    expect(state.unlockedRelics).toEqual([1])
    expect(state.dysonSwarmLevel).toBe(2)
    expect(state.megaprojectRPAbsorbed).toBe('123')
    expect(state.activeAnomalyType).toBe('quantum_surge')
    expect(state.activeChallengeId).toBe('SC1')
    expect(state.challengeRecords).toEqual({
      SC1: { completedTiers: 1, bestRP: '1000' }
    })
    expect(state.sandboxCompletions).toBe(2)
    expect(state.currentOperationPoints).toBe(500)
    expect(state.manualOperationCycle).toBe(3)
    expect(state.achievements).toEqual(['gen_first'])
    expect((state.stats as Record<string, unknown>).totalPrestigesTier1).toBe(2)
    expect((state.stats as Record<string, unknown>).currentRunSeconds).toBe(45)
    expect((state.settings as Record<string, unknown>).notationMode).toBe(
      'scientific'
    )
    expect(state.lastSavedTime).toBe(1_700_000_000_000)
    expect(state._serverCycleNumber).toBe(
      Math.floor(Date.now() / (90 * 24 * 3600 * 1000)) + 1
    )
    expect(mockClient.release).toHaveBeenCalled()
  })

  it('degrades gracefully when the database is unavailable', async () => {
    login(freshUuid())
    vi.stubEnv('DATABASE_URL', '')
    expect(await loadState()).toEqual({
      success: false,
      error: 'Database offline'
    })

    vi.stubEnv('DATABASE_URL', 'postgres://localhost:5432/arkalon_test')
    mockPool.connect.mockRejectedValueOnce(
      Object.assign(new Error('refused'), { code: 'ECONNREFUSED' })
    )
    expect(await loadState()).toEqual({
      success: false,
      error: 'Database offline'
    })

    cookieJar.clear()
    expect(await loadState()).toEqual({
      success: false,
      error: 'Unauthorized: No active Arkalon session'
    })
  })

  it('provisions a new player through the Network Hub and sets cookies', async () => {
    const coreId = freshUuid()
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        coreId,
        sessionToken: 'hub-session',
        nickname: 'HubNick',
        shortId: 'short123'
      })
    } as Response)
    mockClient.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })

    const result = await getOrCreateLabsPlayer()
    expect(result).toEqual({ coreId, displayName: 'HubNick' })

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://hub.test/api/identity/provision')
    expect(init.method).toBe('POST')
    expect((init.headers as Record<string, string>)['x-internal-secret']).toBe(
      'test-secret'
    )

    const coreCookie = mockCookieStore.set.mock.calls.find(
      (c) => c[0] === 'arkalon_core_id'
    )
    const sessionCookie = mockCookieStore.set.mock.calls.find(
      (c) => c[0] === 'arkalon_session'
    )
    expect(coreCookie?.[1]).toBe(coreId)
    expect(sessionCookie?.[1]).toBe('hub-session')
    expect(coreCookie?.[2]).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true })
    )
    expect(sessionCookie?.[2]).toEqual(
      expect.objectContaining({ httpOnly: true, sameSite: 'lax', secure: true })
    )

    expect(mockClient.query).toHaveBeenCalledTimes(2)
    expect(String(mockClient.query.mock.calls[1][0])).toContain(
      'INSERT INTO players'
    )
    expect(mockClient.release).toHaveBeenCalledTimes(1)
  })

  it('returns the local player record when cookies already exist', async () => {
    const coreId = freshUuid()
    login(coreId)
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nickname: 'HubNick' })
    } as Response)
    mockClient.query.mockResolvedValueOnce({
      rows: [{ id: coreId, display_name: 'LocalNick' }]
    })

    const result = await getOrCreateLabsPlayer()
    expect(result).toEqual({ coreId, displayName: 'LocalNick' })
    expect(mockClient.query).toHaveBeenCalledTimes(1)
    expect(String(mockClient.query.mock.calls[0][0])).toContain(
      'SELECT id, display_name FROM players'
    )
    expect(mockClient.release).toHaveBeenCalledTimes(1)
  })

  it('rerolls the display name through the Hub and syncs locally', async () => {
    expect(await rerollPlayerName()).toEqual({
      success: false,
      error: 'No active session'
    })

    const coreId = freshUuid()
    login(coreId)
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ nickname: 'NewNick' })
    } as Response)

    const result = await rerollPlayerName()
    expect(result).toEqual({ success: true, nickname: 'NewNick' })
    expect(String(fetchMock.mock.calls[0][0])).toBe(
      'http://hub.test/api/identity/reroll'
    )
    const [sql, params] = mockClient.query.mock.calls[0] as [string, unknown[]]
    expect(sql).toContain('UPDATE players SET display_name')
    expect(params).toEqual(['NewNick', coreId])
    expect(mockClient.release).toHaveBeenCalledTimes(1)

    fetchMock.mockResolvedValueOnce({ ok: false } as Response)
    expect(await rerollPlayerName()).toEqual({
      success: false,
      error: 'Network Hub failed to reroll'
    })
  })

  it('reports health as ok or degraded based on the database probe', async () => {
    const okResponse = await GET()
    expect(okResponse.status).toBe(200)
    const okBody = await okResponse.json()
    expect(okBody.status).toBe('ok')
    expect(okBody.db).toBe('ok')
    expect(mockClient.query).toHaveBeenCalledWith('SELECT 1')
    expect(mockClient.release).toHaveBeenCalledTimes(1)

    mockPool.connect.mockRejectedValueOnce(new Error('down'))
    const badResponse = await GET()
    expect(badResponse.status).toBe(503)
    const badBody = await badResponse.json()
    expect(badBody.status).toBe('degraded')
    expect(badBody.db).toBe('error')
  })
})
