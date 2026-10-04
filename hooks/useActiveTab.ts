'use client'

import { create } from 'zustand'

export type MobileTab = 'lab' | 'arkalon' | 'research' | 'relics' | 'more'
export type WorkspaceTab =
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
  workspaceTab: WorkspaceTab
  moreDrawerOpen: boolean
  setMobileTab: (tab: MobileTab) => void
  setWorkspaceTab: (tab: WorkspaceTab) => void
  setMoreDrawerOpen: (open: boolean) => void
}

export const useActiveTab = create<ActiveTabStore>((set) => ({
  mobileTab: 'lab',
  workspaceTab: 'research',
  moreDrawerOpen: false,
  setMobileTab: (mobileTab) =>
    set({ mobileTab, moreDrawerOpen: mobileTab === 'more' }),
  setWorkspaceTab: (workspaceTab) => set({ workspaceTab }),
  setMoreDrawerOpen: (moreDrawerOpen) => set({ moreDrawerOpen })
}))
