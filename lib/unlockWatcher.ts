import type { GameState } from '@/types/game'
import { FEATURE_MAP, type FeatureKey } from '@/lib/featureRegistry'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { getActiveSlotCount } from './researchNodes'
import { canPrestigeTier2, canPrestigeTier3 } from './prestigeCalc'
import { ERA_THRESHOLDS } from '@/constants/game'
import {
  dispatchEraTransition,
  dispatchFeatureUnlock,
  dispatchPrestigeAvailable,
  dispatchTutorialBeat
} from './dialogueDispatcher'
import { ACHIEVEMENTS } from './achievementDefs'
import { CHALLENGE_DISPLAY } from '@/constants/challenges'
import { playSound } from '@/hooks/useSound'
import { awardRelic } from '@/app/stores/actions/relicActions'
import { markUnlocksDirty } from '@/lib/dirtyFlags'

// Ordered unlock evaluation so features announce one at a time in progression order
const UNLOCK_ORDER: FeatureKey[] = [
  'techMatrix',
  'statistics',
  'modules',
  'achievements',
  'anomalies',
  'relics',
  'excavation',
  'prestige',
  'megaprojects',
  'anomalousOperations',
  'challenges'
]

// Unlock condition evaluators - each returns true when the feature should unlock
const UNLOCK_CONDITIONS: Record<FeatureKey, (s: GameState) => boolean> = {
  techMatrix: (s) => s.generators[0].quantity >= 10n,

  statistics: (s) => s.lifetimePoints >= 5_000n,

  modules: (s) => s.generators[1].quantity >= 10n,

  achievements: (s) =>
    s.stats.totalSessionPlaytime >= 300 || (s.achievements?.length ?? 0) >= 3,

  anomalies: (s) =>
    s.tutorial.tutorialCompleted &&
    s.completedResearchNodes.filter((id) => !id.includes('_INF')).length >= 2,

  relics: (s) =>
    s.stats.totalAnomaliesResolved > 0 ||
    s.completedResearchNodes.includes('O1'),

  excavation: (s) =>
    s.generators[1].quantity >= 25n && s.generators[2].quantity >= 10n,

  prestige: (s) => s.lifetimePoints >= 1_000_000_000n,

  megaprojects: (s) =>
    s.lifetimePoints >= 1_000_000_000_000n && s.generators[4].quantity >= 10n,

  anomalousOperations: (s) => s.stats.totalPrestigesTier1 > 0,

  challenges: (s) => s.stats.totalPrestigesTier1 > 0
}

// Alert messages shown when a feature first unlocks
const UNLOCK_MESSAGES: Record<FeatureKey, { title: string; message: string }> =
  {
    techMatrix: {
      title: 'Research Online',
      message:
        'Open Research in the Facility Directory to study upgrades across four branches.'
    },
    statistics: {
      title: 'Statistics Online',
      message:
        'Production telemetry and run history are now tracked under Statistics in the Directory.'
    },
    modules: {
      title: 'Generator Modules Online',
      message:
        'Open Generator Modules in the Directory to upgrade efficiency, cost curves, and synergies.'
    },
    anomalies: {
      title: 'Anomalies Detected',
      message:
        'Spatial anomalies will now appear periodically as temporary facility-wide boosts.'
    },
    achievements: {
      title: 'Achievements Online',
      message:
        'Each milestone unlocked in Achievements adds +1% permanent global RP output.'
    },
    relics: {
      title: 'Relics & Artifacts Online',
      message:
        "Relic 1 (Arkalon's Left Eye) has been awarded. Open Relics & Artifacts to socket it."
    },
    excavation: {
      title: 'Excavation Bay Online',
      message:
        'Open Excavation in the Directory to assemble probes and scan sectors for Dust and Relics.'
    },
    prestige: {
      title: 'Prestige Available',
      message:
        'Open Prestige in the Directory to reset this run for permanent Arkalon Resonance.'
    },
    megaprojects: {
      title: 'Megaprojects Online',
      message:
        'Open Megaprojects in the Directory to divert passive RP into permanent structures.'
    },
    anomalousOperations: {
      title: 'Anomalous Operations Online',
      message:
        'Open Anomalous Operations in the Directory to earn Operation Points for permanent artifacts.'
    },
    challenges: {
      title: 'Challenges Online',
      message:
        'Open Challenges in the Directory to attempt restricted runs for permanent multipliers.'
    }
  }

// Minimum stagger between consecutive feature unlocks so alerts and voice never overlap
const UNLOCK_STAGGER_MS = 4500
let lastUnlockTimestamp = 0

