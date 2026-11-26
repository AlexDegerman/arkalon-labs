'use client'

import { useEffect, useRef } from 'react'
import { useActiveTab } from '@/hooks/useActiveTab'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import {
  buyGenerator,
  buyMaxAllGenerators
} from '@/app/stores/actions/generatorActions'
import { isGeneratorVisible } from '@/lib/generatorUtils'

// Keyboard shortcuts:
// 1-9, 0 = Buy generator 1-10 (hold Shift for generators 11-20)
// M = Buy Max All generators
// B = Toggle bulk buy mode cycling
// R = Open Research tab
// P = Open Prestige tab

export function useKeyboardShortcuts(enabled = true) {
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const setMobileTab = useActiveTab((s) => s.setMobileTab)
  const enabledRef = useRef(enabled)
  enabledRef.current = enabled

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!enabledRef.current) return
      // Don't fire if user is typing in an input
      const target = e.target as HTMLElement
      const tag = target.tagName.toLowerCase()

      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target.isContentEditable
      )
        return
      const key = e.key
      const shift = e.shiftKey

      if (key === 'Escape') {
        e.preventDefault()
        const ui = useUIStore.getState()
        if (ui.clientUpdateAvailable) return
        if (ui.hotkeyModalOpen) {
          const returnToSettings = ui.hotkeyFromSettings
          ui.setHotkeyModalOpen(false)
          if (returnToSettings) ui.setSettingsPanelOpen(true)
          return
        }
        if (ui.settingsPanelOpen) {
          ui.setSettingsPanelOpen(false)
          return
        }
        if (ui.welcomeModalOpen) {
          ui.setWelcomeModalOpen(false)
          return
        }
        if (ui.updateModalOpen) {
          ui.setUpdateModalOpen(false)
          return
        }
        if (ui.offlineModalOpen) {
          ui.setOfflineModalOpen(false)
          return
        }
        if (ui.challengeCompleteModalOpen) {
          ui.setChallengeCompleteModalOpen(false)
          return
        }
        if (ui.victoryModalOpen) {
          ui.setVictoryModalOpen(false)
          return
        }
        useActiveTab.getState().setMoreDrawerOpen(false)
        return
      }

      // Suspend gameplay shortcuts while any modal or settings panel is open
      const uiState = useUIStore.getState()
      if (
        uiState.clientUpdateAvailable ||
        uiState.welcomeModalOpen ||
        uiState.updateModalOpen ||
        uiState.offlineModalOpen ||
        uiState.hotkeyModalOpen ||
        uiState.challengeCompleteModalOpen ||
        uiState.victoryModalOpen ||
        uiState.settingsPanelOpen
      )
        return
      // Generator buy shortcuts: 1-9 = gen 0-8, 0 = gen 9
      // Shift+1-9 = gen 10-18, Shift+0 = gen 19
      if (e.code.startsWith('Digit')) {
        e.preventDefault()
        const digit = parseInt(e.code.replace('Digit', ''), 10)
        const base = digit === 0 ? 9 : digit - 1
        const genIndex = shift ? base + 10 : base
        if (
          genIndex >= 0 &&
          genIndex < 20 &&
          isGeneratorVisible(genIndex, useGameStore.getState())
        ) {
          buyGenerator(genIndex, 1)
        }
        return
      }

      switch (key.toLowerCase()) {
        case 'm':
          e.preventDefault()
          buyMaxAllGenerators()
          break

        case 'b':
          e.preventDefault()
          window.dispatchEvent(new CustomEvent('cycle-bulk-buy'))
          break

        case 'r':
          e.preventDefault()
          setWorkspaceTab('research')
          setMobileTab('research')
          break

        case 'p':
          e.preventDefault()
          setWorkspaceTab('prestige')
          setMobileTab('research')
          break

        case '?':
          e.preventDefault()
          useUIStore
            .getState()
            .setHotkeyModalOpen(!useUIStore.getState().hotkeyModalOpen)
          break

        case ',':
          // Open settings panel
          e.preventDefault()
          useUIStore.getState().setSettingsPanelOpen(true)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setWorkspaceTab, setMobileTab])
}
