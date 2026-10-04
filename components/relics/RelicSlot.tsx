'use client';

import { memo } from 'react';
import { useGameStore } from '@/app/stores/gameStore';
import { unequipRelic } from '@/app/stores/gameActions';
import { RELIC_MAP } from '@/constants/relics';
import { getRelicEffectAtLevel } from '@/lib/relicDefs';
import { formatCountdown } from '@/lib/format';

interface Props {
  slotIndex: number;
}

function RelicSlot({ slotIndex }: Props) {
  const slot = useGameStore((s) => s.relicSlots[slotIndex])
  // Narrow: only read the level for the relic currently in this slot
  const relicLevel = useGameStore((s) =>
    s.relicSlots[slotIndex]?.relicId != null
      ? (s.relicLevels[s.relicSlots[slotIndex].relicId!] ?? 0)
      : 0
  )
  if (!slot) return null

  const isEmpty = slot.relicId === null
  const onCooldown = slot.cooldownRemaining > 0
  const relic = slot.relicId !== null ? RELIC_MAP[slot.relicId] : null
  const level = relicLevel

  return (
    <div
      className={[
        'card rounded-lg p-3 flex items-start gap-3 min-h-20 transition-colors',
        relic ? 'border-(--border-accent)' : 'border-dashed',
        onCooldown ? 'opacity-70' : ''
      ].join(' ')}
    >
      {/* Slot number */}
      <div className="flex flex-col items-center shrink-0">
        <span className="text-xs font-mono text-(--text-secondary)">
          Slot {slotIndex + 1}
        </span>
        {onCooldown && (
          <span className="text-[0.6rem] font-mono text-(--status-warning) mt-0.5">
            {formatCountdown(slot.cooldownRemaining)}
          </span>
        )}
      </div>

      {isEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs font-mono text-(--text-secondary)">
            {onCooldown ? 'Cooling down...' : 'Empty - select a relic below'}
          </p>
        </div>
      ) : relic ? (
        <div className="flex-1 flex flex-col gap-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-(--text-primary) truncate">
              {relic.name}
            </span>
            <span className="chip border-(--text-accent) text-(--text-accent) shrink-0 text-[0.6rem]">
              Lv{level}
            </span>
          </div>
          <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
            {getRelicEffectAtLevel(relic.id, level)}
          </p>
          <button
            onClick={() => unequipRelic(relic.id)}
            className="self-start text-[0.65rem] font-mono text-(--text-secondary) hover:text-#ef4444 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent) rounded mt-1"
          >
            unequip
          </button>
        </div>
      ) : null}
    </div>
  )
}

export default memo(RelicSlot);