'use client'

import { memo } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { equipRelic, upgradeRelic } from '@/app/stores/actions'
import { RELIC_MAP } from '@/constants/relics'
import {
  getRelicUpgradeCost,
  getRelicSlotCount,
  isRelicEquipped,
  canEquipToSlot,
  getRelicEffectAtLevel
} from '@/lib/relicDefs'
import { RELIC_LEVEL_CAP } from '@/constants/game'
import { formatPoints } from '@/lib/format'

interface Props {
  relicId: number
}

function RelicCard({ relicId }: Props) {
  const relic = RELIC_MAP[relicId]
  if (!relic) return null

  const level = useGameStore((s) => s.relicLevels[relicId] ?? 0)
  const dust = useGameStore((s) => s.artifactDust)
  const relicSlots = useGameStore((s) => s.relicSlots)
  const state = useGameStore.getState()
  const relicsDisabled =
    state.activeChallengeRestrictions?.relicsDisabled ?? false
  const equipped = isRelicEquipped(relicId, state)
  const slotCount = getRelicSlotCount(state)
  const hasAvailableSlot = relicSlots
    .slice(0, slotCount)
    .some((s) => canEquipToSlot(s))
  const atCap = level >= RELIC_LEVEL_CAP
  const upgradeCost = atCap ? 0 : getRelicUpgradeCost(relicId, level)
  const canAffordUpgrade = dust >= upgradeCost && !atCap
  const canEquip = !equipped && hasAvailableSlot && level > 0 && !relicsDisabled

  return (
    <div
      className={[
        'card rounded-xl p-3 flex flex-col justify-between gap-2.5 border transition-all duration-150',
        equipped
          ? 'border-(--border-accent) bg-linear-to-b from-(--border-accent)/10 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_15px_rgba(0,240,255,0.08)]'
          : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-(--text-primary) truncate">
              {relic.name}
            </span>
            {equipped && (
              <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/15 text-(--border-accent)">
                Equipped
              </span>
            )}
          </div>
          <span className="text-[10px] text-(--text-secondary)/70 italic truncate mt-0.5">
            {relic.sourceDescription}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) shrink-0">
          Lv{level}/{RELIC_LEVEL_CAP}
        </span>
      </div>

      <p className="text-[11px] font-medium text-(--text-secondary) leading-snug">
        {getRelicEffectAtLevel(relicId, level)}
      </p>

      <div className="flex items-center gap-2 pt-2 border-t border-(--border-default)/50 mt-auto">
        {!equipped ? (
          <button
            onClick={() => equipRelic(relicId)}
            disabled={!canEquip}
            className={[
              'flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none',
              canEquip
                ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) hover:bg-(--status-success) hover:text-black'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            {relicsDisabled
              ? 'Restricted'
              : !hasAvailableSlot
                ? 'No Slot'
                : level === 0
                  ? 'Locked (Lv0)'
                  : 'Equip'}
          </button>
        ) : (
          <div className="flex-1 py-1.5 text-xs font-mono font-bold uppercase text-center text-(--border-accent) bg-(--border-accent)/10 border border-(--border-accent)/30 rounded-lg">
            Active
          </div>
        )}

        <button
          onClick={() => upgradeRelic(relicId)}
          disabled={!canAffordUpgrade}
          className={[
            'flex-1 py-1.5 text-xs font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none',
            atCap
              ? 'border-(--status-success)/40 text-(--status-success) bg-(--status-success)/10 cursor-default'
              : canAffordUpgrade
                ? 'border-amber-400 bg-amber-400 text-black hover:brightness-110 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
          ].join(' ')}
        >
          {atCap ? 'MAX' : `${formatPoints(BigInt(upgradeCost))} dust`}
        </button>
      </div>
    </div>
  )
}

export default memo(RelicCard)
