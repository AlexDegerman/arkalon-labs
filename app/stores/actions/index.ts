'use client'

// Public game action API - domain modules live alongside this barrel
export { tick } from './tickActions'
export {
  startResearch,
  queueResearch,
  dequeueResearch,
  reorderQueue,
  applyArkalonClickBoost
} from './researchActions'
export {
  checkAnomalySpawn,
  resolveAnomaly,
  dismissAnomaly,
  updateAnomalyInteraction
} from './anomalyActions'
export { equipRelic, unequipRelic, upgradeRelic } from './relicActions'
export {
  triggerTierI,
  triggerTierII,
  triggerTierIII,
  buyPrestigeUpgrade
} from './prestigeActions'
export {
  buildProbe,
  launchProbe,
  processProbeCompletions
} from './excavationActions'
export {
  activateMegaproject,
  setMegaprojectAllocation,
  deactivateMegaproject,
  checkMegaprojectCompletion
} from './megaprojectActions'
export {
  enterChallenge,
  exitChallenge,
  checkChallengeCompletion
} from './challengeActions'
export { tickAutomation } from './automationActions'
export {
  earnOperationPoints,
  buyOperationArtifact,
  checkOperationCycle
} from './operationActions'
export { buyGenerator, buyModule } from './generatorActions'
export {
  markUnlocksDirty,
  markTutorialDirty,
  markAchievementsDirty
} from '@/lib/dirtyFlags'
