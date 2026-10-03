'use client'

export default function RightColumn() {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Active Workspace
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {/* Workspace tabs render here after Phase 4 unlock integration */}
      </div>
    </div>
  )
}
