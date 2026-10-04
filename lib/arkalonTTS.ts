// Browser SpeechSynthesis wrapper for Arkalon voice synthesis
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

  const cadenceText = prepareSpeechCadence(text)
  if (!cadenceText) return

  window.speechSynthesis.cancel()

  setTimeout(() => {
    const utterance = new SpeechSynthesisUtterance(cadenceText)

    utterance.rate = 0.8
    utterance.pitch = 0.3
    utterance.volume = volume

    const voice = getArkalonVoice()
    if (voice) utterance.voice = voice

    window.speechSynthesis.speak(utterance)
  }, 50)
}
