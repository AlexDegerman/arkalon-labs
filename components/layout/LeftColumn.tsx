'use client'

import GeneratorList from '@/components/generators/GeneratorList'

export default function LeftColumn() {
  return (
    <div className="flex flex-col h-full border-r border-(--border-default) overflow-hidden">
      <div className="px-3 py-2 border-b border-(--border-default) shrink-0">
        <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-widest">
          Facility Equipment
        </p>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <GeneratorList />
      </div>
    </div>
  )
}
