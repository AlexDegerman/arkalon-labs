// Automation feature definitions
// Each feature maps to an AutomationState boolean and unlock source
import type { AutomationState } from '@/types/game'

export interface AutomationFeatureDef {
  id: keyof AutomationState
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
    id: 'autoBuySynthesizers',
    label: 'Auto-Buy Synthesizers',
    description:
      'Automatically buys the cheapest affordable unlocked Synthesizer every 5 seconds.',
    unlockSource: 'Auto-Buy Synthesizers CF upgrade'
  },
  {
    id: 'autoResearchQueue',
    label: 'Auto-Research Queue',
    description:
      'When active research completes, auto-starts next queued node if affordable.',
    unlockSource: 'Auto-Research Queue AR upgrade'
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
    id: 'autoPrestigeTierIII',
    label: 'Auto-Prestige Tier III',
    description: 'Auto-executes Tier III prestiges when available.',
    unlockSource: 'Automated Singular Synthesis OS upgrade'
  },
  {
    id: 'autoEquipRelic',
    label: 'Auto-Equip Relic',
    description:
      'Automatically equips the highest-level available relic to empty slots.',
    unlockSource: 'Complete AC6'
  },
  {
    id: 'autoUpgradeRelics',
    label: 'Auto-Upgrade Relics',
    description:
      'Automatically upgrades unlocked Relics up to your target level cap.',
    unlockSource: 'Auto-Upgrade Relics CF upgrade'
  },
  {
    id: 'autoLaunchProbe',
    label: 'Auto-Launch Probe (Safe)',
    description:
      'Automatically launches idle probes to Safe Sectors while preserving their subsystem.',
    unlockSource: 'Complete SC12 Tier 3'
  },
  {
    id: 'autoModuleBuy',
    label: 'Auto-Module Buyer',
    description: 'Automatically purchases affordable module upgrades.',
    unlockSource: 'Auto-Module Buyer CF upgrade'
  },
  {
    id: 'autoDysonSwarm',
    label: 'Auto-Dyson Swarm',
    description: 'Automatically activates the Arkalon Dyson Swarm when idle.',
    unlockSource: 'Auto-Dyson Swarm OS upgrade'
  }
]

// Tick intervals for each automation type (in ticks, each tick = 100ms)
export const AUTO_BUY_BASIC_INTERVAL_TICKS = 50 // every 5s
export const AUTO_BUY_OPTIMAL_INTERVAL_TICKS = 20 // every 2s
export const AUTO_AUTOMATION_INTERVAL_TICKS = 10 // every 1s for other checks
