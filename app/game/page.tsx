import LeftColumn from '@/components/layout/LeftColumn'
import CenterColumn from '@/components/layout/CenterColumn'
import RightColumn from '@/components/layout/RightColumn'
import FooterBar from '@/components/layout/FooterBar'

export default function GamePage() {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-(--bg-primary)">
      {/* PC header */}
      <header className="hidden lg:flex items-center justify-between px-4 py-2 border-b border-(--border-default) bg-(--bg-surface) shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-(--text-accent) uppercase tracking-widest">
            Arkalon Laboratories
          </span>
          <span className="text-(--border-default)">//</span>
          <span className="font-mono text-xs text-(--text-secondary)">
            Primary Command Engine
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="font-mono text-xs text-(--text-secondary)">
            Era I - Foundational Research
          </span>
        </div>
      </header>

      {/* Three-column layout - desktop only */}
      <div
        className="hidden lg:grid flex-1 overflow-hidden min-h-0"
        style={{ gridTemplateColumns: '40% 28% 32%' }}
      >
        <LeftColumn />
        <CenterColumn />
        <RightColumn />
      </div>

      {/* Mobile layout placeholder - replaced in Commit 1.4 */}
      <div className="lg:hidden flex-1 flex items-center justify-center">
        <p className="font-mono text-xs text-(--text-secondary)">
          Mobile layout initializing...
        </p>
      </div>

      <FooterBar />
    </div>
  )
}
