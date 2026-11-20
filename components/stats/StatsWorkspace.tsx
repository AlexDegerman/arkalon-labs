'use client'

import { useGameStore } from '@/app/stores/gameStore'
import {
  formatPoints,
  formatDuration,
  formatRate,
  getAmountColor
} from '@/lib/format'
import { getCurrentEra } from '@/lib/eraThresholds'

interface StatRowProps {
  label: string
  value: string
  accent?: boolean
  valueClass?: string
}

function StatRow({ label, value, accent = false, valueClass }: StatRowProps) {
  return (
    <div className="flex items-baseline justify-between gap-2 py-1 border-b border-(--border-default)/50 last:border-b-0 font-mono text-xs">
      <span className="text-(--text-secondary) shrink-0">{label}</span>
      <span
        className={[
          'font-bold text-right wrap-break-word',
          valueClass
            ? valueClass
            : accent
              ? 'text-(--text-accent)'
              : 'text-(--text-primary)'
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
    <div className="card rounded-lg p-2.5 flex flex-col gap-0">
      <p className="text-[10px] font-mono font-bold text-(--text-secondary) uppercase tracking-widest mb-1 pb-1 border-b border-(--border-default)">
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
  const dysonSwarmLevel = useGameStore((s) => s.dysonSwarmLevel ?? 0)
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
    <div className="flex flex-col gap-2 p-2 sm:p-3 h-full overflow-y-auto scrollbar-dark">
      <p className="text-xs font-mono text-(--text-secondary) uppercase tracking-wide">
        Operational Diagnostics
      </p>

      {/* Production */}
      <StatSection title="Production">
        <StatRow
          label="Current RP"
          value={formatPoints(researchPoints)}
          valueClass={getAmountColor(researchPoints) || 'text-(--text-accent)'}
        />
        <StatRow
          label="Lifetime RP"
          value={formatPoints(lifetimePoints)}
          valueClass={getAmountColor(lifetimePoints) || 'text-(--text-accent)'}
        />
        {stats.peakLifetimePoints !== undefined &&
          stats.peakLifetimePoints > lifetimePoints && (
            <StatRow
              label="Peak Lifetime RP"
              value={formatPoints(stats.peakLifetimePoints)}
              valueClass={
                getAmountColor(stats.peakLifetimePoints) ||
                'text-(--text-accent)'
              }
            />
          )}
        <StatRow
          label="RP/sec"
          value={formatRate(pps)}
          valueClass={getAmountColor(pps) || 'text-(--text-accent)'}
        />
        <StatRow label="Peak RP/sec" value={bestPPSFormatted} />
        <StatRow
          label="Current Era"
          value={`Era ${era.era}: ${era.name}`}
          valueClass={getAmountColor(
            stats.peakLifetimePoints ?? lifetimePoints
          )}
        />
      </StatSection>

      {/* Session */}
      <StatSection title="Session">
        <StatRow
          label="Session Time"
          value={formatDuration(stats.totalSessionPlaytime)}
        />
        <StatRow
          label="Offline Time"
          value={formatDuration(stats.totalOfflineTime ?? 0)}
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
        {(dysonSwarmLevel > 0 ||
          completedMegaprojects.includes('omega_singularity_sphere')) && (
          <StatRow
            label="Dyson Swarm Level"
            value={`Lv${dysonSwarmLevel}`}
            accent
          />
        )}
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
            valueClass="g-dd font-black"
          />
        )}
        {chronalFractures > 0 && (
          <StatRow
            label="Chronal Fractures"
            value={`${formatPoints(BigInt(Math.floor(chronalFractures)))} CF`}
            valueClass="g-sp font-black"
          />
        )}
        {omniSpars > 0 && (
          <StatRow
            label="Omni-Spars"
            value={`${formatPoints(BigInt(Math.floor(omniSpars)))} OS`}
            valueClass="g-tqgs font-black"
          />
        )}
      </StatSection>
    </div>
  )
}
