'use client'

import { useEffect, useRef } from 'react'
import { useGameStore } from '@/app/stores/gameStore'
import ArkalonSphere from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'
import { useArkalonDialogue } from '@/hooks/useArkalonDialogue'
import { ANOMALY_DIALOGUE_MAP } from '@/lib/arkalonDialogue'
import { applyArkalonClickBoost } from '@/app/stores/gameActions'
import type { ArkalonState } from '@/components/arkalon/ArkalonSphere'

export default function CenterColumn() {
  const activeAnomaly = useGameStore((s) => s.activeAnomalyType)
  const interactiveArkalon = useGameStore((s) => s.unlocks.interactiveArkalon)
  const probeCount = useGameStore((s) => s.probes.length)
  const { lines, pushDialogue } = useArkalonDialogue()
  const prevAnomalyRef = useRef<string | null>(null)

  // Trigger anomaly-specific dialogue when a new anomaly spawns
  useEffect(() => {
    if (activeAnomaly && activeAnomaly !== prevAnomalyRef.current) {
      prevAnomalyRef.current = activeAnomaly
      const triggerId = ANOMALY_DIALOGUE_MAP[activeAnomaly]
      if (triggerId) pushDialogue(triggerId)
    }
    if (!activeAnomaly) {
      prevAnomalyRef.current = null
    }
  }, [activeAnomaly, pushDialogue])

  // Sphere visual state
  const sphereState: ArkalonState = activeAnomaly ? 'anomaly' : 'idle'

  function handleSphereClick() {
    if (!interactiveArkalon) return
    applyArkalonClickBoost()
    pushDialogue('arkalon_click')
  }

  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 overflow-y-auto scrollbar-dark">
        <ArkalonSphere
          state={sphereState}
          interactive={interactiveArkalon}
          onClick={handleSphereClick}
          size={160}
        />
        <div className="w-full">
          <ArkalonTerminal lines={lines} maxLines={3} />
        </div>

        {/* Status row */}
        <div className="w-full flex items-center gap-3 px-1 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span
              className={[
                'status-dot',
                activeAnomaly ? 'bg-[#ef4444] dot-pulse' : 'status-dot-locked'
              ].join(' ')}
            />
            <span className="text-xs font-mono text-(--text-secondary)">
              {activeAnomaly ? 'Anomaly active' : 'Anomaly: standby'}
            </span>
          </div>
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
        </div>
      </div>
    </div>
  )
}
