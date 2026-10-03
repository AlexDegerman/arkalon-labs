'use client'

export default function FooterBar() {
  return (
    <footer className="h-8 flex items-center justify-between px-4 border-t border-(--border-default) bg-(--bg-surface) shrink-0">
      <span className="text-xs font-mono text-(--text-secondary)">
        Arkalon Operations // Cycle 1
      </span>
      <span className="text-xs font-mono text-(--text-secondary)">
        Anomaly scan: active
      </span>
      <span className="text-xs font-mono text-(--text-secondary)">
        Save: --
      </span>
    </footer>
  )
}
