'use client'

import { useActiveTab } from '@/hooks/useActiveTab'
import WorkspacePanel from '@/components/layout/WorkspacePanel'
import WorkspaceDirectory from '@/components/layout/WorkspaceDirectory'
import { FEATURE_MAP, TAB_FEATURE } from '@/lib/featureRegistry'
import { useUIStore } from '@/app/stores/uiStore'
import { useActionSignals } from '@/hooks/useActionSignals'

export default function RightColumn() {
  const workspaceTab = useActiveTab((s) => s.workspaceTab)
  const setWorkspaceTab = useActiveTab((s) => s.setWorkspaceTab)
  const unseenUnlockedTabs = useUIStore((s) => s.unseenUnlockedTabs)
  const actionSignals = useActionSignals()

  if (workspaceTab === 'directory') {
    return (
      <div className="flex flex-col h-full overflow-hidden border-l border-(--border-default) bg-(--bg-primary)/30">
        <WorkspaceDirectory />
      </div>
    )
  }

  const featureKey = TAB_FEATURE[workspaceTab]
  const label = featureKey ? FEATURE_MAP[featureKey].label : workspaceTab
  const hasNewUnlock = unseenUnlockedTabs.length > 0
  const hasOtherAction = Object.keys(actionSignals).some(
    (k) => k !== workspaceTab
  )

  return (
    <div className="flex flex-col h-full overflow-hidden border-l border-(--border-default) bg-(--bg-primary)/30">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0">
        <button
          onClick={() => setWorkspaceTab('directory')}
          className={[
            'text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-1 rounded border transition-all cursor-pointer shrink-0 flex items-center gap-1.5',
            hasNewUnlock
              ? 'border-(--status-success) bg-(--status-success)/15 text-(--status-success) shadow-[0_0_12px_rgba(57,255,138,0.35)]'
              : hasOtherAction
                ? 'border-(--border-accent)/70 bg-(--border-accent)/10 text-(--text-accent)'
                : 'border-(--border-default) text-(--text-secondary) hover:text-(--border-accent) hover:border-(--border-accent)'
          ].join(' ')}
          aria-label="Back to facility directory"
        >
          <span>← Directory</span>
          {hasNewUnlock && (
            <span className="px-1 py-0.2 rounded bg-(--status-success) text-[#080c14] text-[9px] font-black">
              +{unseenUnlockedTabs.length} NEW
            </span>
          )}
          {!hasNewUnlock && hasOtherAction && (
            <span className="w-1.5 h-1.5 rounded-full bg-(--border-accent)" />
          )}
        </button>
        <span className="text-[10px] font-mono font-bold text-(--text-primary) uppercase tracking-widest">
          {label}
        </span>
      </div>
      <WorkspacePanel />
    </div>
  )
}
