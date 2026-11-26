'use client'

import { memo, useRef, useState } from 'react'
import {
  ZONE_DEFINITIONS,
  ZONE_MAP,
  SUBSYSTEM_DEFINITIONS,
  getVeteranRank,
  getScanDuration,
  getProbeSpeedOverflowMultiplier,
  isZoneUnlocked
} from '@/lib/excavationDefs'
import { formatCountdown, formatDuration } from '@/lib/format'
import ProgressBar from '@/components/ui/ProgressBar'
import type { ProbeState, ExcavationZone, ProbeSubsystem } from '@/types/game'
import {
  launchProbe,
  recallProbe
} from '@/app/stores/actions/excavationActions'
import { useGameStore } from '@/app/stores/gameStore'
import { getSynthesizerRates } from '@/lib/synthesizerDefs'
import { getCurrentEra } from '@/lib/eraThresholds'

interface Props {
  probe: ProbeState
}

function ProbeCard({ probe }: Props) {
  const [selectedSubsystem, setSelectedSubsystem] = useState<ProbeSubsystem>(
    probe.subsystem ?? 'none'
  )
  const [confirmRecall, setConfirmRecall] = useState(false)
  const excavationDisabled = useGameStore(
    (s) => s.activeChallengeRestrictions?.excavationDisabled ?? false
  )

  const isIdle = probe.status === 'idle'
  const isScanning = probe.status === 'scanning'
  const isRepairing = probe.status === 'repairing'

  const probeSpeedBonus = useGameStore(
    (s) => getSynthesizerRates(s).probeSpeedBonus
  )
  const era = useGameStore((s) => getCurrentEra(s.lifetimePoints).era)
  const voidUnlocked = useGameStore((s) => isZoneUnlocked('void', s))
  const singUnlocked = useGameStore((s) => isZoneUnlocked('singularity', s))
  const omegaUnlocked = useGameStore((s) => isZoneUnlocked('omega', s))
  const dysonSwarmLevel = useGameStore((s) => s.dysonSwarmLevel ?? 0)
  const opsUnlocked = useGameStore((s) => s.unlocks.anomalousOperations)
  const hasRelicMaster = useGameStore(
    (s) => s.achievements?.includes('relic_all') ?? false
  )
  const dustGlobalMult =
    (1 + 0.5 * Math.max(0, era - 1)) *
    (1 + 0.25 * dysonSwarmLevel) *
    (hasRelicMaster ? 1.15 : 1)
  const rankInfo = getVeteranRank(probe.expeditionsCompleted ?? 0)
  const zoneDef = probe.zone ? ZONE_MAP[probe.zone] : null
  const activeSubsystem = probe.subsystem ?? 'none'
  const effectiveDuration =
    probe.scanDuration ??
    (probe.zone
      ? getScanDuration(probe.zone, activeSubsystem, probeSpeedBonus)
      : 0)

  const scanProgress =
    isScanning && effectiveDuration > 0
      ? Math.max(0, 1 - probe.timerRemaining / effectiveDuration)
      : 0

  const maxSeenRepairRef = useRef(0)
  if (!isRepairing) {
    maxSeenRepairRef.current = 0
  } else if (probe.repairTimerRemaining > maxSeenRepairRef.current) {
    maxSeenRepairRef.current = probe.repairTimerRemaining
  }

  const minRepair = activeSubsystem === 'shielding' ? 90 : 180
  const maxRepair = activeSubsystem === 'shielding' ? 1800 : 3600
  const totalRepairTime =
    probe.repairDuration ??
    (maxSeenRepairRef.current > minRepair ? maxRepair : minRepair)
  const repairProgress = isRepairing
    ? Math.max(0, 1 - probe.repairTimerRemaining / totalRepairTime)
    : 0

  const scanOverflow = probe.zone
    ? getProbeSpeedOverflowMultiplier(
        probe.zone,
        activeSubsystem,
        probeSpeedBonus
      )
    : 1
  const scanDustMult =
    rankInfo.dustMultiplier *
    (activeSubsystem === 'siphon' ? 1.5 : 1) *
    dustGlobalMult *
    scanOverflow
  const scanSuccessRate = zoneDef
    ? Math.min(0.95, zoneDef.successRate + rankInfo.successBonus)
    : 0
  const scanRelicChance = zoneDef
    ? zoneDef.relicDropChance + (activeSubsystem === 'siphon' ? 0.05 : 0)
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
                ? 'bg-(--border-accent)'
                : isRepairing
                  ? 'bg-amber-400'
                  : 'bg-(--status-locked)'
            ].join(' ')}
          />
          <span className="text-xs font-mono font-bold text-(--text-primary)">
            Probe #{probe.id}
          </span>
          <span
            title={`${rankInfo.title}: +${Math.round(rankInfo.successBonus * 100)}% Success, +${Math.round((rankInfo.dustMultiplier - 1) * 100)}% Dust (${probe.expeditionsCompleted ?? 0} missions)`}
            className="text-[9px] font-mono font-black px-1.5 py-0.2 rounded border border-amber-500/40 bg-amber-500/10 text-amber-300"
          >
            ★ Lv{rankInfo.rank} {rankInfo.title}
          </span>
          {probe.subsystem && probe.subsystem !== 'none' && (
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border border-cyan-400/40 bg-cyan-400/10 text-cyan-300 uppercase">
              {probe.subsystem}
            </span>
          )}
        </div>
        <span className="text-xs font-mono font-bold text-(--text-accent)">
          {isScanning
            ? formatCountdown(probe.timerRemaining)
            : isRepairing
              ? `Repair: ${formatCountdown(probe.repairTimerRemaining)}`
              : 'Ready'}
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

      {/* Subsystem & Zone configuration when idle */}
      {isIdle && (
        <div className="flex flex-col gap-2 pt-1 font-mono">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-(--text-secondary) uppercase tracking-wider">
              1. Modular Subsystem:
            </span>
            <div className="grid grid-cols-2 @[420px]:grid-cols-4 gap-1">
              {SUBSYSTEM_DEFINITIONS.map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubsystem(sub.id)}
                  title={sub.description}
                  className={[
                    'px-2 py-1 rounded border text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer',
                    selectedSubsystem === sub.id
                      ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300 font-bold'
                      : 'border-(--border-default) bg-(--bg-elevated)/40 text-(--text-secondary)'
                  ].join(' ')}
                >
                  <span>{sub.icon}</span>
                  <span>{sub.label}</span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-cyan-300/80 leading-snug">
              {
                SUBSYSTEM_DEFINITIONS.find((s) => s.id === selectedSubsystem)
                  ?.description
              }
            </p>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-(--text-secondary) uppercase tracking-wider">
              2. Launch Vector:
            </span>
            <div className="flex flex-col gap-1.5">
              {ZONE_DEFINITIONS.map((zone) => {
                const unlocked =
                  zone.zone === 'void'
                    ? voidUnlocked
                    : zone.zone === 'singularity'
                      ? singUnlocked
                      : zone.zone === 'omega'
                        ? omegaUnlocked
                        : true
                if (!unlocked) {
                  return (
                    <div
                      key={zone.zone}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg border border-dashed border-(--border-default)/50 bg-(--bg-elevated)/25 text-[10px] text-(--text-secondary)/60"
                    >
                      <span>🔒 {zone.label}</span>
                      <span>{zone.unlockHint}</span>
                    </div>
                  )
                }

                const overflow = getProbeSpeedOverflowMultiplier(
                  zone.zone,
                  selectedSubsystem,
                  probeSpeedBonus
                )
                const duration = getScanDuration(
                  zone.zone,
                  selectedSubsystem,
                  probeSpeedBonus
                )
                const effectiveSuccess = Math.min(
                  0.95,
                  zone.successRate + rankInfo.successBonus
                )
                const dustMin = Math.floor(
                  zone.dustYieldMin *
                    rankInfo.dustMultiplier *
                    (selectedSubsystem === 'siphon' ? 1.5 : 1) *
                    dustGlobalMult *
                    overflow
                )
                const dustMax = Math.floor(
                  zone.dustYieldMax *
                    rankInfo.dustMultiplier *
                    (selectedSubsystem === 'siphon' ? 1.5 : 1) *
                    dustGlobalMult *
                    overflow
                )
                const opMin = opsUnlocked
                  ? Math.floor(
                      zone.opYieldMin * rankInfo.dustMultiplier * overflow
                    )
                  : 0
                const opMax = opsUnlocked
                  ? Math.floor(
                      zone.opYieldMax * rankInfo.dustMultiplier * overflow
                    )
                  : 0
                const repairMins =
                  zone.repairSeconds > 0
                    ? Math.round(
                        (selectedSubsystem === 'shielding'
                          ? zone.repairSeconds * 0.5
                          : zone.repairSeconds) / 60
                      )
                    : 0
                const relicRate =
                  zone.relicDropChance > 0
                    ? zone.relicDropChance +
                      (selectedSubsystem === 'siphon' ? 0.05 : 0)
                    : 0

                const titleColor =
                  zone.zone === 'omega'
                    ? 'g-tqgs font-bold'
                    : zone.zone === 'singularity'
                      ? 'g-sp font-bold'
                      : zone.zone === 'void'
                        ? 'g-str font-bold'
                        : zone.zone === 'unstable'
                          ? 'g-oc font-bold'
                          : 'text-emerald-400 font-bold'

                return (
                  <button
                    key={zone.zone}
                    disabled={excavationDisabled}
                    onClick={() =>
                      launchProbe(
                        probe.id,
                        zone.zone as ExcavationZone,
                        selectedSubsystem
                      )
                    }
                    className={[
                      'flex items-center justify-between gap-2 flex-wrap p-2 rounded-lg border text-xs transition-all select-none',
                      excavationDisabled
                        ? 'border-(--border-default) bg-(--bg-elevated)/30 opacity-50 cursor-not-allowed'
                        : 'cursor-pointer border-(--border-default) bg-(--bg-elevated)/60 hover:bg-(--bg-elevated) hover:border-(--border-accent)'
                    ].join(' ')}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={titleColor}>{zone.label}</span>
                      <span className="text-[10px] text-(--text-secondary)">
                        {Math.round(effectiveSuccess * 100)}%
                      </span>
                      {repairMins > 0 && (
                        <span className="text-[9px] font-bold text-amber-300">
                          · Fail: {repairMins}m Repair
                        </span>
                      )}
                      {overflow > 1.05 && (
                        <span className="text-[9px] font-bold text-cyan-300">
                          · {overflow.toFixed(1)}x Speed Yield
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] ml-auto flex-wrap">
                      <span className="text-(--text-secondary)">
                        {formatDuration(duration)}
                      </span>
                      <span className="text-amber-400 font-bold">
                        {dustMin.toLocaleString()}-{dustMax.toLocaleString()}{' '}
                        Dust
                      </span>
                      {opMax > 0 && (
                        <span className="text-cyan-300 font-bold">
                          +{opMin}-{opMax} PTS
                        </span>
                      )}
                      {zone.researchCutFraction > 0 && (
                        <span className="text-purple-300 font-bold">
                          -{Math.round(zone.researchCutFraction * 100)}% Res
                        </span>
                      )}
                      {relicRate > 0 && (
                        <span className="text-(--text-accent) font-bold">
                          {Math.round(relicRate * 100)}% Relic
                        </span>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Telemetry during scan */}
      {isScanning && zoneDef && (
        <div className="flex flex-col gap-1.5 pt-1 border-t border-(--border-default)/50 font-mono">
          <div className="flex items-center justify-between text-[11px] text-(--text-secondary) flex-wrap gap-1">
            <span>
              Yield: {Math.floor(zoneDef.dustYieldMin * scanDustMult)}-
              {Math.floor(zoneDef.dustYieldMax * scanDustMult)} Dust
            </span>
            {scanRelicChance > 0 && (
              <span className="text-(--text-accent)">
                {Math.round(scanRelicChance * 100)}% Relic Probability
              </span>
            )}
            <span>Success: {Math.round(scanSuccessRate * 100)}%</span>
          </div>
          {!excavationDisabled && (
            <div className="flex items-center justify-end gap-1.5">
              {confirmRecall ? (
                <>
                  <button
                    onClick={() => {
                      setConfirmRecall(false)
                      recallProbe(probe.id)
                    }}
                    className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-red-500 bg-red-500 text-black cursor-pointer"
                  >
                    Confirm Recall (Forfeit Scan)
                  </button>
                  <button
                    onClick={() => setConfirmRecall(false)}
                    className="px-2 py-0.5 text-[10px] font-bold rounded border border-(--border-default) bg-(--bg-elevated) text-(--text-secondary) cursor-pointer"
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setConfirmRecall(true)}
                  className="px-2 py-0.5 text-[10px] font-bold uppercase rounded border border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer"
                >
                  Recall Probe
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(ProbeCard)
