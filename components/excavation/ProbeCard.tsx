'use client'

import { memo } from 'react'
import { launchProbe } from '@/app/stores/gameActions'
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

  // Compute progress for scanning probes
  const scanProgress =
    isScanning && zoneDef
      ? Math.max(0, 1 - probe.timerRemaining / zoneDef.durationSeconds)
      : 0

  const repairProgress = isRepairing
    ? Math.max(0, 1 - probe.repairTimerRemaining / 600)
    : 0

  return (
    <div className="card rounded-lg p-3 flex flex-col gap-2">
      {/* Probe header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={[
              'status-dot',
              isScanning
                ? 'status-dot-active dot-pulse'
                : isRepairing
                  ? 'status-dot-warning'
                  : 'status-dot-locked'
            ].join(' ')}
          />
          <span className="text-xs font-mono font-semibold text-(--text-primary)">
            Probe #{probe.id}
          </span>
          {zoneDef && (
            <span className="chip border-(--border-default) text-(--text-secondary) text-[0.6rem]">
              {zoneDef.label}
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-(--text-secondary)">
          {isScanning
            ? formatCountdown(probe.timerRemaining)
            : isRepairing
              ? `Repair: ${formatCountdown(probe.repairTimerRemaining)}`
              : 'Idle'}
        </span>
      </div>

      {/* Progress bar */}
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

      {/* Zone selector for idle probes */}
      {isIdle && (
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.65rem] text-(--text-secondary)">
            Select destination:
          </p>
          <div className="flex flex-col gap-1">
            {ZONE_DEFINITIONS.map((zone) => (
              <button
                key={zone.zone}
                onClick={() =>
                  launchProbe(probe.id, zone.zone as ExcavationZone)
                }
                className={[
                  'flex items-center justify-between px-2 py-1.5 rounded border text-xs',
                  'transition-colors focus-visible:outline-none focus-visible:ring-1',
                  'focus-visible:ring-(--border-accent)',
                  'border-(--border-default) hover:border-(--text-secondary)',
                  'text-(--text-secondary) hover:text-(--text-primary)'
                ].join(' ')}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{zone.label}</span>
                  <span className="text-[0.6rem] opacity-70">
                    {Math.round(zone.successRate * 100)}% success
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[0.6rem]">
                  <span>{formatDuration(zone.durationSeconds)}</span>
                  <span className="text-(--text-accent)">
                    {zone.dustYieldMin}-{zone.dustYieldMax} dust
                  </span>
                  {zone.relicDropChance > 0 && (
                    <span className="text-(--status-warning)">
                      {Math.round(zone.relicDropChance * 100)}% relic
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scanning info */}
      {isScanning && zoneDef && (
        <div className="flex items-center justify-between text-[0.65rem]">
          <span className="text-(--text-secondary)">
            Dust: {zoneDef.dustYieldMin}-{zoneDef.dustYieldMax}
          </span>
          {zoneDef.relicDropChance > 0 && (
            <span className="text-(--status-warning)">
              {Math.round(zoneDef.relicDropChance * 100)}% relic chance
            </span>
          )}
          <span className="text-(--text-secondary)">
            Success: {Math.round(zoneDef.successRate * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

export default memo(ProbeCard)
