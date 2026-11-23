import { TIER_THRESHOLDS } from "@/constants/tiers"
import { NotationMode } from "@/types/game"

let currentNotation: NotationMode = 'suffix'
const DECIMAL_PRECISION = 2

export function setNotationMode(mode: NotationMode): void {
  currentNotation = mode
}

export function formatPoints(value: bigint): string {
  if (value < 0n) return '0'
  if (value < 1_000n) return value.toString()

  if (currentNotation === 'scientific') {
    return formatScientific(value)
  }
  return formatSuffix(value)
}

const STANDARD_NAMED_TIERS: readonly [bigint, string][] = [
  [10n ** 162n, 'Trequinquagintillion'],
  [10n ** 159n, 'Duoquinquagintillion'],
  [10n ** 156n, 'Unquinquagintillion'],
  [10n ** 153n, 'Quinquagintillion'],
  [10n ** 150n, 'Novemquadragintillion'],
  [10n ** 147n, 'Octoquadragintillion'],
  [10n ** 144n, 'Septenquadragintillion'],
  [10n ** 141n, 'Sexquadragintillion'],
  [10n ** 138n, 'Quinquadragintillion'],
  [10n ** 135n, 'Quattuorquadragintillion'],
  [10n ** 132n, 'Tresquadragintillion'],
  [10n ** 129n, 'Duoquadragintillion'],
  [10n ** 126n, 'Unquadragintillion'],
  [10n ** 123n, 'Quadragintillion'],
  [10n ** 120n, 'Novemtrigintillion'],
  [10n ** 117n, 'Octotrigintillion'],
  [10n ** 114n, 'Septentrigintillion'],
  [10n ** 111n, 'Sextrigintillion'],
  [10n ** 108n, 'Quintrigintillion'],
  [10n ** 105n, 'Quattuortrigintillion'],
  [10n ** 102n, 'Trestrigintillion'],
  [10n ** 99n, 'Duotrigintillion'],
  [10n ** 96n, 'Untrigintillion'],
  [10n ** 93n, 'Trigintillion'],
  [10n ** 90n, 'Novemvigintillion'],
  [10n ** 87n, 'Octovigintillion'],
  [10n ** 84n, 'Septenvigintillion'],
  [10n ** 81n, 'Sexvigintillion'],
  [10n ** 78n, 'Quinvigintillion'],
  [10n ** 75n, 'Quattuorvigintillion'],
  [10n ** 72n, 'Trevigintillion'],
  [10n ** 69n, 'Duovigintillion'],
  [10n ** 66n, 'Unvigintillion'],
  [10n ** 63n, 'Vigintillion'],
  [10n ** 60n, 'Novemdecillion'],
  [10n ** 57n, 'Octodecillion'],
  [10n ** 54n, 'Septendecillion'],
  [10n ** 51n, 'Sexdecillion'],
  [10n ** 48n, 'Quindecillion'],
  [10n ** 45n, 'Quattuordecillion'],
  [10n ** 42n, 'Tredecillion'],
  [10n ** 39n, 'Duodecillion'],
  [10n ** 36n, 'Undecillion'],
  [10n ** 33n, 'Decillion'],
  [10n ** 30n, 'Nonillion'],
  [10n ** 27n, 'Octillion'],
  [10n ** 24n, 'Septillion'],
  [10n ** 21n, 'Sextillion'],
  [10n ** 18n, 'Quintillion'],
  [10n ** 15n, 'Quadrillion'],
  [10n ** 12n, 'Trillion'],
  [10n ** 9n, 'Billion'],
  [10n ** 6n, 'Million']
]

const LOG10_2 = Math.LOG10E * Math.LN2

// Fast O(N) log10 approximation for arbitrary-size BigInts via hex conversion
export function bigIntLog10(value: bigint): number {
  if (value <= 0n) return 0
  if (value < 1_000_000_000_000_000n) return Math.log10(Number(value))

  const hex = value.toString(16)
  const sliceLen = Math.min(12, hex.length)
  const topBits = parseInt(hex.slice(0, sliceLen), 16)
  const remainingBits = (hex.length - sliceLen) * 4
  return Math.log10(topBits) + remainingBits * LOG10_2
}

