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
// Binary search with a tighter upper bound to reduce worst-case iterations
export function maxAffordable(
  generatorIndex: number,
  state: GameState
): number {
  const def = GENERATORS[generatorIndex];
  if (!def) return 0;

  const available = state.researchPoints;
  if (available <= 0n) return 0;

  // Quick check: can we afford even 1?
  if (!canAfford(generatorIndex, state)) return 0;

  // Compute a tight upper bound using the geometric series formula:
  // N ≈ log(available / baseCost * (growthFactor - 1) + 1) / log(growthFactor)
  // This gives an O(1) estimate that we use as the binary search ceiling
  const baseCost = Number(def.baseCost);
  const available_f = Number(available);
  const g = def.growthFactor;
  const currentQty = Number(state.generators[generatorIndex]?.quantity ?? 0n);
  const currentCostF = baseCost * Math.pow(g, currentQty);

  if (available_f < currentCostF) return 0;

  // Upper bound: how many can we buy if price stayed constant at current cost?
  // This overestimates but provides a finite ceiling
  const upperBound = Math.min(
    2000, // hard cap: buying >2000 at once is never realistic
    Math.ceil(Math.log(available_f / currentCostF + 1) / Math.log(g) + 1)
  );

  if (upperBound <= 0) return 1; // can afford at least 1

  // Binary search within [1, upperBound]
  let lo = 1;
  let hi = upperBound;

  while (lo < hi) {
    const mid = Math.ceil((lo + hi) / 2);
    const cost = costToBuyN(generatorIndex, mid, state);
    if (cost <= available) {
      lo = mid;
    } else {
      hi = mid - 1;
    }
  }

  return lo;
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
