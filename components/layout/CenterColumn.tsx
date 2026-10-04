'use client'

import ArkalonSphere from '@/components/arkalon/ArkalonSphere'

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
        {/* Terminal console renders here in Commit 2.3 */}
        <div className="w-full glass rounded p-3">
          <p className="terminal text-(--text-secondary) text-xs">
            &gt; System standby...
          </p>
        </div>
      </div>
    </div>
  )
}
