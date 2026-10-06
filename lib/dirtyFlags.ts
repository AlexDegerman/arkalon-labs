// Shared dirty flags for deferred per-tick checks
// Kept in a separate module to avoid circular imports between
// app/stores/actions/* and any module that needs to signal a re-check

let _unlocksDirty = false
let _tutorialDirty = true
let _achievementsDirty = false

export function markUnlocksDirty(): void {
  _unlocksDirty = true
}
export function markTutorialDirty(): void {
  _tutorialDirty = true
}
export function markAchievementsDirty(): void {
  _achievementsDirty = true
}

export function consumeUnlocksDirty(): boolean {
  const v = _unlocksDirty
  _unlocksDirty = false
  return v
}
export function consumeTutorialDirty(): boolean {
  const v = _tutorialDirty
  _tutorialDirty = false
  return v
}
export function consumeAchievementsDirty(): boolean {
  const v = _achievementsDirty
  _achievementsDirty = false
  return v
}
