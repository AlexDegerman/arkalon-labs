'use client'

import GeneratorList from '@/components/generators/GeneratorList'

export default function LeftColumn() {
  return (
    <div className="flex flex-col h-full border-r border-(--border-default) bg-(--bg-primary)/40 overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) bg-(--bg-surface)/95 shrink-0 flex items-center justify-between">
        <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest">
          Facility Equipment
        </p>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <GeneratorList />
      </div>
    </div>
  )
}
