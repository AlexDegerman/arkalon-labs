'use client'

import { memo, useCallback } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import { getRelicRarity, RELIC_MAP } from '@/constants/relics'
import {
  getRelicBulkUpgradeInfo,
  getRelicUpgradeCost,
  getRelicSlotCount,
  isRelicEquipped,
  canEquipToSlot,
  getRelicEffectAtLevel
} from '@/lib/relicDefs'
import { RELIC_LEVEL_CAP } from '@/constants/game'
import { formatPoints } from '@/lib/format'
import { equipRelic, upgradeRelic } from '@/app/stores/actions/relicActions'

function getRelicRarityAura(id: number): string {
  if (id === 20) return 'aura-godking'
  const rarity = getRelicRarity(id)
  return `aura-${rarity}`
}

interface Props {
  relicId: number
}

function RelicCard({ relicId }: Props) {
  const relic = RELIC_MAP[relicId]
  const rarity = getRelicRarity(relicId)
  const auraClass = getRelicRarityAura(relicId)

  const level = useGameStore((s) => s.relicLevels[relicId] ?? 0)
  const dust = useGameStore((s) => s.artifactDust)
  const relicSlots = useGameStore((s) => s.relicSlots)
  const relicsDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.relicsDisabled ?? false
  )
  const equipped = useGameStore(
    useCallback((s) => isRelicEquipped(relicId, s), [relicId])
  )
  const slotCount = useGameStore(getRelicSlotCount)

  if (!relic) return null
  const hasAvailableSlot = relicSlots
    .slice(0, slotCount)
    .some((s) => canEquipToSlot(s))
  const maxLevel = relic.maxLevel ?? RELIC_LEVEL_CAP
  const atCap = level >= maxLevel
  const upgradeCost = atCap ? 0 : getRelicUpgradeCost(relicId, level)
  const canAffordUpgrade = dust >= upgradeCost && !atCap
  const bulk10 = atCap
    ? { levels: 0, cost: 0 }
    : getRelicBulkUpgradeInfo(relicId, level, dust, 10)
  const bulkMax = atCap
    ? { levels: 0, cost: 0 }
    : getRelicBulkUpgradeInfo(relicId, level, dust, 'max')
  const canEquip = !equipped && hasAvailableSlot && level > 0 && !relicsDisabled

  return (
    <div
      className={[
        'card rounded-xl p-2.5 flex flex-col justify-between gap-2 border transition-all duration-150 badge-aura-wrapper',
        auraClass,
        equipped
          ? 'border-(--border-accent) bg-linear-to-b from-(--border-accent)/15 via-(--bg-surface) to-(--bg-surface) shadow-[0_0_18px_rgba(0,240,255,0.15)]'
          : 'border-(--border-default) bg-(--bg-surface)'
      ].join(' ')}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-(--text-primary) leading-tight">
              {relic.name}
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)">
              {rarity}
            </span>
            {equipped && (
              <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border border-(--border-accent)/40 bg-(--border-accent)/15 text-(--border-accent)">
                Equipped
              </span>
            )}
          </div>
          <span className="text-[10px] text-(--text-secondary)/70 italic leading-snug mt-0.5">
            {relic.sourceDescription}
          </span>
        </div>
        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-(--bg-elevated) border border-(--border-default) text-(--text-secondary) shrink-0">
          Lv{level}/{maxLevel}
        </span>
      </div>

      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-medium text-(--text-secondary) leading-snug">
          {getRelicEffectAtLevel(relicId, level)}
        </p>
        {!atCap && (
          <p className="text-[10px] font-mono text-amber-300/85 leading-snug">
            Next (Lv{level + 1}): {getRelicEffectAtLevel(relicId, level + 1)}
          </p>
        )}
      </div>

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

        <div className="flex items-center gap-1 flex-1">
          <button
            onClick={() => upgradeRelic(relicId, 1)}
            disabled={!canAffordUpgrade}
            className={[
              'flex-1 py-1.5 px-1.5 text-[11px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none',
              atCap
                ? 'border-(--status-success)/40 text-(--status-success) bg-(--status-success)/10 cursor-default'
                : canAffordUpgrade
                  ? 'border-amber-400 bg-amber-400 text-black hover:brightness-110 shadow-[0_0_10px_rgba(251,191,36,0.3)]'
                  : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-60'
            ].join(' ')}
          >
            {atCap ? 'MAX' : `+1 · ${formatPoints(BigInt(upgradeCost))}`}
          </button>
          {!atCap && (
            <>
              <button
                onClick={() => upgradeRelic(relicId, 10)}
                disabled={bulk10.levels <= 0}
                title={
                  bulk10.levels > 0
                    ? `Upgrade +${bulk10.levels} levels for ${formatPoints(BigInt(bulk10.cost))} Dust`
                    : 'Not enough Dust'
                }
                className={[
                  'py-1.5 px-2 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none shrink-0',
                  bulk10.levels > 0
                    ? 'border-amber-400/70 bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-black'
                    : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
                ].join(' ')}
              >
                +10
              </button>
              <button
                onClick={() => upgradeRelic(relicId, 'max')}
                disabled={bulkMax.levels <= 0}
                title={
                  bulkMax.levels > 0
                    ? `Upgrade +${bulkMax.levels} levels for ${formatPoints(BigInt(bulkMax.cost))} Dust`
                    : 'Not enough Dust'
                }
                className={[
                  'py-1.5 px-2 text-[10px] font-mono font-bold uppercase rounded-lg border transition-all cursor-pointer select-none shrink-0',
                  bulkMax.levels > 0
                    ? 'border-amber-400/70 bg-amber-400/15 text-amber-300 hover:bg-amber-400 hover:text-black'
                    : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)/40 cursor-not-allowed opacity-50'
                ].join(' ')}
              >
                MAX
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default memo(RelicCard)
