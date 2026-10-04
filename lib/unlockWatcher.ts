import type { GameState } from '@/types/game'
import type { FeatureKey } from '@/lib/featureRegistry'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { getActiveSlotCount } from './researchNodes'
import { ERA_THRESHOLDS } from '@/constants/game'
import { dispatchEraTransition, dispatchTutorialBeat } from './dialogueDispatcher'
import { ANOMALY_DIALOGUE_MAP } from './arkalonDialogue'
import { ACHIEVEMENTS } from './achievementDefs'

// Unlock condition evaluators - each returns true when the feature should unlock
const UNLOCK_CONDITIONS: Record<FeatureKey, (s: GameState) => boolean> = {
  techMatrix: (s) => s.generators[0].quantity >= 10n,

  statistics: (s) => s.lifetimePoints >= 1_000n,

  modules: (s) => s.generators[1].quantity >= 1n,

  anomalies: (s) =>
    s.completedResearchNodes.some((id) =>
      ['C1', 'E1', 'R1', 'O1'].includes(id)
    ),

  interactiveArkalon: (s) => s.completedResearchNodes.includes('O1'),

  achievements: (s) =>
    s.stats.totalSessionPlaytime >= 300 || (s.achievements?.length ?? 0) > 0,

  relics: (s) =>
    s.stats.totalAnomaliesResolved > 0 ||
    s.completedResearchNodes.includes('O1'),

  excavation: (s) => s.generators[2].quantity >= 5n,

  prestige: (s) => s.lifetimePoints >= 1_000_000_000n,

  megaprojects: (s) =>
    s.lifetimePoints >= 1_000_000_000n && s.generators[4].quantity >= 10n,

  anomalousOperations: (s) => s.stats.totalPrestigesTier1 > 0
}

// Alert messages shown when a feature first unlocks
const UNLOCK_MESSAGES: Record<FeatureKey, { title: string; message: string }> =
  {
    techMatrix: {
      title: 'Technology Matrix Online',
      message:
        'Research nodes now available. Study them to permanently alter facility rules.'
    },
    statistics: {
      title: 'Statistics Panel Active',
      message: 'Historical operational data is now being recorded.'
    },
    modules: {
      title: 'Generator Modules Available',
      message: 'Install specialized modules to compound generator efficiency.'
    },
    anomalies: {
      title: 'Anomalous Readings Detected',
      message:
        'Spatial distortions will emerge at irregular intervals. Stabilize them for rewards.'
    },
    interactiveArkalon: {
      title: 'Arkalon Interface Active',
      message:
        'The core sphere is now interactive. Click it to boost research speed.'
    },
    achievements: {
      title: 'Achievement Tracking Active',
      message: 'Operational excellence is now being monitored.'
    },
    relics: {
      title: 'Relics & Artifacts Unlocked',
      message:
        'Relic 1 has been awarded. Equip it to begin passive amplification.'
    },
    excavation: {
      title: 'Excavation Terminal Online',
      message: 'Sub-space probe deployment is now available.'
    },
    prestige: {
      title: 'Reality Recalibration Available',
      message:
        'The construct has reached saturation. Timeline collapse is possible.'
    },
    megaprojects: {
      title: 'Megaproject Bay Unlocked',
      message:
        'Allocate passive generation to construct permanent simulation structures.'
    },
    anomalousOperations: {
      title: 'Anomalous Operations Active',
      message:
        'Global operation cycle has begun. Join the 90-day anomaly campaign.'
    }
  }

// Tracks which features have already fired their unlock alert this session
// to avoid re-alerting on every tick after unlock
const alertedThisSession = new Set<FeatureKey>()

// Called inside the tick loop when the dirty flag is set
// Evaluates all 11 unlock conditions and sets flags on state transitions
export function checkUnlocks(state: GameState): void {
  const store = useGameStore.getState()
  const pushAlert = useUIStore.getState().pushAlert

  const keysToCheck = Object.keys(UNLOCK_CONDITIONS) as FeatureKey[]
  const newUnlocks: Partial<Record<FeatureKey, boolean>> = {}
  let anyChanged = false

  for (const key of keysToCheck) {
    // Already unlocked - skip evaluation
    if (state.unlocks[key]) continue

    const shouldUnlock = UNLOCK_CONDITIONS[key](state)
    if (!shouldUnlock) continue

    newUnlocks[key] = true
    anyChanged = true

    // Fire unlock side effects
    handleUnlockSideEffects(key, state)

    // Push alert (once per session per feature)
    if (!alertedThisSession.has(key)) {
      alertedThisSession.add(key)
      const msg = UNLOCK_MESSAGES[key]
      pushAlert({
        priority: 2,
        variant: 'unlock',
        title: msg.title,
        message: msg.message,
        autoDismissMs: 5000
      })
    }
  }

  if (!anyChanged) return

  // Apply all new unlock flags in a single setState
  useGameStore.setState((s) => ({
    unlocks: { ...s.unlocks, ...newUnlocks }
  }))
}

// Side effects triggered when a specific feature first unlocks
function handleUnlockSideEffects(key: FeatureKey, state: GameState): void {
  switch (key) {
    case 'relics':
      // Award Relic 1 (Arkalon's Left Eye) if not already unlocked
      if (!state.unlockedRelics.includes(1)) {
        useGameStore.setState((s) => ({
          unlockedRelics: [...s.unlockedRelics, 1],
          relicLevels: { ...s.relicLevels, 1: 1 },
        }))
      }
      break

    case 'prestige':
      // Prestige unlock triggers a high-priority Arkalon dialogue
      useUIStore.getState().pushAlert({
        priority: 0,
        variant: 'prestige',
        title: 'Saturation Threshold Reached',
        message:
          'The current construct has reached physical saturation. Reality Recalibration is now possible.',
        autoDismissMs: 8000,
      })
      break

    default:
      break
  }
}

