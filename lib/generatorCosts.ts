import type { GameState } from '@/types/game'
import { GENERATORS } from '@/constants/generators'
import { generatorEffectiveCost } from '@/lib/productionEngine'

// Returns the cost to buy exactly `amount` units of generator `index`
// starting from the current quantity
export function costToBuyN(
  generatorIndex: number,
  amount: number,
  state: GameState
): bigint {
  const gen = state.generators[generatorIndex]
  if (!gen) return 0n

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

// Returns the maximum number of generators affordable at current RP
// for a given generator index using geometric series approximation
export function maxAffordable(
  generatorIndex: number,
  state: GameState
): number {
  const def = GENERATORS[generatorIndex]
  if (!def) return 0

  const available = state.researchPoints
  if (available <= 0n) return 0

  // Binary search for max affordable count
  let lo = 0
  let hi = 10_000 // practical upper bound per purchase action

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2)
    const cost = costToBuyN(generatorIndex, mid, state)
    if (cost <= available) {
      lo = mid
    } else {
      hi = mid - 1
    }
  }

  return lo
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
