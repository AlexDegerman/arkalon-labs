// Audio asset paths for SFX and BGM
// All paths relative to /public/sounds/ and /public/music/

export const SFX_ASSETS = {
  buyGenerator: '/sounds/buy-generator.mp3',
  buyModule: '/sounds/buy-module.mp3',
  researchComplete: '/sounds/research-complete.mp3',
  anomalySpawn: '/sounds/anomaly-spawn.mp3',
  anomalyResolve: '/sounds/anomaly-resolve.mp3',
  prestigeReset: '/sounds/prestige-reset.mp3',
  achievementUnlock: '/sounds/achievement-unlock.mp3',
  relicEquip: '/sounds/relic-equip.mp3',
  megaprojectComplete: '/sounds/megaproject-complete.mp3',
  unlockFeature: '/sounds/unlock-feature.mp3',
  probeReturn: '/sounds/probe-return.mp3',
  arkalonClick: '/sounds/arkalon-click.mp3',
  challengeEnter: '/sounds/challenge-enter.mp3',
  challengeComplete: '/sounds/challenge-complete.mp3'
} as const

export const BGM_ASSETS = {
  idle: '/music/bgm-idle.mp3',
  anomaly: '/music/bgm-anomaly.mp3',
  prestige: '/music/bgm-prestige.mp3',
  operation: '/music/bgm-operation.mp3'
} as const

export type SFXAssetKey = keyof typeof SFX_ASSETS
export type BGMAssetKey = keyof typeof BGM_ASSETS
