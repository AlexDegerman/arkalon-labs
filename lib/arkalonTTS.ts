// Browser SpeechSynthesis wrapper for Arkalon voice synthesis
// Client-side only; execution guarded against SSR

let lastSpeakTime = 0
const COOLDOWN_MS = 500

let cachedVoices: SpeechSynthesisVoice[] = []

function isSpeechSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    window.speechSynthesis != null &&
    'SpeechSynthesisUtterance' in window
  )
}

function loadVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSupported()) return []
  try {
    const v = window.speechSynthesis.getVoices()
    if (v && v.length > 0) cachedVoices = v
  } catch {
    return []
  }
  return cachedVoices
}

function getArkalonVoice(): SpeechSynthesisVoice | null {
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

function formatArkalonSpeech(text: string): string {
  return text
    .replace(/[\u{1F300}-\u{1FAFF}]/gu, '')
    .replace(/[^\w\s.,!?;:'-]/g, '')
    .trim()
}

function prepareSpeechCadence(text: string): string {
  const cleaned = formatArkalonSpeech(text)
  if (!cleaned) return ''

  const normalized = cleaned.replace(/\.{2,}/g, '... ')

  return normalized
    .replace(/([.!?])\s+/g, '... ')
    .replace(/([;:])\s+/g, '... ')
    .trim()
}

// Unlocks AudioContext on user gesture to satisfy browser autoplay policies
export function unlockArkalon(): void {
  if (!isSpeechSupported()) return
  try {
    window.speechSynthesis.getVoices()
    const utterance = new SpeechSynthesisUtterance('')
    utterance.volume = 0
    window.speechSynthesis.speak(utterance)
  } catch {}
}

// Preloads voice list asynchronously
export function primeArkalonVoices(): void {
  if (!isSpeechSupported()) return
  try {
    loadVoices()
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices
    }
  } catch {}
}

// Speaks dialogue with cadence pauses, lowered pitch, and rate control
export function speakArkalon(text: string, volume = 0.88): void {
  if (!isSpeechSupported()) return

  const now = Date.now()
  if (now - lastSpeakTime < COOLDOWN_MS) return
  lastSpeakTime = now

  const cadenceText = prepareSpeechCadence(text)
  if (!cadenceText) return

  try {
    window.speechSynthesis.cancel()

    setTimeout(() => {
      try {
        const utterance = new SpeechSynthesisUtterance(cadenceText)

        utterance.rate = 0.8
        utterance.pitch = 0.3
        utterance.volume = volume

        const voice = getArkalonVoice()
        if (voice) utterance.voice = voice

        window.speechSynthesis.speak(utterance)
      } catch {}
    }, 50)
  } catch {}
}
