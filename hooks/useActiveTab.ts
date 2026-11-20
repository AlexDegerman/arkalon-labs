'use client'

import { useUIStore } from '@/app/stores/uiStore'
import { create } from 'zustand'

export type MobileTab = 'lab' | 'arkalon' | 'research' | 'relics' | 'more'
export type EquipmentTab = 'generators' | 'synthesizers'
export type WorkspaceTab =
  | 'directory'
  | 'research'
  | 'prestige'
  | 'modules'
  | 'relics'
  | 'excavation'
  | 'megaprojects'
  | 'operations'
  | 'stats'
  | 'challenges'
  | 'achievements'

interface ActiveTabStore {
  mobileTab: MobileTab
  equipmentTab: EquipmentTab
  workspaceTab: WorkspaceTab
  moreDrawerOpen: boolean
  setMobileTab: (tab: MobileTab) => void
  setEquipmentTab: (tab: EquipmentTab) => void
  setWorkspaceTab: (tab: WorkspaceTab) => void
  setMoreDrawerOpen: (open: boolean) => void
}

export const useActiveTab = create<ActiveTabStore>((set, get) => ({
  mobileTab: 'lab',
  equipmentTab: 'generators',
  workspaceTab: 'directory',
  moreDrawerOpen: false,
  setMobileTab: (mobileTab) => {
    set({ mobileTab, moreDrawerOpen: false })
    if (mobileTab === 'relics') {
      useUIStore.getState().clearTabUnseen('relics')
    } else if (mobileTab === 'research') {
      const currentWs = get().workspaceTab
      if (currentWs !== 'directory') {
        useUIStore.getState().clearTabUnseen(currentWs)
      }
    }
  },
  setEquipmentTab: (equipmentTab) => set({ equipmentTab }),
  setWorkspaceTab: (workspaceTab) => {
    set({ workspaceTab })
    if (workspaceTab !== 'directory') {
      useUIStore.getState().clearTabUnseen(workspaceTab)
    }
  },
  setMoreDrawerOpen: (moreDrawerOpen) => set({ moreDrawerOpen })
}))
