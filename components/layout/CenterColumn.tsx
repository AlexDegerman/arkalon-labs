'use client'

import { useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ArkalonSphere from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import { useArkalonDialogue } from '@/hooks/useArkalonDialogue'
import { applyArkalonClickBoost } from '@/app/stores/actions'
import { formatCountdown } from '@/lib/format'
import type { ArkalonState } from '@/components/arkalon/ArkalonSphere'
import { useUIStore } from '@/app/stores/uiStore'
import { dispatchArkalonClick } from '@/lib/dialogueDispatcher'

export default function CenterColumn() {
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const anomalyTimeRemaining = useGameStore((s) => s.anomalyTimeRemaining)
  const timeToNextCheck = useGameStore((s) => s.timeToNextAnomalyCheck)
  const interactiveArkalon = useGameStore((s) => s.unlocks.interactiveArkalon)
  const o3Complete = useGameStore((s) =>
    s.completedResearchNodes.includes('O3')
  )
  const o2Complete = useGameStore((s) =>
    s.completedResearchNodes.includes('O2')
  )
  const probeCount = useGameStore((s) => s.probes.length)
  const prestige1Done = useGameStore((s) => s.stats.totalPrestigesTier1 > 0)
  const prestigeAnimating = useUIStore((s) => s.prestigeAnimating)

  const { lines } = useArkalonDialogue()
  const clickCooldownRef = useRef(false)

  // Determine sphere visual state
  // prestige animation takes priority over anomaly
  const sphereState: ArkalonState = prestigeAnimating
    ? 'prestige'
    : activeAnomaly
      ? 'anomaly'
      : 'idle'

  function handleSphereClick() {
    if (!interactiveArkalon) return

    // Prevent click spam - 500ms cooldown
    if (clickCooldownRef.current) return
    clickCooldownRef.current = true
    setTimeout(() => {
      clickCooldownRef.current = false
    }, 500)

    applyArkalonClickBoost()
    // Dispatcher handles rotation through click responses
    dispatchArkalonClick()
  }

  // Anomaly countdown label (O3 required for specific countdown)
  let anomalyStatusLabel: string
  if (activeAnomaly) {
    anomalyStatusLabel = `Anomaly: ${formatCountdown(anomalyTimeRemaining)}`
  } else if (o3Complete) {
    anomalyStatusLabel = `Next anomaly: ${formatCountdown(timeToNextCheck)}`
  } else {
    anomalyStatusLabel = 'Anomaly: Standby'
  }

  // Click boost indicator (O2 required)
  const showClickHint = interactiveArkalon && o2Complete

  return (
    <div className="flex flex-col h-full border-r border-(--border-default) bg-(--bg-primary)/60 overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between p-4 overflow-y-auto scrollbar-dark">
        {/* Animated vector sphere */}
        <div className="my-auto flex flex-col items-center gap-2">
          <div className="relative">
            <ArkalonSphere
              state={sphereState}
              interactive={interactiveArkalon}
              onClick={handleSphereClick}
              size={150}
            />
          </div>

          {showClickHint && !activeAnomaly && (
            <span className="text-[10px] font-mono text-(--text-accent) font-bold tracking-wide animate-pulse">
              TAP ORB · +5% RESEARCH SPEED
            </span>
          )}
        </div>

        {/* Live Typewriter Terminal Console */}
        <div className="w-full my-2">
          <ArkalonTerminal lines={lines} maxLines={3} />
        </div>

        {/* Diagnostic Status Pips */}
        <div className="w-full grid grid-cols-2 gap-2 p-2 rounded-xl bg-(--bg-surface) border border-(--border-default) shrink-0 text-xs font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <span
              className={[
                'w-2 h-2 rounded-full shrink-0',
                activeAnomaly
                  ? 'bg-red-500 animate-ping'
                  : o3Complete
                    ? 'bg-(--border-accent)'
                    : 'bg-(--status-locked)'
              ].join(' ')}
            />
            <span className="truncate text-(--text-secondary) text-[11px]">
              {anomalyStatusLabel}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate justify-end">
            <span
              className={[
                'w-2 h-2 rounded-full shrink-0',
                probeCount > 0 ? 'bg-amber-400' : 'bg-(--status-locked)'
              ].join(' ')}
            />
            <span className="text-(--text-secondary) text-[11px]">
              Probes: {probeCount}
            </span>
          </div>

          {/* Prestige info - shown after first prestige */}
          {prestige1Done && (
            <div className="flex items-center gap-1.5">
              <span className="status-dot status-dot-active" />
              <span className="text-xs font-mono text-(--text-secondary)">
                Operations: Cycle active
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
