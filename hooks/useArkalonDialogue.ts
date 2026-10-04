'use client'

import { useCallback } from 'react'
import { getDialogue, ANOMALY_DIALOGUE_MAP } from '@/lib/arkalonDialogue'
import { speakArkalon } from '@/lib/arkalonTTS'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'

// Manages the terminal's line history and dispatches new dialogue lines
// Lines are stored in uiStore so both PC and mobile read the same history
export function useArkalonDialogue() {
  const lines = useUIStore((s) => s.terminalLines)
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine)
  const volumeVoice = useGameStore((s) => s.settings.volumeVoice)

  const pushDialogue = useCallback(
    (triggerId: string) => {
      const text = getDialogue(triggerId)
      if (!text) return
      pushTerminalLine(text)
      speakArkalon(text, volumeVoice)
    },
    [volumeVoice, pushTerminalLine]
  )

  const pushRaw = useCallback(
    (text: string) => {
      pushTerminalLine(text)
      speakArkalon(text, volumeVoice)
    },
    [volumeVoice, pushTerminalLine]
  )

  return { lines, pushDialogue, pushRaw }
}
