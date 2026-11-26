'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  SYNTHESIZERS,
  isSynthesizerUnlocked,
  getSynthesizerCostToBuyN,
  getSynthesizerMaxAffordable
} from '@/lib/synthesizerDefs'
import type { BulkBuyAmount } from '@/constants/game'
import { playSound } from '@/hooks/useSound'
import { markUnlocksDirty, markAchievementsDirty } from '@/lib/dirtyFlags'

export function buySynthesizer(index: number, amount: BulkBuyAmount): void {
  const store = useGameStore.getState()
  const def = SYNTHESIZERS[index]
  if (!def) return
  if (!isSynthesizerUnlocked(index, store)) return

  const currentQty = store.synthesizers[index] ?? 0
  const count =
    amount === 'max' ? getSynthesizerMaxAffordable(index, store) : amount

  if (count <= 0) return

  const totalCost = getSynthesizerCostToBuyN(index, count, currentQty)
  if (store.researchPoints < totalCost) return

  const nextSynths = [...(store.synthesizers ?? [0, 0, 0, 0])]
  nextSynths[index] = currentQty + count

  useGameStore.setState({
    researchPoints: store.researchPoints - totalCost,
    synthesizers: nextSynths
  })

  playSound('purchase')
  markUnlocksDirty()
  markAchievementsDirty()
}
