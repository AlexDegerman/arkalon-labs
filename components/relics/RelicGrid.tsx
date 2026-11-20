'use client'

import { memo, useState } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import RelicCard from '@/components/relics/RelicCard'
import { RELICS, getRelicRarity, RELIC_CLASSES } from '@/constants/relics'

function ClassifiedDossierCard({
  relicId,
  relic4Pity,
  relic9Pity
}: {
  relicId: number
  relic4Pity: number
  relic9Pity: number
}) {
  const relic = RELICS.find((r) => r.id === relicId)
  if (!relic) return null
  const rarity = getRelicRarity(relicId)
  const relicClass = RELIC_CLASSES[relicId]
  const pityLabel =
    relicId === 4
      ? `Pity Progress: ${Math.min(25, relic4Pity)}/25 research nodes`
      : relicId === 9
        ? `Pity Progress: ${Math.min(8, relic9Pity)}/8 Unstable/Void scans`
        : null

  return (
    <div className="card rounded-xl p-2.5 flex flex-col justify-between gap-1.5 border border-dashed border-(--border-default)/70 bg-(--bg-surface)/30 select-none">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-mono font-bold text-(--text-secondary) tracking-wider">
              CLASSIFIED #{String(relicId).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-mono font-black uppercase px-1.5 py-0.2 rounded border border-(--border-default)/50 bg-(--bg-elevated) text-(--text-secondary)/60">
              {rarity}
            </span>
            <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded border border-(--border-default)/40 text-(--text-secondary)/50">
              {relicClass}
            </span>
          </div>
          <span className="text-[10px] font-mono text-amber-400/80 mt-1">
            Recovery Clue: {relic.sourceDescription}
          </span>
        </div>
        <span className="text-sm opacity-50 shrink-0" aria-hidden="true">
          🔒
        </span>
      </div>

      <p className="text-[11px] font-mono text-(--text-secondary)/50 italic leading-snug">
        Telemetry redacted. Stabilize spatial anomalies or run excavation probes
        to recover fragments.
      </p>

      <div className="pt-2 border-t border-(--border-default)/30 text-[10px] font-mono text-(--text-secondary)/60 flex justify-between gap-2 flex-wrap">
        <span className={pityLabel ? 'text-cyan-300/90 font-bold' : ''}>
          {pityLabel ?? 'Status: Unrecovered'}
        </span>
        <span>Node #{relicId}</span>
      </div>
    </div>
  )
}

const ALL_RELIC_IDS = RELICS.map((r) => r.id)

function RelicGrid() {
  const [filterMode, setFilterMode] = useState<'all' | 'unlocked'>('all')
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)
  const relic4Pity = useGameStore((s) => s.stats.relic4PityCount ?? 0)
  const relic9Pity = useGameStore((s) => s.stats.relic9PityCount ?? 0)

  return (
    <div className="@container flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap font-mono text-[10px]">
        <span className="text-(--text-secondary)">
          Containment Archive ({unlockedRelics.length}/20 Discovered)
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilterMode('all')}
            className={[
              'px-2 py-0.5 rounded border transition-colors cursor-pointer uppercase font-bold',
              filterMode === 'all'
                ? 'border-(--border-accent) text-(--border-accent) bg-(--border-accent)/10'
                : 'border-(--border-default) text-(--text-secondary)'
            ].join(' ')}
          >
            Full Archive
          </button>
          <button
            onClick={() => setFilterMode('unlocked')}
            className={[
              'px-2 py-0.5 rounded border transition-colors cursor-pointer uppercase font-bold',
              filterMode === 'unlocked'
                ? 'border-(--border-accent) text-(--border-accent) bg-(--border-accent)/10'
                : 'border-(--border-default) text-(--text-secondary)'
            ].join(' ')}
          >
            Recovered Only
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 @[420px]:grid-cols-2 gap-2">
        {ALL_RELIC_IDS.map((id) => {
          const isUnlocked = unlockedRelics.includes(id)
          if (!isUnlocked && filterMode === 'unlocked') return null
          return isUnlocked ? (
            <RelicCard key={id} relicId={id} />
          ) : (
            <ClassifiedDossierCard
              key={id}
              relicId={id}
              relic4Pity={relic4Pity}
              relic9Pity={relic9Pity}
            />
          )
        })}
      </div>
    </div>
  )
}

export default memo(RelicGrid)