// Centralized dialogue event dispatcher
// Maps game events to Arkalon dialogue trigger IDs
// Called from app/stores/actions/* and unlockWatcher.ts to push lines to uiStore

import { useGameStore } from '@/app/stores/gameStore'
import { useMusicStore } from '@/app/stores/musicStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  ANOMALY_DIALOGUE_MAP,
  getDialogue,
  getNextClickResponseId
} from '@/lib/arkalonDialogue'
import { cancelArkalonSpeech, speakArkalon } from './arkalonTTS'

// Generator index to unlock trigger mapping
const GENERATOR_UNLOCK_TRIGGERS: Record<number, string> = {
  1: 'unlock_server_cluster',
  2: 'unlock_quantum_computer',
  3: 'unlock_neural_core',
  4: 'unlock_reality_engine',
  5: 'unlock_singularity_reactor',
  6: 'unlock_arkalon_interface',
  7: 'unlock_infinite_simulation',
  8: 'unlock_universal_constructor',
  9: 'unlock_existence_compiler',
  10: 'unlock_dimensional_folder',
  11: 'unlock_chronos_synchronizer',
  12: 'unlock_vacuum_fluctuator',
  13: 'unlock_dark_matter_synthesizer',
  14: 'unlock_stellar_harvester',
  15: 'unlock_galactic_engine',
  16: 'unlock_multiversal_conduit',
  17: 'unlock_planck_epoch_projector',
  18: 'unlock_chaos_weaver',
  19: 'unlock_absolute_void_compressor'
}

// Research node completion triggers
const RESEARCH_COMPLETE_TRIGGERS: Record<string, string> = {
  C1: 'research_c1_complete',
  R2: 'research_r2_complete',
  R3: 'research_r3_complete',
  O1: 'research_o1_complete',
  O10: 'research_o10_complete'
}

// Megaproject completion triggers
const MEGAPROJECT_COMPLETE_TRIGGERS: Record<string, string> = {
  chronos_array: 'megaproject_chronos_array_complete',
  arkalon_matrix_mirror: 'megaproject_arkalon_matrix_mirror_complete',
  omega_singularity_sphere: 'megaproject_omega_sphere_complete'
}

// Challenge enter triggers
const CHALLENGE_ENTER_TRIGGERS: Record<string, string> = {
  SC1: 'challenge_entered_sc1',
  SC2: 'challenge_entered_sc2',
  AC1: 'challenge_entered_ac1',
  EC4: 'challenge_entered_ec4'
}

// Era transition triggers
const ERA_TRIGGERS: Record<number, string> = {
  2: 'era_transition_2',
  3: 'era_transition_3',
  4: 'era_transition_4',
  5: 'era_transition_5',
  6: 'era_transition_6',
  7: 'era_transition_7'
}

// Pushes a dialogue line to the UI store terminal
function pushLine(triggerId: string): void {
  const text = getDialogue(triggerId)
  if (!text) return
  useUIStore.getState().pushTerminalLine(text)
  const { muted, volumeVoice } = useMusicStore.getState()
  const voiceEnabled = useGameStore.getState().settings.voiceEnabled
  if (!muted && voiceEnabled) speakArkalon(text, volumeVoice)
}

// Exported dispatch functions called from game systems

export function dispatchGeneratorUnlock(generatorIndex: number): void {
  const triggerId = GENERATOR_UNLOCK_TRIGGERS[generatorIndex]
  if (triggerId) pushLine(triggerId)
}

export function dispatchResearchComplete(nodeId: string): void {
  const triggerId = RESEARCH_COMPLETE_TRIGGERS[nodeId]
  if (triggerId) pushLine(triggerId)
}

export function dispatchMegaprojectComplete(megaprojectId: string): void {
  const triggerId = MEGAPROJECT_COMPLETE_TRIGGERS[megaprojectId]
  if (triggerId) pushLine(triggerId)
}

export function dispatchChallengeEnter(challengeId: string): void {
  const triggerId = CHALLENGE_ENTER_TRIGGERS[challengeId]
  if (triggerId) pushLine(triggerId)
}

export function dispatchChallengeComplete(): void {
  pushLine('challenge_complete')
}

export function dispatchChallengeFailed(): void {
  pushLine('challenge_failed')
}

export function dispatchEraTransition(era: number): void {
  const triggerId = ERA_TRIGGERS[era]
  if (triggerId) pushLine(triggerId)
}

