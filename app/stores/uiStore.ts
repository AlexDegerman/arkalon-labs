import { create } from 'zustand'
import type { FacilityAlertPayload } from '@/types/alerts'

interface UIStore {
  // Audio Settings
  musicEnabled: boolean
  musicVolume: number
  sfxEnabled: boolean
  sfxVolume: number

  // Facility Alert Queue
  alertQueue: FacilityAlertPayload[]
  activeAlert: FacilityAlertPayload | null

  // Modals & Panels
  settingsPanelOpen: boolean
  welcomeModalOpen: boolean
  updateModalOpen: boolean
  updateModalVersion: string

  setMusicEnabled: (enabled: boolean) => void
  setMusicVolume: (volume: number) => void
  setSfxEnabled: (enabled: boolean) => void
  setSfxVolume: (volume: number) => void

  pushAlert: (alert: Omit<FacilityAlertPayload, 'id'>) => void
  dismissAlert: () => void
  setSettingsPanelOpen: (open: boolean) => void
  setWelcomeModalOpen: (open: boolean) => void
  setUpdateModalOpen: (open: boolean, version?: string) => void
}

let alertIdCounter = 0

export const useUIStore = create<UIStore>((set, get) => ({
  musicEnabled: true,
  musicVolume: 0.4,
  sfxEnabled: true,
  sfxVolume: 0.6,

  alertQueue: [],
  activeAlert: null,
  settingsPanelOpen: false,
  welcomeModalOpen: false,
  updateModalOpen: false,
  updateModalVersion: '',

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

  setSettingsPanelOpen: (settingsPanelOpen) => set({ settingsPanelOpen }),
  setWelcomeModalOpen: (welcomeModalOpen) => set({ welcomeModalOpen }),
  setUpdateModalOpen: (open, version = '') =>
    set({ updateModalOpen: open, updateModalVersion: version })
}))
