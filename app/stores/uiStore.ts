import { create } from 'zustand'
import type { FacilityAlertPayload } from '@/types/alerts'
import type { BulkBuyAmount } from '@/constants/game'
import { WorkspaceTab } from '@/hooks/useActiveTab'

export interface ChallengeCompletePayload {
  challengeId: string
  name: string
  category: 'standard' | 'advanced' | 'extreme' | 'sandbox'
  tierCompleted: number
  maxTiers: number
  restrictionSummary: string
  rewardDescription: string
  arEarned: number
  targetReached: bigint
  durationSeconds: number
  runRestored: boolean
}

export interface VictoryPayload {
  lifetimePoints: bigint
  totalPlaytimeSeconds: number
  totalPrestiges: number
  achievementsCount: number
  relicsCount: number
  dysonSwarmLevel?: number
  challengeTiersCompleted?: number
  challengeTiersTotal?: number
}

interface UIStore {
  // Audio Settings
  musicEnabled: boolean
  musicVolume: number
  sfxEnabled: boolean
  sfxVolume: number

  // Facility Alert Queue - priority-ordered popup system
  alertQueue: FacilityAlertPayload[]
  activeAlert: FacilityAlertPayload | null

  // Arkalon terminal dialogue lines (shared between PC and mobile)
  terminalLines: string[]

  // Settings panel visibility
  settingsPanelOpen: boolean

  // Keybinds info modal visibility
  hotkeyModalOpen: boolean
  hotkeyFromSettings: boolean

  // Welcome modal
  welcomeModalOpen: boolean

  // Update modal
  updateModalOpen: boolean

  // Newer server build detected
  clientUpdateAvailable: boolean

  // Offline gains modal
  offlineModalOpen: boolean
  offlinePayload: import('@/types/offline').OfflineProgressPayload | null

  // Challenge completion modal
  challengeCompleteModalOpen: boolean
  challengeCompletePayload: ChallengeCompletePayload | null

  // Endgame victory modal (10^162 RP + Node O10)
  victoryModalOpen: boolean
  victoryPayload: VictoryPayload | null

  // Arkalon sphere prestige animation trigger
  prestigeAnimating: boolean

  // Selected generator bulk purchase mode
  bulkAmount: BulkBuyAmount

  // Selected generator module purchase mode
  moduleBulkAmount: 1 | 'max'

  // Generator list sort order
  generatorSort: 'tier_asc' | 'tier_desc' | 'yield_desc'

  // Auto-prestige live countdown state
  autoPrestigePendingTier: 0 | 1 | 2 | 3
  autoPrestigeCountdown: number

  // Newly unlocked workspace tabs not yet opened by the player
  unseenUnlockedTabs: WorkspaceTab[]

  // Master Core Identity nickname synced from Network Hub
  playerName: string | null
  setPlayerName: (name: string | null) => void

  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setSfxEnabled: (enabled: boolean) => void
  setSfxVolume: (volume: number) => void

  pushAlert: (alert: Omit<FacilityAlertPayload, 'id'>) => void
  dismissAlert: () => void
  pushTerminalLine: (text: string) => void
  setSettingsPanelOpen: (open: boolean) => void
  setHotkeyModalOpen: (open: boolean, fromSettings?: boolean) => void
  setWelcomeModalOpen: (open: boolean) => void
  setUpdateModalOpen: (open: boolean) => void
  setClientUpdateAvailable: (available: boolean) => void
  setOfflineModalOpen: (open: boolean) => void
  setOfflinePayload: (
    payload: import('@/types/offline').OfflineProgressPayload | null
  ) => void
  setChallengeCompleteModalOpen: (open: boolean) => void
  setChallengeCompletePayload: (
    payload: ChallengeCompletePayload | null
  ) => void
  setVictoryModalOpen: (open: boolean) => void
  setVictoryPayload: (payload: VictoryPayload | null) => void
  triggerPrestigeAnimation: () => void
  setBulkAmount: (amount: BulkBuyAmount) => void
  setModuleBulkAmount: (amount: 1 | 'max') => void
  setGeneratorSort: (sort: 'tier_asc' | 'tier_desc' | 'yield_desc') => void
  cycleGeneratorSort: () => void
  setAutoPrestigePending: (tier: 0 | 1 | 2 | 3, countdown: number) => void
  markTabUnseen: (tab: WorkspaceTab) => void
  clearTabUnseen: (tab: WorkspaceTab) => void
}

let alertIdCounter = 0

