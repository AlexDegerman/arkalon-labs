import { TIER_THRESHOLDS } from "@/constants/tiers"
import { NotationMode } from "@/types/game"
import { DecimalPrecision } from "@/types/tiers"

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

// Formats a Unix ms timestamp to a locale time string
export function formatDateTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formats a Unix ms timestamp to a locale clock time for "completes at" display
export function formatCompletionTime(nowMs: number, remainingSeconds: number): string {
  if (!isFinite(remainingSeconds) || remainingSeconds < 0) return '--'
  return new Date(nowMs + remainingSeconds * 1000).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Formats seconds into a human-readable duration string
export function formatDuration(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return '--'
  if (seconds < 60) return `${Math.ceil(seconds)}s`
  if (seconds < 3600) {
    const m = Math.floor(seconds / 60)
    const s = Math.ceil(seconds % 60)
    return s > 0 ? `${m}m ${s}s` : `${m}m`
  }
  if (seconds < 86400) {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    return m > 0 ? `${h}h ${m}m` : `${h}h`
  }
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return h > 0 ? `${d}d ${h}h` : `${d}d`
}

// Formats seconds as a real-wall-clock countdown string HH:MM:SS
export function formatCountdown(totalSeconds: number): string {
  if (!isFinite(totalSeconds) || totalSeconds < 0) return '00:00'
  const s = Math.ceil(totalSeconds)
  const hh = Math.floor(s / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  if (hh > 0) {
    return `${hh}:${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
  }
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`
}

// Returns seconds until a bigint cost is affordable at the given PPS
// Returns 0 if already affordable
export function secondsToAfford(cost: bigint, current: bigint, pps: bigint): number {
  if (current >= cost) return 0
  if (pps <= 0n) return Infinity
  const needed = cost - current
  const secondsBn = (needed + pps - 1n) / pps
  if (secondsBn > BigInt(Number.MAX_SAFE_INTEGER)) return Infinity
  return Number(secondsBn)
}

// Formats time-to-afford as a compact string for generator cards
// Returns empty string if already affordable
export function formatTimeToAfford(
  cost: bigint,
  current: bigint,
  pps: bigint
): string {
  const seconds = secondsToAfford(cost, current, pps)
  if (seconds === 0) return ''
  if (!isFinite(seconds)) return '--'
  return formatDuration(seconds)
}

// Computes the cost of an infinite research node at a given level
// cost = baseCost * (scalingFactor ^ level)
export function infNodeCostAtLevel(
  baseCost: bigint,
  scalingFactor: number,
  level: number
): bigint {
  if (level <= 0) return baseCost
  const multiplierNumerator = BigInt(Math.round(scalingFactor * 1000))
  const multiplierDenominator = 1000n

  let cost = baseCost
  for (let i = 0; i < level; i++) {
    cost = (cost * multiplierNumerator) / multiplierDenominator
  }
  return cost
}

// Formats a rate per second with appropriate suffix
export function formatRate(pps: bigint): string {
  return `${formatPoints(pps)}/sec`
}

// Formats a percentage value to fixed decimal places
export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`
}

// Returns a short human-readable label for a bigint magnitude
// Used in generator "next milestone" displays
export function formatMilestoneTarget(quantity: bigint, interval: number): string {
  if (interval <= 0) return `${quantity.toString()}/0`
  const intervalBn = BigInt(interval)
  const next = ((quantity / intervalBn) + 1n) * intervalBn
  return `${quantity.toString()}/${next.toString()}`
}