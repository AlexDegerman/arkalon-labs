'use client'

import { useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ArkalonSphere from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import { useArkalonDialogue } from '@/hooks/useArkalonDialogue'
import { applyArkalonClickBoost } from '@/app/stores/gameActions'
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
    anomalyStatusLabel = 'Anomaly: standby'
  }

  // Click boost indicator (O2 required)
  const showClickHint = interactiveArkalon && o2Complete

  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 overflow-y-auto scrollbar-dark">
        {/* Sphere */}
        <div className="relative">
          <ArkalonSphere
            state={sphereState}
            interactive={interactiveArkalon}
            onClick={handleSphereClick}
            size={160}
          />
          {/* Click hint overlay - shown when O2 is complete */}
          {showClickHint && !activeAnomaly && (
            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-[0.6rem] font-mono text-(--text-secondary)">
                click - +5% research speed
              </span>
            </div>
          )}
        </div>

        {/* Spacer when hint shown */}
        {showClickHint && !activeAnomaly && <div className="h-1" />}

        {/* Terminal */}
        <div className="w-full">
          <ArkalonTerminal lines={lines} maxLines={3} />
        </div>

        {/* Status row */}
        <div className="w-full flex flex-col gap-1.5 px-1">
          {/* Anomaly status */}
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'status-dot',
                activeAnomaly
                  ? 'bg-#ef4444 dot-pulse'
                  : o3Complete
                    ? 'status-dot-active dot-pulse'
                    : 'status-dot-locked'
              ].join(' ')}
            />
            <span className="text-xs font-mono text-(--text-secondary)">
              {anomalyStatusLabel}
            </span>
          </div>

          {/* Probe status */}
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'status-dot',
                probeCount > 0 ? 'status-dot-active' : 'status-dot-locked'
              ].join(' ')}
            />
            <span className="text-xs font-mono text-(--text-secondary)">
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
