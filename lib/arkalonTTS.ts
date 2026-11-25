// Browser SpeechSynthesis wrapper for Arkalon voice synthesis
// Client-side only; execution guarded against SSR

let lastSpeakTime = 0
const COOLDOWN_MS = 500
let speakSequence = 0

let cachedVoices: SpeechSynthesisVoice[] = []
let lockedVoiceURI: string | null = null

const PREFERRED_MALE_VOICES = [
  'Google UK English Male',
  'Microsoft David Desktop',
  'Microsoft David - English (United States)',
  'Microsoft Mark - English (United States)',
  'Microsoft George - English (United Kingdom)',
  'Microsoft Ryan Online (Natural) - English (United Kingdom)',
  'Microsoft Guy Online (Natural) - English (United States)',
  'Daniel',
  'Oliver',
  'Arthur',
  'Alex'
]

const FEMALE_VOICE_PATTERN =
  /\b(female|zira|hazel|susan|samantha|victoria|karen|moira|tessa|fiona|veena|jenny|aria|libby|sonia|natasha|emma|amy|joanna|kendra|kimberly|salli|ivy|nicole|claire|serena|kate|allison|ava)\b/i

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

  if (lockedVoiceURI) {
    const locked = voices.find((v) => v.voiceURI === lockedVoiceURI)
    if (locked) return locked
  }

  let selected: SpeechSynthesisVoice | undefined

  for (const name of PREFERRED_MALE_VOICES) {
    selected = voices.find(
      (v) =>
        (v.name === name || v.name.startsWith(`${name} `)) &&
        !FEMALE_VOICE_PATTERN.test(v.name)
    )
    if (selected) break
  }

  selected =
    selected ??
    voices.find(
      (v) =>
        v.lang.startsWith('en') &&
        /\bmale\b/i.test(v.name) &&
        !FEMALE_VOICE_PATTERN.test(v.name)
    ) ??
    voices.find(
      (v) => v.lang.startsWith('en') && !FEMALE_VOICE_PATTERN.test(v.name)
    ) ??
    voices.find((v) => !FEMALE_VOICE_PATTERN.test(v.name)) ??
    voices.find((v) => v.lang.startsWith('en')) ??
    voices[0]

  if (selected) lockedVoiceURI = selected.voiceURI
  return selected ?? null
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

// Cancels active speech immediately
export function cancelArkalonSpeech(): void {
  if (!isSpeechSupported()) return
  try {
    speakSequence++
    window.speechSynthesis.cancel()
    lastSpeakTime = 0
  } catch {}
}

// Speaks dialogue with cadence pauses, lowered pitch, and rate control
export function speakArkalon(text: string, volume = 0.88, force = false): void {
  if (!isSpeechSupported()) return

  const now = Date.now()
  if (!force && now - lastSpeakTime < COOLDOWN_MS) return
  lastSpeakTime = now

  const cadenceText = prepareSpeechCadence(text)
  if (!cadenceText) return

  const seq = ++speakSequence

  const dispatchUtterance = () => {
    if (seq !== speakSequence) return
    try {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
      const utterance = new SpeechSynthesisUtterance(cadenceText)

      utterance.rate = 0.8
      utterance.pitch = 0.3
      utterance.volume = volume

      const voice = getArkalonVoice()
      if (voice) utterance.voice = voice

      window.speechSynthesis.speak(utterance)
    } catch {}
  }

  try {
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    }
    window.speechSynthesis.cancel()

    setTimeout(() => {
      if (seq !== speakSequence) return
      if (loadVoices().length > 0) {
        dispatchUtterance()
        return
      }
      let settled = false
      const finish = () => {
        if (settled) return
        settled = true
        window.speechSynthesis.removeEventListener('voiceschanged', finish)
        dispatchUtterance()
      }
      window.speechSynthesis.addEventListener('voiceschanged', finish)
      setTimeout(finish, 250)
    }, 50)
  } catch {}
}