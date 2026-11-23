'use client'

import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import RelicSlot from '@/components/relics/RelicSlot'
import RelicGrid from '@/components/relics/RelicGrid'
import { getRelicSlotCount, getEquippedClassCounts } from '@/lib/relicDefs'
import { formatPoints, formatPointsShort } from '@/lib/format'
import { useIsCompactViewport } from '@/hooks/useIsCompactViewport'
import { saveRelicPreset, loadRelicPreset } from '@/app/stores/actions/relicActions'
import { RELIC_MAP, type RelicClass } from '@/constants/relics'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'
import { getCurrentEra } from '@/lib/eraThresholds'

const PRESET_NAMES = ['Speedrun', 'Deep Idle', 'Surge Hunter']

export default function RelicsTab() {
  const isCompact = useIsCompactViewport()
  const fmt = isCompact ? formatPointsShort : formatPoints
  const slotCount = useGameStore(getRelicSlotCount)
  const artifactDust = useGameStore((s) => s.artifactDust)
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)
  const relicPresets = useGameStore((s) => s.relicPresets ?? [[], [], []])
  const classCounts = useGameStore(useShallow(getEquippedClassCounts))
  const dustPerMin = useGameStore((s) => getSynthesizerRates(s).dustPerMin)
  const era = useGameStore((s) => getCurrentEra(s.lifetimePoints).era)
  const eraDustMult = 1 + 0.5 * Math.max(0, era - 1)

  const activeResonances = (
    Object.entries(classCounts) as [RelicClass, number][]
  ).filter(([, count]) => count >= 2)
  return (
    <div className="flex flex-col gap-2.5 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark bg-(--bg-primary)/40">
      {/* Dust balance */}
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest whitespace-nowrap shrink-0">
          <span className="sm:hidden">Relics</span>
          <span className="hidden sm:inline">Relics &amp; Artifacts</span>
        </p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10 whitespace-nowrap min-w-0">
          <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">
            Dust:
          </span>
          <span className="text-xs font-mono font-black text-amber-400">
            {fmt(BigInt(artifactDust))}
          </span>
          {dustPerMin > 0 && (
            <span
              title={`Includes Era ${era} Dust bonus (${eraDustMult}x). Resets with run Era on Prestige.`}
              className="text-[10px] font-mono text-amber-300/80 truncate"
            >
              (+
              {dustPerMin >= 10
                ? dustPerMin.toFixed(1)
                : dustPerMin.toFixed(2).replace(/\.00$/, '')}
              /m ·{' '}
              {isCompact
                ? `E${era} ${eraDustMult}x`
                : `Era ${era}: ${eraDustMult}x`}
              )
            </span>
          )}
        </div>
      </div>

      {dustPerMin === 0 && (
        <p className="text-[10px] font-mono text-amber-300/80 bg-amber-500/5 border border-amber-500/20 rounded-lg px-2.5 py-1.5 leading-snug">
          Synthesize passive Dust in Equipment → Synthesizers or launch
          Excavation Probes.
        </p>
      )}

      {/* Loadout Presets Bar - shown once player has enough relics to swap */}
      {unlockedRelics.length >= 4 && (
        <div className="card rounded-xl p-2 bg-(--bg-surface) border border-(--border-default) flex flex-col gap-1.5">
          <div className="flex items-center justify-between flex-wrap gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--text-secondary)">
              Loadout Presets
            </span>
            <span className="text-[9px] font-mono text-(--text-secondary)/70">
              Tap 💾 to save current slots · tap name to load
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
            {PRESET_NAMES.map((name, i) => {
              const savedIds = (relicPresets[i] ?? []).filter(
                (id): id is number => id !== null
              )
              const hasSaved = savedIds.length > 0
              const presetSummary = hasSaved
                ? savedIds
                    .map((id) => RELIC_MAP[id]?.name ?? `#${id}`)
                    .join(', ')
                : 'Empty — equip relics below and tap 💾 to save'

              return (
                <div
                  key={name}
                  className={[
                    'flex items-center border rounded-lg overflow-hidden bg-(--bg-elevated)',
                    hasSaved
                      ? 'border-cyan-400/45'
                      : 'border-(--border-default)'
                  ].join(' ')}
                >
                  <button
                    onClick={() => loadRelicPreset(i)}
                    title={`Equip Preset #${i + 1} (${name}): ${presetSummary}`}
                    className={[
                      'px-2 py-1 transition-colors cursor-pointer font-bold flex items-center gap-1',
                      hasSaved
                        ? 'text-(--text-primary) hover:text-cyan-300'
                        : 'text-(--text-secondary)/70 hover:text-(--text-primary)'
                    ].join(' ')}
                  >
                    <span>
                      P{i + 1}: {name}
                    </span>
                    {hasSaved && (
                      <span className="text-[9px] text-cyan-300">
                        ({savedIds.length})
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => saveRelicPreset(i)}
                    title={`Save currently equipped relics to Preset #${i + 1}`}
                    className="px-1.5 py-1 bg-black/40 hover:bg-cyan-500/20 text-(--text-secondary) hover:text-white transition-colors border-l border-(--border-default)/50 cursor-pointer"
                  >
                    💾
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Class Resonance Banner */}
      {activeResonances.length > 0 && (
        <div className="rounded-xl p-2.5 border border-cyan-400/40 bg-cyan-950/20 flex flex-col gap-1 font-mono text-[11px]">
          <span className="text-[9px] font-black uppercase text-cyan-300 tracking-wider">
            ✦ Active Relic Class Resonance
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {activeResonances.map(([cls, count]) => (
              <span
                key={cls}
                className="px-2 py-0.5 rounded border border-cyan-400/30 bg-cyan-400/10 text-cyan-200 text-[10px]"
              >
                <strong>
                  {cls.toUpperCase()} [{count}]:
                </strong>{' '}
                {count >= 3
                  ? '+35% Effects & +10% Class Output'
                  : '+15% Relic Effects'}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Active relic slots */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2 flex-wrap px-0.5">
          <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
            Active Slots ({slotCount})
          </p>
        </div>
        <div className="flex flex-col gap-1.5">
          {Array.from({ length: slotCount }, (_, i) => (
            <RelicSlot key={i} slotIndex={i} />
          ))}
        </div>
      </div>

      {/* Relic collection */}
      <div className="flex flex-col gap-1.5 pt-2 border-t border-(--border-default)/60">
        <RelicGrid />
      </div>
    </div>
  )
}
