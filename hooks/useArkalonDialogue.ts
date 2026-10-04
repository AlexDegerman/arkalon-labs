'use client'

import { useCallback } from 'react'
import { getDialogue, ANOMALY_DIALOGUE_MAP } from '@/lib/arkalonDialogue'
import { speakArkalon } from '@/lib/arkalonTTS'
import { useGameStore } from '@/app/stores/gameStore'
import { useUIStore } from '@/app/stores/uiStore'
import { useMusicStore } from '@/app/stores/musicStore'

// Manages the terminal's line history and dispatches new dialogue lines
// Lines are stored in uiStore so both PC and mobile read the same history
export function useArkalonDialogue() {
  const lines = useUIStore((s) => s.terminalLines)
  const pushTerminalLine = useUIStore((s) => s.pushTerminalLine)
  
    const volumeVoice = useGameStore((s) => s.settings.volumeVoice)
    const muted = useMusicStore((s) => s.muted)

    const pushDialogue = useCallback(
      (triggerId: string) => {
        const text = getDialogue(triggerId)
        if (!text) return
        pushTerminalLine(text)
        if (!muted) speakArkalon(text, volumeVoice)
      },
      [volumeVoice, muted, pushTerminalLine]
    )

    const pushRaw = useCallback(
      (text: string) => {
        pushTerminalLine(text)
        if (!muted) speakArkalon(text, volumeVoice)
      },
      [volumeVoice, muted, pushTerminalLine]
    )

  return { lines, pushDialogue, pushRaw }
}