// Tracks which features have already fired their unlock alert this session
// to avoid re-alerting on every tick after unlock
const alertedThisSession = new Set<FeatureKey>()
let alertedTier2Available = false
let alertedTier3Available = false

// Evaluates unlock conditions sequentially (at most one unlock per stagger window)
export function checkUnlocks(state: GameState): void {
  const pushAlert = useUIStore.getState().pushAlert
  const now = Date.now()

  if (
    !alertedTier2Available &&
    state.stats.totalPrestigesTier2 === 0 &&
    canPrestigeTier2(state)
  ) {
    alertedTier2Available = true
    dispatchPrestigeAvailable(2)
    useUIStore.getState().markTabUnseen('prestige')
    pushAlert({
      priority: 0,
      variant: 'prestige',
      title: 'Timeline Severance Ready',
      message:
        'Chronos Array and 10^35 RP achieved. Tier II Prestige is now available.',
      autoDismissMs: 8000
    })
  }

  if (
    !alertedTier3Available &&
    state.stats.totalPrestigesTier3 === 0 &&
    canPrestigeTier3(state)
  ) {
    alertedTier3Available = true
    dispatchPrestigeAvailable(3)
    useUIStore.getState().markTabUnseen('prestige')
    pushAlert({
      priority: 0,
      variant: 'prestige',
      title: 'Singular Synthesis Ready',
      message:
        'Omega Sphere and 10^85 RP achieved. Tier III Prestige is now available.',
      autoDismissMs: 8000
    })
  }

  // Find the first locked feature whose conditions are satisfied
  let nextKey: FeatureKey | null = null
  for (const key of UNLOCK_ORDER) {
    if (state.unlocks[key]) continue
    if (UNLOCK_CONDITIONS[key](state)) {
      nextKey = key
      break
    }
  }

  if (!nextKey) return

  // Hold briefly if another unlock just fired
  if (
    lastUnlockTimestamp > 0 &&
    now - lastUnlockTimestamp < UNLOCK_STAGGER_MS
  ) {
    markUnlocksDirty()
    return
  }

  lastUnlockTimestamp = now

  useGameStore.setState((s) => ({
    unlocks: { ...s.unlocks, [nextKey!]: true }
  }))

  const unlockedTab = FEATURE_MAP[nextKey]?.workspaceTab
  if (unlockedTab) {
    useUIStore.getState().markTabUnseen(unlockedTab)
  }

  handleUnlockSideEffects(nextKey, state)

  if (!alertedThisSession.has(nextKey)) {
    alertedThisSession.add(nextKey)
    if (!(nextKey === 'techMatrix' && !state.tutorial.tutorialCompleted)) {
      const msg = UNLOCK_MESSAGES[nextKey]
      pushAlert({
        priority: 2,
        variant: 'unlock',
        title: msg.title,
        message: msg.message,
        autoDismissMs: 5000
      })
    }
  }

  // Re-mark dirty if another feature is also waiting in queue
  const hasMoreWaiting = UNLOCK_ORDER.some(
    (k) => k !== nextKey && !state.unlocks[k] && UNLOCK_CONDITIONS[k](state)
  )
  if (hasMoreWaiting) {
    markUnlocksDirty()
  }
}

// Side effects triggered when a specific feature first unlocks
function handleUnlockSideEffects(key: FeatureKey, _state: GameState): void {
  if (key !== 'achievements' && key !== 'prestige' && key !== 'relics') {
    dispatchFeatureUnlock(key)
  }

  switch (key) {
    case 'relics':
      awardRelic(1, true)
      break

    case 'prestige':
      // Prestige unlock triggers a high-priority Arkalon dialogue
      dispatchPrestigeAvailable(1)
      useUIStore.getState().pushAlert({
        priority: 0,
        variant: 'prestige',
        title: 'Saturation Threshold Reached',
        message:
          'The current construct has reached physical saturation. Reality Recalibration is now possible.',
        autoDismissMs: 8000
      })
      break

    default:
      break
  }
}

