// Browser SpeechSynthesis wrapper for Oracle voice synthesis
// Client-side only; execution guarded against SSR

let lastSpeakTime = 0
const COOLDOWN_MS = 500

let cachedVoices: SpeechSynthesisVoice[] = []

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return []
  const v = window.speechSynthesis.getVoices()
  if (v.length > 0) cachedVoices = v
  return cachedVoices
}

function getOracleVoice(): SpeechSynthesisVoice | null {
  const voices = loadVoices()
  if (!voices.length) return null

  const targetNames = [
    'Google UK English Male',
    'Microsoft David Desktop',
    'Microsoft David - English (United States)',
    'English (United Kingdom)'
  ]

  for (const name of targetNames) {
    const found = voices.find((v) => v.name === name)
    if (found) return found
  }

  return (
    voices.find(
      (v) => v.name.toLowerCase().includes('male') && v.lang.startsWith('en')
    ) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0]
  )
}

function formatOracleSpeech(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[^\w\s.,!?'-]/g, '')
    .trim()
}

// Unlocks AudioContext on user gesture to satisfy browser autoplay policies
export function unlockArkalon(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  window.speechSynthesis.getVoices()
  const utterance = new SpeechSynthesisUtterance('')
  utterance.volume = 0
  window.speechSynthesis.speak(utterance)
}

// Preloads voice list asynchronously
export function primeArkalonVoices(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  loadVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
}

// Speaks dialogue with cadence pauses, lowered pitch, and rate control
export function speakArkalon(text: string, volume = 0.88): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  const now = Date.now()
  if (now - lastSpeakTime < COOLDOWN_MS) return
  lastSpeakTime = now

  const cleaned = formatOracleSpeech(text)
  if (!cleaned) return

  const words = cleaned.split(' ')
  const cadenceText =
    words.length <= 6
      ? `... ${words.join('... ')} ...`
      : `... ${cleaned.replace(/[.,!?]/g, '...')} ...`

  window.speechSynthesis.cancel()

  // 50ms delay avoids cancellation race condition in Chromium/WebKit engines
  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(cadenceText)

    utterance.rate = 0.75
    utterance.pitch = 0.25
    utterance.volume = volume

    const voice = getOracleVoice()
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
  }, 50)
}

export const unlockOracle = unlockArkalon
export const primeOracleVoices = primeArkalonVoices
export const speakOracle = speakArkalon