export function dispatchPrestigeAvailable(tier: 1 | 2 | 3): void {
  if (tier === 1) pushLine('first_prestige_available')
  else if (tier === 2) pushLine('prestige_tier2_available')
  else pushLine('prestige_tier3_available')
}

export function dispatchPrestigeComplete(tier: 1 | 2 | 3): void {
  if (tier === 1) pushLine('prestige_tier1')
  else if (tier === 2) pushLine('prestige_tier2')
  else pushLine('prestige_tier3')
}

export function dispatchAnomalyResolved(): void {
  pushLine('anomaly_resolved_partial')
}

export function dispatchRelicDiscovered(): void {
  pushLine('relic_discovered')
}

export function dispatchFeatureUnlock(key: string): void {
  const triggerMap: Record<string, string> = {
    techMatrix: 'unlock_tech_matrix',
    statistics: 'stats_unlock',
    modules: 'modules_unlock',
    anomalies: 'anomaly_unlock',
    relics: 'unlock_relics',
    excavation: 'unlock_excavation',
    megaprojects: 'unlock_megaprojects',
    anomalousOperations: 'unlock_operations',
    challenges: 'unlock_challenges'
  }
  const triggerId = triggerMap[key]
  if (triggerId) pushLine(triggerId)
}

export function dispatchAnomalySpawn(type: string): void {
  const triggerId = ANOMALY_DIALOGUE_MAP[type]
  if (triggerId) pushLine(triggerId)
}

export function dispatchAnomalyIncoming(): void {
  pushLine('anomaly_incoming')
}

export function dispatchOperationStart(): void {
  pushLine('operation_started')
}
export function dispatchOperationArtifact(): void {
  pushLine('operation_artifact_acquired')
}

let lastCoreClickDialogueTime = 0
const CORE_CLICK_DIALOGUE_COOLDOWN_MS = 3500

export function dispatchArkalonClick(): void {
  const now = Date.now()
  if (now - lastCoreClickDialogueTime < CORE_CLICK_DIALOGUE_COOLDOWN_MS) return
  lastCoreClickDialogueTime = now
  const triggerId = getNextClickResponseId()
  pushLine(triggerId)
}

export function dispatchTabInactive(durationSeconds: number): void {
  if (durationSeconds > 1800) {
    pushLine('tab_inactive_long')
  } else {
    pushLine('tab_inactive_short')
  }
}

const DIRECTIVE_SUMMARIES: Record<string, string> = {
  boot: 'Buy your first Research Desk in Facility Equipment.',
  step_desks: 'Reach 10 Research Desks to unlock Research.',
  step_research:
    'Open Research in the Facility Directory and study your first node.',
  tutorial_complete: 'Onboarding complete. Expand your facility.'
}

export function dispatchTutorialBeat(beatId: string): void {
  const triggerId = beatId
  const text = getDialogue(triggerId)
  if (!text) return

  // Cut off previous speech and dismiss previous tutorial alert
  cancelArkalonSpeech()
  const ui = useUIStore.getState()

  useUIStore.getState().pushTerminalLine(text)
  const { muted, volumeVoice } = useMusicStore.getState()
  const voiceEnabled = useGameStore.getState().settings.voiceEnabled
  if (!muted && voiceEnabled) speakArkalon(text, volumeVoice, true)

  // Actionable steps stick, feature advisories auto-dismiss, tutorial_end dismisses
  const isAdvisory = [
    'stats_unlock',
    'modules_unlock',
    'anomaly_unlock',
    'tutorial_complete'
  ].includes(beatId)

  if (beatId === 'tutorial_complete') {
    const cleanedQueue = ui.alertQueue.filter((a) => a.variant !== 'arkalon')
    const prevQueue =
      ui.activeAlert && ui.activeAlert.variant !== 'arkalon'
        ? [ui.activeAlert, ...cleanedQueue]
        : cleanedQueue

    useUIStore.setState({
      activeAlert: {
        id: 'alert-tutorial-complete',
        priority: 0,
        variant: 'unlock',
        title: 'Facility Online',
        message: DIRECTIVE_SUMMARIES[beatId] ?? text,
        autoDismissMs: 5000
      },
      alertQueue: prevQueue
    })
  } else {
    if (ui.activeAlert?.variant === 'arkalon') {
      ui.dismissAlert()
    }
    ui.pushAlert({
      priority: 4,
      variant: 'arkalon',
      title: isAdvisory ? 'Facility Advisory' : 'Primary Directive',
      message: DIRECTIVE_SUMMARIES[beatId] ?? text,
      autoDismissMs: isAdvisory ? 8000 : 0
    })
  }
}