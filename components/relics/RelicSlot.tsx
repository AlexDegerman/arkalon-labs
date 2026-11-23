'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { RELIC_MAP } from '@/constants/relics'
import { getRelicEffectAtLevel } from '@/lib/relicDefs'
import { unequipRelic } from '@/app/stores/actions/relicActions'

interface Props {
  slotIndex: number
}

function RelicSlot({ slotIndex }: Props) {
  const slot = useGameStore((s) => s.relicSlots[slotIndex])
  const relicsDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.relicsDisabled ?? false
  )
  // Narrow: only read the level for the relic currently in this slot
  const relicLevel = useGameStore((s) =>
    s.relicSlots[slotIndex]?.relicId != null
      ? (s.relicLevels[s.relicSlots[slotIndex].relicId!] ?? 0)
      : 0
  )
  if (!slot) return null

  const isEmpty = slot.relicId === null
  const relic = slot.relicId !== null ? RELIC_MAP[slot.relicId] : null
  const level = relicLevel

  return (
    <div
      className={[
        'card rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-2 min-h-12 transition-all',
        relic
          ? 'border-(--border-accent)/60 bg-linear-to-r from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface)'
          : 'border-dashed border-(--border-default)/70 bg-(--bg-surface)/40'
      ].join(' ')}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex flex-col items-center justify-center w-7 h-7 rounded-lg bg-(--bg-elevated) border border-(--border-default) shrink-0 font-mono">
          <span className="text-[10px] text-(--text-secondary) font-bold">
            #{slotIndex + 1}
          </span>
        </div>

        {isEmpty ? (
          <p className="text-xs font-mono text-(--text-secondary)/60">
            Empty Socket Node · Select relic below
          </p>
        ) : relic ? (
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs sm:text-sm font-bold text-(--text-primary)">
                {relic.name}
              </span>
              <span className="text-[9px] font-mono font-black text-(--text-accent) px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/10 shrink-0">
                Lv{level}
              </span>
            </div>
            <p className="text-[11px] text-(--text-secondary) leading-snug mt-0.5">
              {getRelicEffectAtLevel(relic.id, level)}
            </p>
          </div>
        ) : null}
      </div>

      {!isEmpty && relic && (
        <button
          onClick={() => unequipRelic(relic.id)}
          disabled={relicsDisabled}
          className={[
            'px-2.5 py-1 text-xs font-mono font-bold rounded-lg border shrink-0',
            relicsDisabled
              ? 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
              : 'border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer'
          ].join(' ')}
        >
          Unequip
        </button>
      )}
    </div>
  )
}

export default memo(RelicSlot)
