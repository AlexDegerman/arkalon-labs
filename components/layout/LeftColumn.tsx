'use client'

export default function LeftColumn() {
  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Facility Equipment
        </p>
      </div>
      <div className="flex-1 overflow-y-auto">
        {/* Generator list renders here in Phase 3 */}
      </div>
    </div>
  )
}
