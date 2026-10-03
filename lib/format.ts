import { TIER_THRESHOLDS } from '@/constants/tiers'
import type { NotationMode, DecimalPrecision } from '@/types/tiers'

let currentNotation: NotationMode = 'suffix'
let currentPrecision: DecimalPrecision = 2

export function setNotationMode(mode: NotationMode): void {
  currentNotation = mode
}

export function setDecimalPrecision(precision: DecimalPrecision): void {
  currentPrecision = precision
}

export function formatPoints(value: bigint): string {
  if (value < 0n) return '0'

  switch (currentNotation) {
    case 'scientific':
      return formatScientific(value)
    case 'engineering':
      return formatEngineering(value)
    case 'logarithm':
      return formatLogarithm(value)
    default:
      return formatSuffix(value)
  }
}

function formatSuffix(value: bigint): string {
  if (value < 1_000n) {
    return value.toString()
  }

  // Handle standard thousands before the Million threshold
  if (value < 1_000_000n) {
    const whole = value / 1_000n
    const remainder = value % 1_000n
    const fraction = (remainder * 10n ** BigInt(currentPrecision)) / 1_000n
    const fracStr = fraction.toString().padStart(currentPrecision, '0')
    return `${whole}.${fracStr}K`
  }

  // Iterate from highest to lowest threshold
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    const tier = TIER_THRESHOLDS[i]
    if (value >= tier.min) {
      const whole = value / tier.min
      const remainder = value % tier.min
      const fraction = (remainder * 10n ** BigInt(currentPrecision)) / tier.min
      const fracStr = fraction.toString().padStart(currentPrecision, '0')
      return tier.label
        ? `${whole}.${fracStr} ${tier.label}`
        : `${whole}.${fracStr}`
    }
  }

  return value.toString()
}

function formatScientific(value: bigint): string {
  if (value === 0n) return '0.00e0'
  const str = value.toString()
  const exp = str.length - 1
  const mantissa = parseFloat(
    str[0] + '.' + str.slice(1, 1 + currentPrecision + 2)
  ).toFixed(currentPrecision)
  return `${mantissa}e${exp}`
}

function formatEngineering(value: bigint): string {
  if (value === 0n) return '0.00E0'
  const str = value.toString()
  const exp = str.length - 1
  const engExp = Math.floor(exp / 3) * 3
  const leadingDigits = exp - engExp + 1
  const wholePart = str.slice(0, leadingDigits)
  const remainderDigits = str
    .slice(leadingDigits, leadingDigits + currentPrecision)
    .padEnd(currentPrecision, '0')
  return `${wholePart}.${remainderDigits}E${engExp}`
}

function formatLogarithm(value: bigint): string {
  if (value <= 0n) return 'e0.00'
  const str = value.toString()
  const exp = str.length - 1
  const mantissa = Math.log10(parseFloat(str[0] + '.' + str.slice(1, 4)))
  const log = (exp + mantissa).toFixed(currentPrecision)
  return `e${log}`
}

export function getAmountColor(value: bigint): string {
  if (!TIER_THRESHOLDS.length) return ''

  // Highest threshold matching takes precedence
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (value >= TIER_THRESHOLDS[i].min) {
      return TIER_THRESHOLDS[i].cls
    }
  }

  return ''
}

export function parseShorthand(input: string): bigint | null {
  const cleaned = input.trim().toLowerCase()
  const match = cleaned.match(/^([0-9.]+)\s*([a-z]*)$/)
  if (!match) return null

  const num = parseFloat(match[1])
  if (isNaN(num)) return null

  const suffix = match[2]
  const suffixMap: Record<string, bigint> = {
    k: 1_000n,
    m: 1_000_000n,
    b: 1_000_000_000n,
    t: 1_000_000_000_000n
  }

  const multiplier = suffixMap[suffix] ?? 1n
  return BigInt(Math.floor(num)) * multiplier
}

export function getFullNumberName(value: bigint): string {
  for (let i = 0; i < TIER_THRESHOLDS.length; i++) {
    if (value >= TIER_THRESHOLDS[i].min) {
      return TIER_THRESHOLDS[i].label || ''
    }
  }
  return ''
}

export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.ceil(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
