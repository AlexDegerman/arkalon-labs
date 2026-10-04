'use client'

import ArkalonSphere from '@/components/arkalon/ArkalonSphere'
import ArkalonTerminal from '@/components/arkalon/ArkalonTerminal'

// Static boot line shown before the store is hydrated
const BOOT_LINES = ['System check complete. Core online.']

export default function CenterColumn() {
  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 overflow-y-auto scrollbar-dark">
        <ArkalonSphere state="idle" interactive={false} size={160} />
        <div className="w-full">
          <ArkalonTerminal lines={BOOT_LINES} maxLines={3} />
        </div>
        {/* Status row - wired in Phase 3 */}
        <div className="w-full flex items-center gap-3 px-1">
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-dot-locked" />
            <span className="text-xs font-mono text-(--text-secondary)">
              Anomaly: standby
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="status-dot status-dot-locked" />
            <span className="text-xs font-mono text-(--text-secondary)">
              Probe: 0
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
