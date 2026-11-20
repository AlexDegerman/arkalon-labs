import type { GameState } from '@/types/game'
import { GENERATORS } from '@/constants/generators'
import {
  generatorEffectiveCost,
  getEffectiveGrowthFactor
} from '@/lib/productionEngine'
import { bigIntLog10 } from '@/lib/format'

function geometricSegmentCost(
  generatorIndex: number,
  startQty: bigint,
  count: number,
  state: GameState
): bigint {
  if (count <= 0) return 0n
  if (count <= 10) {
    let sum = 0n
    for (let i = 0; i < count; i++) {
      sum += generatorEffectiveCost(generatorIndex, startQty + BigInt(i), state)
    }
    return sum
  }

  const c0 = generatorEffectiveCost(generatorIndex, startQty, state)
  const r = getEffectiveGrowthFactor(generatorIndex, state, startQty)
  if (r <= 1.000001) return c0 * BigInt(count)

  const log10Pow = count * Math.log10(r)
  if (log10Pow > 240) {
    const exp = Math.floor(log10Pow)
    const mantissa = Math.pow(10, log10Pow - exp) / (r - 1)
    const scaled = BigInt(Math.round(mantissa * 1e12))
    return (
      (c0 * scaled * 10n ** BigInt(Math.max(0, exp - 12))) / 1_000_000_000_000n
    )
  }

  const geomFactor = (Math.pow(r, count) - 1) / (r - 1)
  if (!Number.isFinite(geomFactor) || !Number.isFinite(geomFactor * 1e9)) {
    const exp = Math.floor(log10Pow)
    const mantissa = Math.pow(10, log10Pow - exp) / (r - 1)
    const scaled = BigInt(Math.round(mantissa * 1e12))
    return (
      (c0 * scaled * 10n ** BigInt(Math.max(0, exp - 12))) / 1_000_000_000_000n
    )
  }

  const scale = 1_000_000_000n
  const scaled = BigInt(Math.round(geomFactor * 1e9))
  return (c0 * scaled) / scale
}

// Returns the cost to buy exactly `amount` units of generator `index`
// starting from the current quantity, segmenting R1 unit #1 and M100 at qty=100
export function costToBuyN(
  generatorIndex: number,
  amount: number,
  state: GameState
): bigint {
  const gen = state.generators[generatorIndex]
  if (!gen || amount <= 0) return 0n
  if (amount === 1) return nextCost(generatorIndex, state)

  if (amount <= 10) {
    let total = 0n
    for (let i = 0; i < amount; i++) {
      total += generatorEffectiveCost(
        generatorIndex,
        gen.quantity + BigInt(i),
        state
      )
    }
    return total
  }

  let total = 0n
  let currentQty = gen.quantity
  let remaining = amount

  // Segment 1: R1 applies its 15% discount only to unit #1 (qty === 0)
  if (
    currentQty === 0n &&
    (generatorIndex === 1 || generatorIndex === 2) &&
    state.completedResearchNodes.includes('R1')
  ) {
    total += generatorEffectiveCost(generatorIndex, 0n, state)
    currentQty = 1n
    remaining -= 1
  }

  // Segment 2: split at qty = 100 where M100 reduces growth factor by 0.005
  if (
    remaining > 0 &&
    !state.activeChallengeRestrictions?.milestonesDisabled &&
    currentQty < 100n &&
    currentQty + BigInt(remaining) > 100n
  ) {
    const preCount = Number(100n - currentQty)
    total += geometricSegmentCost(generatorIndex, currentQty, preCount, state)
    currentQty = 100n
    remaining -= preCount
  }

  if (remaining > 0) {
    total += geometricSegmentCost(generatorIndex, currentQty, remaining, state)
  }

  return total
}

// Returns the maximum number of generators affordable at current RP
// for a given generator index using logarithmic estimate with binary search
export function maxAffordable(
  generatorIndex: number,
  state: GameState
): number {
  const def = GENERATORS[generatorIndex]
  if (!def) return 0

  const available = state.researchPoints
  if (available <= 0n) return 0

  const singleCost = nextCost(generatorIndex, state)
  if (available < singleCost) return 0

  const r = getEffectiveGrowthFactor(generatorIndex, state)
  const log10Avail = bigIntLog10(available)
  const log10Cost = bigIntLog10(singleCost)
  const log10Ratio = Math.max(0, log10Avail - log10Cost)

  let approx: number
  if (log10Ratio > 300) {
    const log10Inner = log10Ratio + Math.log10(r - 1)
    approx = log10Inner > 0 ? Math.floor(log10Inner / Math.log10(r)) : 1
  } else {
    const ratio = Math.pow(10, log10Ratio)
    const inner = 1 + ratio * (r - 1)
    approx = inner > 0 ? Math.floor(Math.log(inner) / Math.log(r)) : 1
  }

  const MAX_SEARCH = 10_000_000
  const clampedApprox = Number.isFinite(approx)
    ? Math.min(MAX_SEARCH, Math.max(1, approx))
    : MAX_AFFORDABLE_FALLBACK(MAX_SEARCH)

  let low = Math.max(1, clampedApprox - 25)
  let high = Math.min(MAX_SEARCH, clampedApprox + 25)

  if (costToBuyN(generatorIndex, low, state) > available) {
    low = 1
    high = clampedApprox
  } else {
    while (
      high < MAX_SEARCH &&
      costToBuyN(generatorIndex, high, state) <= available
    ) {
      low = high
      high = Math.min(MAX_SEARCH, high * 2)
    }
  }

  let ans = costToBuyN(generatorIndex, low, state) <= available ? low : 1
  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (costToBuyN(generatorIndex, mid, state) <= available) {
      ans = mid
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return ans
}

function MAX_AFFORDABLE_FALLBACK(cap: number): number {
  return cap
}

// Returns true if the player can afford at least 1 of the given generator
export function canAfford(generatorIndex: number, state: GameState): boolean {
  const cost = generatorEffectiveCost(
    generatorIndex,
    state.generators[generatorIndex].quantity,
    state
  )
  return state.researchPoints >= cost
}

// Returns the cost for the next single purchase of a generator
export function nextCost(generatorIndex: number, state: GameState): bigint {
  return generatorEffectiveCost(
    generatorIndex,
    state.generators[generatorIndex].quantity,
    state
  )
}