export const useUIStore = create<UIStore>((set, get) => ({
  musicEnabled: true,
  musicVolume: 0.4,
  sfxEnabled: true,
  sfxVolume: 0.6,

  alertQueue: [],
  activeAlert: null,
  terminalLines: [],
  settingsPanelOpen: false,
  hotkeyModalOpen: false,
  hotkeyFromSettings: false,
  welcomeModalOpen: false,
  updateModalOpen: false,
  clientUpdateAvailable: false,
  offlineModalOpen: false,
  offlinePayload: null,
  challengeCompleteModalOpen: false,
  challengeCompletePayload: null,
  victoryModalOpen: false,
  victoryPayload: null,
  prestigeAnimating: false,
  bulkAmount: 1,
  moduleBulkAmount: 1,
  generatorSort: 'tier_asc',
  autoPrestigePendingTier: 0,
  autoPrestigeCountdown: 0,
  unseenUnlockedTabs: [],
  playerName: null,
  setPlayerName: (playerName) => set({ playerName }),

  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
  setMusicVolume: (musicVolume) =>
    set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
  setSfxEnabled: (sfxEnabled) => set({ sfxEnabled }),
  setSfxVolume: (sfxVolume) =>
    set({ sfxVolume: Math.max(0, Math.min(1, sfxVolume)) }),

  pushAlert: (alert) => {
    const { activeAlert, alertQueue } = get()

    // Deduplicate alerts by title and message content to prevent notification spam
    const isDuplicate =
      (activeAlert?.title === alert.title &&
        activeAlert?.message === alert.message) ||
      alertQueue.some(
        (a) => a.title === alert.title && a.message === alert.message
      )
    if (isDuplicate) return

    const id = `alert-${++alertIdCounter}`
    const payload: FacilityAlertPayload = { ...alert, id }

    if (!activeAlert) {
      set({ activeAlert: payload })
    } else if (payload.priority < activeAlert.priority) {
      const newQueue = [activeAlert, ...alertQueue].sort(
        (a, b) => a.priority - b.priority
      )
      set({ activeAlert: payload, alertQueue: newQueue })
    } else {
      const newQueue = [...alertQueue, payload].sort(
        (a, b) => a.priority - b.priority
      )
      set({ alertQueue: newQueue })
    }
  },

  dismissAlert: () => {
    const { alertQueue } = get()
    if (alertQueue.length > 0) {
      const [next, ...rest] = alertQueue
      set({ activeAlert: next, alertQueue: rest })
    } else {
      set({ activeAlert: null })
    }
  },

  pushTerminalLine: (text) =>
    set((s) => {
      const next = [...s.terminalLines, text]
      return { terminalLines: next.length > 20 ? next.slice(-20) : next }
    }),

  setSettingsPanelOpen: (settingsPanelOpen) => set({ settingsPanelOpen }),
  setHotkeyModalOpen: (hotkeyModalOpen, fromSettings = false) =>
    set({
      hotkeyModalOpen,
      hotkeyFromSettings: hotkeyModalOpen ? fromSettings : false
    }),
  setWelcomeModalOpen: (welcomeModalOpen) => set({ welcomeModalOpen }),
  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),
  setClientUpdateAvailable: (clientUpdateAvailable) =>
    set({ clientUpdateAvailable }),
  setOfflineModalOpen: (offlineModalOpen) => set({ offlineModalOpen }),
  setOfflinePayload: (offlinePayload) => set({ offlinePayload }),
  setChallengeCompleteModalOpen: (challengeCompleteModalOpen) =>
    set({ challengeCompleteModalOpen }),
  setChallengeCompletePayload: (challengeCompletePayload) =>
    set({ challengeCompletePayload }),
  setVictoryModalOpen: (victoryModalOpen) => set({ victoryModalOpen }),
  setVictoryPayload: (victoryPayload) => set({ victoryPayload }),

  triggerPrestigeAnimation: () => {
    set({ prestigeAnimating: true })
    setTimeout(() => set({ prestigeAnimating: false }), 2000)
  },

  setBulkAmount: (bulkAmount) => set({ bulkAmount }),

  setModuleBulkAmount: (moduleBulkAmount) => set({ moduleBulkAmount }),

  setGeneratorSort: (generatorSort) => {
    try {
      localStorage.setItem('arkalon_labs_gen_sort', generatorSort)
    } catch {}
    set({ generatorSort })
  },

  cycleGeneratorSort: () => {
    const cur = get().generatorSort
    const next =
      cur === 'tier_asc'
        ? 'tier_desc'
        : cur === 'tier_desc'
          ? 'yield_desc'
          : 'tier_asc'
    try {
      localStorage.setItem('arkalon_labs_gen_sort', next)
    } catch {}
    set({ generatorSort: next })
  },

  setAutoPrestigePending: (autoPrestigePendingTier, autoPrestigeCountdown) =>
    set({ autoPrestigePendingTier, autoPrestigeCountdown }),

  markTabUnseen: (tab) =>
    set((s) =>
      s.unseenUnlockedTabs.includes(tab)
        ? s
        : { unseenUnlockedTabs: [...s.unseenUnlockedTabs, tab] }
    ),

  clearTabUnseen: (tab) =>
    set((s) =>
      s.unseenUnlockedTabs.includes(tab)
        ? {
            unseenUnlockedTabs: s.unseenUnlockedTabs.filter((t) => t !== tab)
          }
        : s
    )
}))