// Checks if research slot array needs expanding due to R3 or CF Deep Research Slots
// Called from checkResearchSlotExpansion after each research completion
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

// Called by era progression checks
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
  {
    id: 'boot',
    condition: (s) =>
      s.lifetimePoints === 0n &&
      s.researchPoints <= 15n &&
      !s.tutorial.tutorialBeatsCompleted.includes('boot'),
    highlightTarget: 'generator-0-buy',
    dialogueTriggerId: 'boot',
  },
  {
    id: 'first_buy',
    condition: (s) =>
      s.generators[0].quantity >= 1n &&
      !s.tutorial.tutorialBeatsCompleted.includes('first_buy'),
    highlightTarget: 'rp-banner',
    dialogueTriggerId: 'first_buy',
  },
  {
    id: 'tech_preview',
    condition: (s) =>
      s.generators[0].quantity >= 7n &&
      s.generators[0].quantity < 10n &&
      !s.unlocks.techMatrix &&
      !s.tutorial.tutorialBeatsCompleted.includes('tech_preview'),
    highlightTarget: 'workspace-tab-research',
    dialogueTriggerId: 'tech_preview',
  },
  {
    id: 'tech_unlock',
    condition: (s) =>
      s.unlocks.techMatrix &&
      !s.tutorial.tutorialBeatsCompleted.includes('tech_unlock'),
    highlightTarget: 'workspace-tab-research',
    dialogueTriggerId: 'tech_unlock',
  },
  {
    id: 'first_research',
    condition: (s) =>
      s.activeResearchSlots.some((slot) => slot.nodeId !== null) &&
      !s.tutorial.tutorialBeatsCompleted.includes('first_research'),
    highlightTarget: 'research-active-slot',
    dialogueTriggerId: 'first_research',
  },
  {
    id: 'first_complete',
    condition: (s) =>
      s.completedResearchNodes.length >= 1 &&
      !s.tutorial.tutorialBeatsCompleted.includes('first_complete'),
    highlightTarget: 'research-queue',
    dialogueTriggerId: 'first_complete',
  },
  {
    id: 'stats_unlock',
    condition: (s) =>
      s.unlocks.statistics &&
      !s.tutorial.tutorialBeatsCompleted.includes('stats_unlock'),
    highlightTarget: 'workspace-tab-stats',
    dialogueTriggerId: 'stats_unlock',
  },
  {
    id: 'modules_unlock',
    condition: (s) =>
      s.unlocks.modules &&
      !s.tutorial.tutorialBeatsCompleted.includes('modules_unlock'),
    highlightTarget: 'workspace-tab-modules',
    dialogueTriggerId: 'modules_unlock',
  },
  {
    id: 'anomaly_unlock',
    condition: (s) =>
      s.unlocks.anomalies &&
      !s.tutorial.tutorialBeatsCompleted.includes('anomaly_unlock'),
    highlightTarget: 'anomaly-bar',
    dialogueTriggerId: 'anomaly_unlock',
  },
  {
    id: 'first_anomaly',
    condition: (s) =>
      s.activeAnomalyType !== null &&
      !s.tutorial.tutorialBeatsCompleted.includes('first_anomaly'),
    highlightTarget: 'anomaly-overlay',
    dialogueTriggerId: 'anomaly_quantum_surge', // contextual per type handled below
  },
  {
    id: 'tutorial_end',
    condition: (s) =>
      !s.tutorial.tutorialCompleted &&
      s.stats.totalSessionPlaytime >= 300 &&
      s.tutorial.tutorialBeatsCompleted.length >= 8,
    highlightTarget: null,
    dialogueTriggerId: 'tutorial_complete',
  },
]

// Track which beats have been dispatched this session to avoid re-firing
const firedBeats = new Set<string>()

export function checkTutorialBeats(state: GameState): void {
  if (state.tutorial.tutorialCompleted) return

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

    // For first_anomaly, use the active anomaly type's dialogue
    if (beat.id === 'first_anomaly' && state.activeAnomalyType) {
      newDialogueTrigger =
        ANOMALY_DIALOGUE_MAP[state.activeAnomalyType] ??
        beat.dialogueTriggerId
    } else {
      newDialogueTrigger = beat.dialogueTriggerId
    }

    if (beat.id === 'tutorial_end') {
      completeTutorial = true
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
      tutorialCompleted: completeTutorial || s.tutorial.tutorialCompleted,
    },
  }))

  // Push dialogue
  if (newDialogueTrigger) {
    dispatchTutorialBeat(newDialogueTrigger)
  }

  // Clear highlight after 8 seconds
  if (newHighlight) {
    setTimeout(() => {
      useGameStore.setState((s) => {
        // Only clear if still pointing at the same target
        if (s.tutorial.tutorialHighlightTarget === newHighlight) {
          return {
            tutorial: { ...s.tutorial, tutorialHighlightTarget: null },
          }
        }
        return {}
      })
    }, 8000)
  }
}

// Tracks which achievements have already fired this session
const awardedThisSession = new Set<string>()

export function checkAchievements(state: GameState): void {
  const pushAlert = useUIStore.getState().pushAlert

  for (const achievement of ACHIEVEMENTS) {
    if (state.achievements.includes(achievement.id)) continue
    if (awardedThisSession.has(achievement.id)) continue
    if (!achievement.condition(state)) continue

    awardedThisSession.add(achievement.id)

    useGameStore.setState((s) => ({
      achievements: [...s.achievements, achievement.id],
    }))

    pushAlert({
      priority: 3,
      variant: 'achievement',
      title: `Achievement: ${achievement.name}`,
      message: achievement.description,
      autoDismissMs: 5000,
    })
  }
}
