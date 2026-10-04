import { create } from 'zustand'
import type { FacilityAlertPayload } from '@/types/alerts'

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

  // Welcome modal
  welcomeModalOpen: boolean

  // Update modal
  updateModalOpen: boolean

  // Arkalon sphere prestige animation trigger
  prestigeAnimating: boolean

  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setSfxEnabled: (enabled: boolean) => void
  setSfxVolume: (volume: number) => void

  pushAlert: (alert: Omit<FacilityAlertPayload, 'id'>) => void
  dismissAlert: () => void
  pushTerminalLine: (text: string) => void
  setSettingsPanelOpen: (open: boolean) => void
  setWelcomeModalOpen: (open: boolean) => void
  setUpdateModalOpen: (open: boolean) => void
  triggerPrestigeAnimation: () => void
}

let alertIdCounter = 0

export const useUIStore = create<UIStore>((set, get) => ({
  musicEnabled: true,
  musicVolume: 0.4,
  sfxEnabled: true,
  sfxVolume: 0.6,

  alertQueue: [],
  activeAlert: null,
  terminalLines: ['System check complete. Core online.'],
  settingsPanelOpen: false,
  welcomeModalOpen: false,
  updateModalOpen: false,
  prestigeAnimating: false,

  setMusicEnabled: (musicEnabled) => set({ musicEnabled }),
  setMusicVolume: (musicVolume) =>
    set({ musicVolume: Math.max(0, Math.min(1, musicVolume)) }),
  setSfxEnabled: (sfxEnabled) => set({ sfxEnabled }),
  setSfxVolume: (sfxVolume) =>
    set({ sfxVolume: Math.max(0, Math.min(1, sfxVolume)) }),

  pushAlert: (alert) => {
    const id = `alert-${++alertIdCounter}`
    const payload: FacilityAlertPayload = { ...alert, id }
    const { activeAlert, alertQueue } = get()

    // Deduplicate alerts to prevent UI spam
    if (activeAlert?.id === id || alertQueue.some((a) => a.id === id)) return

    if (!activeAlert) {
      set({ activeAlert: payload })
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
  setWelcomeModalOpen: (welcomeModalOpen) => set({ welcomeModalOpen }),
  setUpdateModalOpen: (open) => set({ updateModalOpen: open }),

  triggerPrestigeAnimation: () => {
    set({ prestigeAnimating: true })
    setTimeout(() => set({ prestigeAnimating: false }), 2000)
  }
}))