function formatSuffix(value: bigint): string {
  if (value < 1_000n) {
    return value.toString()
  }
  if (value >= 10n ** 168n) {
    return formatScientific(value)
  }

  // Handle standard thousands before the Million threshold
  if (value < 1_000_000n) {
    const whole = value / 1_000n
    const remainder = value % 1_000n
    const fraction = (remainder * 10n ** BigInt(DECIMAL_PRECISION)) / 1_000n
    const fracStr = fraction.toString().padStart(DECIMAL_PRECISION, '0')
    return `${whole}.${fracStr}K`
  }

  // Iterate from highest to lowest threshold
  for (let i = 0; i < STANDARD_NAMED_TIERS.length; i++) {
    const [min, label] = STANDARD_NAMED_TIERS[i]
    if (value >= min) {
      const whole = value / min
      if (whole >= 1_000_000n) return formatScientific(value)
      const remainder = value % min
      const fraction = (remainder * 10n ** BigInt(DECIMAL_PRECISION)) / min
      const fracStr = fraction.toString().padStart(DECIMAL_PRECISION, '0')
      return `${whole}.${fracStr} ${label}`
    }
  }

  return value.toString()
}

// Compact suffix notation using short tier symbols across all 57 tiers
const COMPACT_TIERS: readonly [bigint, string][] = [
  [10n ** 162n, 'Tqgs'],
  [10n ** 159n, 'Dqgs'],
  [10n ** 156n, 'Uqgs'],
  [10n ** 153n, 'Qg'],
  [10n ** 150n, 'Noqg'],
  [10n ** 147n, 'Ocqg'],
  [10n ** 144n, 'Spqg'],
  [10n ** 141n, 'Sxqg'],
  [10n ** 138n, 'Qnqg'],
  [10n ** 135n, 'Qqg'],
  [10n ** 132n, 'Tqg'],
  [10n ** 129n, 'Dqg'],
  [10n ** 126n, 'Uqg'],
  [10n ** 123n, 'Qag'],
  [10n ** 120n, 'Ntg'],
  [10n ** 117n, 'Otg'],
  [10n ** 114n, 'Stg'],
  [10n ** 111n, 'Str'],
  [10n ** 108n, 'Qntr'],
  [10n ** 105n, 'Qtr'],
  [10n ** 102n, 'Ttr'],
  [10n ** 99n, 'Dtr'],
  [10n ** 96n, 'Utr'],
  [10n ** 93n, 'Trg'],
  [10n ** 90n, 'Nvg'],
  [10n ** 87n, 'Ovg'],
  [10n ** 84n, 'Spv'],
  [10n ** 81n, 'Svg'],
  [10n ** 78n, 'Qiv'],
  [10n ** 75n, 'Qvg'],
  [10n ** 72n, 'Tvg'],
  [10n ** 69n, 'Dvg'],
  [10n ** 66n, 'Uvg'],
  [10n ** 63n, 'Vg'],
  [10n ** 60n, 'Nod'],
  [10n ** 57n, 'Ocd'],
  [10n ** 54n, 'Spd'],
  [10n ** 51n, 'Sxd'],
  [10n ** 48n, 'Qid'],
  [10n ** 45n, 'Qad'],
  [10n ** 42n, 'Td'],
  [10n ** 39n, 'Dd'],
  [10n ** 36n, 'Ud'],
  [10n ** 33n, 'Dc'],
  [10n ** 30n, 'No'],
  [10n ** 27n, 'Oc'],
  [10n ** 24n, 'Sp'],
  [10n ** 21n, 'Sx'],
  [10n ** 18n, 'Qi'],
  [10n ** 15n, 'Qa'],
  [10n ** 12n, 'T'],
  [10n ** 9n, 'B'],
  [10n ** 6n, 'M'],
  [1_000n, 'K']
]

