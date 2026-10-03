'use client'

export default function CenterColumn() {
  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Arkalon Core
        </p>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4">
        {/* Arkalon SVG sphere renders here in Phase 2 */}
        <div className="w-32 h-32 rounded-full border border-(--border-accent) opacity-30" />
        {/* Terminal console renders here in Phase 2 */}
        <div className="w-full glass rounded p-2">
          <p className="terminal text-(--text-secondary) text-xs">
            &gt; System standby...
          </p>
        </div>
      </div>
    </div>
  )
}
