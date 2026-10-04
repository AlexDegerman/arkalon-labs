'use client'

import { useGameStore } from '@/app/stores/gameStore'
import { formatPoints, formatDuration, formatRate } from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'

interface StatRowProps {
  label: string
  value: string
  accent?: boolean
}

function StatRow({ label, value, accent = false }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-(--border-default) last:border-b-0">
      <span className="text-xs text-(--text-secondary)">{label}</span>
      <span
        className={[
          'text-xs font-mono font-semibold',
          accent ? 'text-(--text-accent)' : 'text-(--text-primary)'
        ].join(' ')}
      >
        {value}
      </span>
    </div>
  )
}

interface StatSectionProps {
  title: string
  children: React.ReactNode
}

function StatSection({ title, children }: StatSectionProps) {
  return (
    <div className="card rounded-lg p-3 flex flex-col gap-0">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide mb-2">
        {title}
      </p>
      {children}
    </div>
  )
}

export default function StatsWorkspace() {
  const stats = useGameStore((s) => s.stats)
  const lifetimePoints = useGameStore((s) => s.lifetimePoints)
  const researchPoints = useGameStore((s) => s.researchPoints)
  const pps = useGameStore((s) => s.cachedPointsPerSecond)
  const generators = useGameStore((s) => s.generators)
  const completedResearch = useGameStore((s) => s.completedResearchNodes)
  const unlockedRelics = useGameStore((s) => s.unlockedRelics)
  const arkalonResonance = useGameStore((s) => s.arkalonResonance)
  const chronalFractures = useGameStore((s) => s.chronalFractures)
  const omniSpars = useGameStore((s) => s.omniSpars)
  const completedMegaprojects = useGameStore((s) => s.completedMegaprojects)
  const challengeRecords = useGameStore((s) => s.challengeRecords)

  const era = getCurrentEra(lifetimePoints)

  const totalGenerators = generators.reduce(
    (sum, g) => sum + Number(g.quantity),
    0
  )

  const totalChallengeCompletions = Object.values(challengeRecords).reduce(
    (sum, r) => sum + r.completedTiers,
    0
  )

  // Time since last prestige
  const timeSincePrestige =
    stats.lastPrestigeTime > 0
      ? Math.floor((Date.now() - stats.lastPrestigeTime) / 1000)
      : 0

  // Best run stats
  const bestPPSFormatted = formatRate(stats.peakRPPerSec)

  return (
    <div className="flex flex-col gap-3 p-3 h-full overflow-y-auto scrollbar-dark">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Operational Diagnostics
      </p>

      {/* Production */}
      <StatSection title="Production">
        <StatRow
          label="Current RP"
          value={formatPoints(researchPoints)}
          accent
        />
        <StatRow
          label="Lifetime RP"
          value={formatPoints(lifetimePoints)}
          accent
        />
        <StatRow label="RP/sec" value={formatRate(pps)} accent />
        <StatRow label="Peak RP/sec" value={bestPPSFormatted} />
        <StatRow label="Current Era" value={`Era ${era.era}: ${era.name}`} />
      </StatSection>

      {/* Session */}
      <StatSection title="Session">
        <StatRow
          label="Session Time"
          value={formatDuration(stats.totalSessionPlaytime)}
        />
        {stats.lastPrestigeTime > 0 && (
          <StatRow
            label="Since Last Prestige"
            value={formatDuration(timeSincePrestige)}
          />
        )}
      </StatSection>

      {/* Facility */}
      <StatSection title="Facility">
        <StatRow
          label="Total Generators"
          value={totalGenerators.toLocaleString()}
        />
        <StatRow
          label="Research Nodes"
          value={`${completedResearch.length}/44`}
        />
        <StatRow
          label="Relics Discovered"
          value={`${unlockedRelics.length}/20`}
        />
        <StatRow
          label="Megaprojects Built"
          value={`${completedMegaprojects.length}/3`}
        />
        <StatRow
          label="Challenge Tiers"
          value={totalChallengeCompletions.toLocaleString()}
        />
      </StatSection>

      {/* Anomalies */}
      <StatSection title="Anomalies">
        <StatRow
          label="Anomalies Resolved"
          value={stats.totalAnomaliesResolved.toLocaleString()}
        />
      </StatSection>

      {/* Prestige */}
      <StatSection title="Prestige">
        <StatRow
          label="Reality Recalibrations"
          value={stats.totalPrestigesTier1.toLocaleString()}
        />
        <StatRow
          label="Timeline Severances"
          value={stats.totalPrestigesTier2.toLocaleString()}
        />
        <StatRow
          label="Singular Syntheses"
          value={stats.totalPrestigesTier3.toLocaleString()}
        />
        {arkalonResonance > 0 && (
          <StatRow
            label="Arkalon Resonance"
            value={`${formatPoints(BigInt(Math.floor(arkalonResonance)))} AR`}
          />
        )}
        {chronalFractures > 0 && (
          <StatRow
            label="Chronal Fractures"
            value={`${formatPoints(BigInt(Math.floor(chronalFractures)))} CF`}
          />
        )}
        {omniSpars > 0 && (
          <StatRow
            label="Omni-Spars"
            value={`${formatPoints(BigInt(Math.floor(omniSpars)))} OS`}
          />
        )}
      </StatSection>
    </div>
  )
}