export function formatPointsShort(value: bigint): string {
  if (value < 0n) return '0'
  if (value < 1_000n) return value.toString()

  if (currentNotation === 'scientific' || value >= 10n ** 168n) {
    return formatScientific(value)
  }

  for (let i = 0; i < COMPACT_TIERS.length; i++) {
    const [threshold, symbol] = COMPACT_TIERS[i]
    if (value >= threshold) {
      const whole = value / threshold
      if (whole >= 1_000_000n) return formatScientific(value)
      const remainder = value % threshold
      const fraction =
        (remainder * 10n ** BigInt(DECIMAL_PRECISION)) / threshold
      const fracStr = fraction.toString().padStart(DECIMAL_PRECISION, '0')
      return `${whole}.${fracStr}${symbol}`
    }
  }

  return value.toString()
}

export function formatPointsCompact(value: bigint): string {
  if (value < 0n) return '-' + formatPointsCompact(-value)
  if (value === 0n) return '0'

  if (currentNotation === 'scientific' || value >= 10n ** 168n) {
    return formatScientific(value)
  }

  for (const [threshold, symbol] of COMPACT_TIERS) {
    if (value >= threshold) {
      const whole = value / threshold
      // No decimal when whole part is 100+ (e.g. "123Qg", "500Vg")
      if (whole >= 1_000_000n) return formatScientific(value)
      if (whole >= 100n) return `${whole}${symbol}`
      // One decimal place for values under 100x the threshold
      const unit = threshold / 10n
      const tenth = unit > 0n ? (value % threshold) / unit : 0n
      return tenth > 0n ? `${whole}.${tenth}${symbol}` : `${whole}${symbol}`
    }
  }

  return value.toString()
}

function formatScientific(value: bigint): string {
  if (value < 1_000n) return value.toString()
  const log10Val = bigIntLog10(value)
  let exp = Math.floor(log10Val)
  let mantissaNum = Math.pow(10, log10Val - exp)
  let mantissa = mantissaNum.toFixed(DECIMAL_PRECISION)
  if (parseFloat(mantissa) >= 10) {
    mantissaNum /= 10
    exp += 1
    mantissa = mantissaNum.toFixed(DECIMAL_PRECISION)
  }
  return `${mantissa}e${exp}`
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
function secondsToAfford(cost: bigint, current: bigint, pps: bigint): number {
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

// Computes the cost of an infinite research node at a given level in O(log level) / O(1)
// cost = baseCost * (scalingFactor ^ level)
export function infNodeCostAtLevel(
  baseCost: bigint,
  scalingFactor: number,
  level: number
): bigint {
  if (level <= 0) return baseCost

  if (level <= 1000) {
    const num = BigInt(Math.round(scalingFactor * 1000))
    const den = 1000n
    return (baseCost * num ** BigInt(level)) / den ** BigInt(level)
  }

  const log10Base = bigIntLog10(baseCost)
  const log10Total = log10Base + level * Math.log10(scalingFactor)
  const exp = Math.floor(log10Total)
  const mantissa = Math.pow(10, log10Total - exp)
  const scaled = BigInt(Math.round(mantissa * 1e12))
  return exp >= 12
    ? scaled * 10n ** BigInt(exp - 12)
    : scaled / 10n ** BigInt(12 - exp)
}

// Formats a rate per second with appropriate suffix
export function formatRate(pps: bigint): string {
  return `${formatPoints(pps)}/sec`
}

// Returns spendable RP/sec after subtracting active megaproject allocation
export function getNetSpendablePPS(
  pps: bigint,
  activeMegaprojectId: string | null,
  allocationPercent: number
): bigint {
  if (!activeMegaprojectId || allocationPercent <= 0 || pps <= 0n) {
    return pps
  }
  const clamped = Math.max(0, Math.min(100, allocationPercent))
  return pps - (pps * BigInt(clamped)) / 100n
}