// Checks if research slot array needs expanding due to R3 or CF Deep Research Slots
export function checkResearchSlotExpansion(state: GameState): void {
  const needed = getActiveSlotCount(state)
  const current = state.activeResearchSlots.length

  if (needed <= current) return

  // Grow slot array to needed size, padding with empty slots
  useGameStore.setState((s) => {
    const newSlots = [...s.activeResearchSlots]
    while (newSlots.length < needed) {
      newSlots.push({ nodeId: null, timerRemaining: 0 })
    }
    return { activeResearchSlots: newSlots }
  })

  // Announce the new slot
  if (needed === 2) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Parallel Research Unlocked',
      message:
        'Node R3 complete. Two research projects can now run simultaneously from different branches.',
      autoDismissMs: 5000
    })
  } else if (needed === 3) {
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'unlock',
      title: 'Third Research Slot Unlocked',
      message:
        'Deep Research Slots active. A third parallel research project is now available.',
      autoDismissMs: 5000
    })
  }
}

// Tracks which era dialogue has already been announced this session
const announcedEras = new Set<number>()

// Announces Era threshold transitions
export function checkEraTransition(state: GameState): void {
  const pushAlert = useUIStore.getState().pushAlert

  for (const era of ERA_THRESHOLDS) {
    if (era.era <= 1) continue
    if (announcedEras.has(era.era)) continue
    if (state.lifetimePoints < era.threshold) continue

    announcedEras.add(era.era)

    dispatchEraTransition(era.era)

    pushAlert({
      priority: 2,
      variant: 'unlock',
      title: `Era ${era.era}: ${era.name}`,
      message: `Research output has reached a new dimensional threshold.`,
      autoDismissMs: 6000
    })
  }
}

let victoryTriggeredThisSession = false

// Fires once when both Trequinquagintillion (10^162 RP) and Node O10 are reached
export function checkEndgameVictory(state: GameState): void {
  const hasO10 =
    state.completedResearchNodes.includes('O10') ||
    Boolean(state.stats.o10EverCompleted)
  if (
    state.completedResearchNodes.includes('O10') &&
    !state.stats.o10EverCompleted
  ) {
    useGameStore.setState((s) => ({
      stats: { ...s.stats, o10EverCompleted: true }
    }))
  }

  if (victoryTriggeredThisSession) return
  if (state.tutorial.tutorialBeatsCompleted.includes('endgame_victory')) return
  if (state.lifetimePoints < 10n ** 162n) return
  if (!hasO10) return

  victoryTriggeredThisSession = true
  useGameStore.setState((s) => ({
    tutorial: {
      ...s.tutorial,
      tutorialBeatsCompleted: [
        ...s.tutorial.tutorialBeatsCompleted,
        'endgame_victory'
      ]
    }
  }))

  const challengeTiersCompleted = Object.values(state.challengeRecords).reduce(
    (sum, r) => sum + r.completedTiers,
    0
  )
  const challengeTiersTotal = CHALLENGE_DISPLAY.reduce(
    (sum, c) => sum + c.maxTiers,
    0
  )

  playSound('fanfare')
  useUIStore.getState().setVictoryPayload({
    lifetimePoints: state.lifetimePoints,
    totalPlaytimeSeconds: state.stats.totalSessionPlaytime,
    totalPrestiges:
      state.stats.totalPrestigesTier1 +
      state.stats.totalPrestigesTier2 +
      state.stats.totalPrestigesTier3,
    achievementsCount: state.achievements.length,
    relicsCount: state.unlockedRelics.length,
    dysonSwarmLevel: state.dysonSwarmLevel ?? 0,
    challengeTiersCompleted,
    challengeTiersTotal
  })
  useUIStore.getState().setVictoryModalOpen(true)
}

// Tutorial beat definitions
interface TutorialBeat {
  id: string
  // Returns true when this beat should fire
  condition: (state: GameState) => boolean
  // Target element ID to highlight (null = no highlight)
  highlightTarget: string | null
  // Dialogue trigger ID to push
  dialogueTriggerId: string
}

const TUTORIAL_BEATS: TutorialBeat[] = [
  // Step 1: Purchase first generator
  {
    id: 'boot',
    condition: (s) =>
      s.generators[0].quantity === 0n &&
      !s.tutorial.tutorialBeatsCompleted.includes('boot'),
    highlightTarget: 'generator-0-buy',
    dialogueTriggerId: 'boot'
  },
  // Step 2: Accumulate 10 desks to unlock Research
  {
    id: 'step_desks',
    condition: (s) =>
      s.generators[0].quantity >= 1n &&
      s.generators[0].quantity < 10n &&
      !s.tutorial.tutorialBeatsCompleted.includes('step_desks'),
    highlightTarget: null,
    dialogueTriggerId: 'step_desks'
  },
  // Step 3: Technology Matrix unlocks, guide player to Research tab
  {
    id: 'step_research',
    condition: (s) =>
      s.unlocks.techMatrix &&
      s.completedResearchNodes.length === 0 &&
      !s.tutorial.tutorialBeatsCompleted.includes('step_research'),
    highlightTarget: 'workspace-tab-research',
    dialogueTriggerId: 'step_research'
  },
  // Step 4: First research node complete, tutorial ends forever
  {
    id: 'tutorial_end',
    condition: (s) =>
      s.completedResearchNodes.length >= 1 && !s.tutorial.tutorialCompleted,
    highlightTarget: null,
    dialogueTriggerId: 'tutorial_complete'
  }
]

