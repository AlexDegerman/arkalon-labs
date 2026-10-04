'use client'

import { useEffect } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { buyGenerator } from '@/app/stores/gameActions'
import { useActiveTab } from '@/hooks/useActiveTab'
import { useUIStore } from '@/app/stores/uiStore'

// Keyboard shortcuts:
// 1-9, 0 = Buy generator 1-10 (hold Shift for generators 11-20)
// B = Toggle bulk buy mode cycling
// R = Open Research tab
// P = Open Prestige tab
// Space = Pause/unpause game loop

export function useKeyboardShortcuts() {
  const { setWorkspaceTab, setMobileTab } = useActiveTab()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire if user is typing in an input
      const tag = (e.target as HTMLElement).tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return

      const key = e.key
      const shift = e.shiftKey

      // Generator buy shortcuts: 1-9 = gen 0-8, 0 = gen 9
      // Shift+1-9 = gen 10-18, Shift+0 = gen 19
      if (/^[0-9]$/.test(key)) {
        e.preventDefault()
        const digit = parseInt(key)
        const base = digit === 0 ? 9 : digit - 1
        const genIndex = shift ? base + 10 : base
        if (genIndex >= 0 && genIndex < 20) {
          const store = useGameStore.getState()
          // Use the current bulk amount from the GeneratorList state
          // Default to 1 since bulk state is local to GeneratorList
          buyGenerator(genIndex, 1)
        }
        return
      }

      switch (key.toLowerCase()) {
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

        case ' ':
          e.preventDefault()
          useGameStore.setState((s) => ({
            settings: { ...s.settings, gamePaused: !s.settings.gamePaused }
          }))
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
