'use client'

import { useShallow } from 'zustand/react/shallow'
import { useGameStore } from '@/app/stores/gameStore'
import RelicSlot from '@/components/relics/RelicSlot'
import RelicGrid from '@/components/relics/RelicGrid'
import { getRelicSlotCount, getEquippedClassCounts } from '@/lib/relicDefs'
import { formatPoints } from '@/lib/format'
import { saveRelicPreset, loadRelicPreset } from '@/app/stores/actions/relicActions'
import type { RelicClass } from '@/constants/relics'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'
import { getCurrentEra } from '@/lib/eraThresholds'

const PRESET_NAMES = ['Speedrun', 'Deep Idle', 'Surge Hunter']

export default function RelicsTab() {
  const slotCount = useGameStore(getRelicSlotCount)
  const artifactDust = useGameStore((s) => s.artifactDust)
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)
  const instantSwapUnlocked = useGameStore(
    (s) => (s.cfUpgrades.relic_preservation ?? 0) > 0
  )
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
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Relics & Artifacts
        </p>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-amber-500/30 bg-amber-500/10">
          <span className="text-[10px] font-mono text-amber-300 font-bold uppercase">
            Dust:
          </span>
          <span className="text-xs font-mono font-black text-amber-400">
            {formatPoints(BigInt(artifactDust))}
          </span>
          {dustPerMin > 0 && (
            <span
              title={`Includes Era ${era} Dust bonus (${eraDustMult}x). Resets with run Era on Prestige.`}
              className="text-[10px] font-mono text-amber-300/80"
            >
              (+
              {dustPerMin >= 10
                ? dustPerMin.toFixed(1)
                : dustPerMin.toFixed(2).replace(/\.00$/, '')}
              /m · Era {era}: {eraDustMult}x)
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
        <div className="card rounded-xl p-2 bg-(--bg-surface) border border-(--border-default) flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-(--text-secondary)">
              Loadout Presets
            </span>
            <span className="text-[9px] font-mono text-cyan-300/80">
              (
              {instantSwapUnlocked
                ? 'Instant · Relic Preservation'
                : 'Respects swap cooldown'}
              )
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap font-mono text-[10px]">
            {PRESET_NAMES.map((name, i) => (
              <div
                key={name}
                className="flex items-center border border-(--border-default) rounded-lg overflow-hidden bg-(--bg-elevated)"
              >
                <button
                  onClick={() => loadRelicPreset(i)}
                  title={`Equip Preset #${i + 1} (${name})`}
                  className="px-2 py-1 hover:text-cyan-300 transition-colors cursor-pointer font-bold"
                >
                  P{i + 1}: {name}
                </button>
                <button
                  onClick={() => saveRelicPreset(i)}
                  title={`Save current relics to Preset #${i + 1}`}
                  className="px-1.5 py-1 bg-black/40 hover:bg-cyan-500/20 text-(--text-secondary) hover:text-white transition-colors border-l border-(--border-default)/50 cursor-pointer"
                >
                  💾
                </button>
              </div>
            ))}
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
          <span className="text-[9px] font-mono text-(--text-secondary)/70">
            Unequipping triggers slot cooldown
          </span>
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