// Track which beats have been dispatched this session to avoid re-firing
const firedBeats = new Set<string>()

export function checkTutorialBeats(state: GameState): void {
  if (state.tutorial.tutorialCompleted) return
  if (useUIStore.getState().welcomeModalOpen) return

  const completedBeats = state.tutorial.tutorialBeatsCompleted

  let newBeat: string | null = null
  let newHighlight: string | null = null
  let newDialogueTrigger: string | null = null
  let completeTutorial = false

  for (const beat of TUTORIAL_BEATS) {
    if (completedBeats.includes(beat.id)) continue
    if (firedBeats.has(beat.id)) continue

    if (!beat.condition(state)) continue

    // This beat should fire
    newBeat = beat.id
    newHighlight = beat.highlightTarget

    newDialogueTrigger = beat.dialogueTriggerId

    if (beat.id === 'tutorial_end') {
      completeTutorial = true
      newHighlight = null
    }

    firedBeats.add(beat.id)
    break // Fire only one beat per tick
  }

  if (!newBeat) return

  // Update tutorial state
  useGameStore.setState((s) => ({
    tutorial: {
      ...s.tutorial,
      tutorialBeatsCompleted: [...s.tutorial.tutorialBeatsCompleted, newBeat!],
      tutorialHighlightTarget: newHighlight,
      tutorialCompleted: completeTutorial || s.tutorial.tutorialCompleted
    }
  }))

  // Push dialogue
  if (newDialogueTrigger) {
    dispatchTutorialBeat(newDialogueTrigger)
  }

  // Recap achievements earned silently during the tutorial once onboarding completes
  if (completeTutorial && state.achievements.length > 0) {
    const count = state.achievements.length
    useUIStore.getState().pushAlert({
      priority: 2,
      variant: 'achievement',
      title: 'Early Achievements Recorded',
      message: `${count} Achievement${count === 1 ? '' : 's'} active (+${count}% Global RP).`,
      autoDismissMs: 5000
    })
  }
}

// Tracks which achievements have already fired this session
const awardedThisSession = new Set<string>()

const MAJOR_ACHIEVEMENT_IDS = new Set([
  'research_all',
  'research_o10',
  'rp_1e155',
  'prestige_tier3',
  'relic_all',
  'challenge_all_standard',
  'challenge_ec4'
])

export function checkAchievements(state: GameState): void {
  const pushAlert = useUIStore.getState().pushAlert
  const newlyAwarded: typeof ACHIEVEMENTS = []

  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements.includes(achievement.id)) continue
    if (awardedThisSession.has(achievement.id)) continue
    if (!achievement.condition(state)) continue

    awardedThisSession.add(achievement.id)
    newlyAwarded.push(achievement)
  }

  if (newlyAwarded.length === 0) return

  useGameStore.setState((s) => ({
    achievements: [...s.achievements, ...newlyAwarded.map((a) => a.id)]
  }))

  if (!state.tutorial.tutorialCompleted) return

  const hasMajor = newlyAwarded.some((a) => MAJOR_ACHIEVEMENT_IDS.has(a.id))
  playSound(hasMajor ? 'fanfare' : 'success')

  if (newlyAwarded.length === 1) {
    const single = newlyAwarded[0]
    pushAlert({
      priority: 1,
      variant: 'achievement',
      title: `Achievement: ${single.name}`,
      message: single.description,
      autoDismissMs: 3500
    })
  } else {
    pushAlert({
      priority: 1,
      variant: 'achievement',
      title: `${newlyAwarded.length} Achievements Unlocked`,
      message: newlyAwarded.map((a) => a.name).join(', '),
      autoDismissMs: 5000
    })
  }
}
// Clears session-scoped announcement caches on hard reset / save import
export function resetUnlockSessionCaches(): void {
  alertedThisSession.clear()
  alertedTier2Available = false
  alertedTier3Available = false
  announcedEras.clear()
  firedBeats.clear()
  awardedThisSession.clear()
  victoryTriggeredThisSession = false
  lastUnlockTimestamp = 0
}
