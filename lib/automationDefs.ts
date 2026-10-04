// Automation feature definitions
// Each feature maps to an AutomationState boolean and unlock source

export interface AutomationFeatureDef {
  id: string
  label: string
  description: string
  unlockSource: string
}

export const AUTOMATION_FEATURES: AutomationFeatureDef[] = [
  {
    id: 'autoBuyBasic',
    label: 'Auto-Buy (Basic)',
    description:
      'Automatically buys the cheapest affordable generator every 5 seconds.',
    unlockSource: 'Auto-Buy (Basic) AR upgrade'
  },
  {
    id: 'autoBuyOptimal',
    label: 'Auto-Buy (Optimal)',
    description:
      'Automatically buys the generator with highest marginal PPS gain every 2 seconds.',
    unlockSource: 'Complete SC6 Tier 3'
  },
  {
    id: 'autoResearchQueue',
    label: 'Auto-Research Queue',
    description:
      'When active research completes, auto-starts next queued node if affordable.',
    unlockSource: 'Auto-Research Queue AR upgrade'
  },
  {
    id: 'autoStabilizeAnomaly',
    label: 'Auto-Stabilize Anomaly',
    description: 'Automatically resolves anomalies at 50% of maximum reward.',
    unlockSource: 'Complete SC5 Tier 5'
  },
  {
    id: 'autoPrestigeTierI',
    label: 'Auto-Prestige Tier I',
    description:
      'Auto-executes Tier I prestiges when the threshold is reached.',
    unlockSource: 'The Automated Lab OS upgrade'
  },
  {
    id: 'autoPrestigeTierII',
    label: 'Auto-Prestige Tier II',
    description:
      'Auto-executes Tier II prestiges when the threshold is reached.',
    unlockSource:
      'Automated Timeline Severance OS upgrade (requires The Automated Lab)'
  },
  {
    id: 'autoEquipRelic',
    label: 'Auto-Equip Relic',
    description:
      'Automatically equips the highest-level available relic to empty slots.',
    unlockSource: 'Complete AC6'
  },
  {
    id: 'autoLaunchProbe',
    label: 'Auto-Launch Probe (Safe)',
    description: 'Automatically launches idle probes to Safe Sectors.',
    unlockSource: 'Complete SC12 Tier 3'
  },
  {
    id: 'autoModuleBuy',
    label: 'Auto-Module Buyer',
    description: 'Automatically purchases affordable module upgrades.',
    unlockSource: 'Auto-Module Buyer CF upgrade'
  }
]

// Tick intervals for each automation type (in ticks, each tick = 100ms)
export const AUTO_BUY_BASIC_INTERVAL_TICKS = 50 // every 5s
export const AUTO_BUY_OPTIMAL_INTERVAL_TICKS = 20 // every 2s
export const AUTO_AUTOMATION_INTERVAL_TICKS = 10 // every 1s for other checks
