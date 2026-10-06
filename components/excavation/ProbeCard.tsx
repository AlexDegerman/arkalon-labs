'use client'

import { memo } from 'react'
import { launchProbe } from '@/app/stores/actions'
import { ZONE_DEFINITIONS, ZONE_MAP } from '@/lib/excavationDefs'
import { formatCountdown, formatDuration } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import type { ProbeState, ExcavationZone } from '@/types/game'

interface Props {
  probe: ProbeState
}

function ProbeCard({ probe }: Props) {
  const isIdle = probe.status === 'idle'
  const isScanning = probe.status === 'scanning'
  const isRepairing = probe.status === 'repairing'

  const zoneDef = probe.zone ? ZONE_MAP[probe.zone] : null

  const scanProgress =
    isScanning && zoneDef
      ? Math.max(0, 1 - probe.timerRemaining / zoneDef.durationSeconds)
      : 0

  const repairProgress = isRepairing
    ? Math.max(0, 1 - probe.repairTimerRemaining / 600)
    : 0

  return (
    <div className="card rounded-xl p-3 sm:p-3.5 flex flex-col gap-2.5 border border-(--border-default) bg-(--bg-surface)">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={[
              'w-2 h-2 rounded-full shrink-0',
              isScanning
                ? 'bg-(--border-accent) animate-pulse'
                : isRepairing
                  ? 'bg-amber-400'
                  : 'bg-(--status-locked)'
            ].join(' ')}
          />
          <span className="text-xs font-mono font-bold text-(--text-primary)">
            Probe #{probe.id}
          </span>
          {zoneDef && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary)">
              {zoneDef.label}
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-bold text-(--text-accent)">
          {isScanning
            ? formatCountdown(probe.timerRemaining)
            : isRepairing
              ? `Repair: ${formatCountdown(probe.repairTimerRemaining)}`
              : 'Standby'}
        </span>
      </div>

      {/* Progress Bars */}
      {isScanning && (
        <ProgressBar
          progress={scanProgress}
          variant="default"
          height={3}
          animated={false}
        />
      )}
      {isRepairing && (
        <ProgressBar
          progress={repairProgress}
          variant="warning"
          height={3}
          animated={false}
        />
      )}

      {/* Zone selection deck */}
      {isIdle && (
        <div className="flex flex-col gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-(--text-secondary) uppercase tracking-wider">
            Select Target Coordinates:
          </span>
          <div className="flex flex-col gap-1.5">
            {ZONE_DEFINITIONS.map((zone) => (
              <button
                key={zone.zone}
                onClick={() =>
                  launchProbe(probe.id, zone.zone as ExcavationZone)
                }
                className={[
                  'flex items-center justify-between p-2 rounded-lg border text-xs font-mono transition-all cursor-pointer select-none',
                  'border-(--border-default) bg-(--bg-elevated)/60 hover:border-(--border-accent) hover:bg-(--bg-elevated)'
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-(--text-primary)">
                    {zone.label}
                  </span>
                  <span className="text-[10px] text-(--text-secondary)/70">
                    {Math.round(zone.successRate * 100)}% Success
                  </span>
                </div>
                <div className="flex items-center gap-2.5 text-[10px]">
                  <span className="text-(--text-secondary)">
                    {formatDuration(zone.durationSeconds)}
                  </span>
                  <span className="text-amber-400 font-bold">
                    {zone.dustYieldMin}-{zone.dustYieldMax} Dust
                  </span>
                  {zone.relicDropChance > 0 && (
                    <span className="text-(--text-accent) font-bold">
                      {Math.round(zone.relicDropChance * 100)}% Relic
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Telemetry during scan */}
      {isScanning && zoneDef && (
        <div className="flex items-center justify-between text-[11px] font-mono text-(--text-secondary) pt-1 border-t border-(--border-default)/50">
          <span>
            Yield: {zoneDef.dustYieldMin}-{zoneDef.dustYieldMax} Dust
          </span>
          {zoneDef.relicDropChance > 0 && (
            <span className="text-(--text-accent)">
              {Math.round(zoneDef.relicDropChance * 100)}% Relic Probability
            </span>
          )}
          <span>Success: {Math.round(zoneDef.successRate * 100)}%</span>
        </div>
      )}
    </div>
  )
}

export default memo(ProbeCard)
