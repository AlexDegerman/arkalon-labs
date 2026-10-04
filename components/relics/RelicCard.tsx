'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { equipRelic, upgradeRelic } from '@/app/stores/gameActions'
import { RELIC_MAP } from '@/constants/relics'
import {
  getRelicUpgradeCost,
  getRelicSlotCount,
  isRelicEquipped,
  canEquipToSlot,
  getRelicEffectAtLevel
} from '@/lib/relicDefs'
import { RELIC_LEVEL_CAP } from '@/constants/game'

interface Props {
  relicId: number
}

function RelicCard({ relicId }: Props) {
  const relic = RELIC_MAP[relicId]
  if (!relic) return null

  const level = useGameStore((s) => s.relicLevels[relicId] ?? 0)
  const dust = useGameStore((s) => s.artifactDust)
  const relicSlots = useGameStore((s) => s.relicSlots)
  const store = useGameStore.getState()

  const equipped = isRelicEquipped(relicId, store)
  const slotCount = getRelicSlotCount(store)
  const hasAvailableSlot = relicSlots
    .slice(0, slotCount)
    .some((s) => canEquipToSlot(s))

  const atCap = level >= RELIC_LEVEL_CAP
  const upgradeCost = atCap ? 0 : getRelicUpgradeCost(relicId, level)
  const canAffordUpgrade = dust >= upgradeCost && !atCap
  const canEquip = !equipped && hasAvailableSlot && level > 0

  return (
    <div
      className={[
        'card rounded-lg p-3 flex flex-col gap-2',
        equipped ? 'border-(--border-accent)' : ''
      ].join(' ')}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-xs font-semibold text-(--text-primary) truncate">
            {relic.name}
          </span>
          {equipped && (
            <span className="text-[0.6rem] font-mono text-(--text-accent)">
              Equipped
            </span>
          )}
        </div>
        <span className="chip border-(--border-default) text-(--text-secondary) shrink-0 text-[0.6rem]">
          Lv{level}/{RELIC_LEVEL_CAP}
        </span>
      </div>

      {/* Effect */}
      <p className="text-[0.65rem] text-(--text-secondary) leading-snug">
        {getRelicEffectAtLevel(relicId, level)}
      </p>

      {/* Source */}
      <p className="text-[0.6rem] text-(--text-secondary) opacity-60 italic">
        {relic.sourceDescription}
      </p>

      {/* Action row */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        {/* Equip/unequip */}
        {!equipped ? (
          <button
            onClick={() => equipRelic(relicId)}
            disabled={!canEquip}
            className={[
              'flex-1 py-1 text-[0.65rem] font-mono rounded border transition-colors',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
              canEquip
                ? 'border-(--status-success) text-(--status-success) hover:bg-(--status-success)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            {!hasAvailableSlot ? 'No slot' : level === 0 ? 'Need Lv1' : 'Equip'}
          </button>
        ) : (
          <div className="flex-1 py-1 text-[0.65rem] font-mono text-center text-(--text-accent)">
            Active
          </div>
        )}

        {/* Upgrade */}
        <button
          onClick={() => upgradeRelic(relicId)}
          disabled={!canAffordUpgrade}
          className={[
            'flex-1 py-1 text-[0.65rem] font-mono rounded border transition-colors',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-(--border-accent)',
            atCap
              ? 'border-(--status-success) text-(--status-success) cursor-default'
              : canAffordUpgrade
                ? 'border-(--text-accent) text-(--text-accent) hover:bg-(--text-accent)/10'
                : 'border-(--status-locked) text-(--status-locked) cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          {atCap ? 'MAX' : `${upgradeCost} dust`}
        </button>
      </div>
    </div>
  )
}

export default memo(RelicCard)
