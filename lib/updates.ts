export interface UpdateEntry {
  id: string
  version: string
  date: string
  changes: string[]
}

// Version history for the UpdateModal and Updates page.
export const UPDATES: UpdateEntry[] = [
  {
    id: 'v1.0.0-launch',
    version: '1.0.0',
    date: '2025-01-01',
    changes: [
      '20-tier generator scaling from Research Desk to Absolute Void Compressor.',
      '40-node research tree across Computation, Energy, Reality, and Arkalon branches.',
      'Three nested prestige loops: Reality Recalibration, Timeline Severance, Singular Synthesis.',
      'Interactive anomaly events with four anomaly types.',
      'Relic and artifact dust system with 20 relics.',
      'Excavation operations with sub-space probes.',
      'Three megaprojects unlocking prestige tiers.',
      '24 facility challenges across Standard, Advanced, and Extreme tiers.',
      'Anomalous Operations 90-day cycle.',
      'Arkalon AI communication engine.'
    ]
  }
]

export const LATEST_UPDATE = UPDATES[0]
export const UPDATES_VERSION = LATEST_UPDATE.id
