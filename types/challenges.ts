// Intermediate payload produced by checkChallengeCompletion
// Consumed by UI notification and permanent multiplier engine

export interface ChallengeRewardPayload {
  challengeId: string
  tiersCompleted: number // total tiers now completed
  // Whether the current run met the target
  targetMet: boolean
  // The specific rewards to apply
  rewards: ChallengeReward[]
}

export interface ChallengeReward {
  type:
    | 'global_multiplier'
    | 'generator_output'
    | 'research_time'
    | 'module_cost'
    | 'offline_efficiency'
    | 'queue_slots'
    | 'relic_slots'
    | 'relic_level'
    | 'anomaly_reward'
    | 'production_exponent'
    | 'ar_effectiveness'
    | 'auto_feature'
    | 'module_cap'
    | 'ar_bonus'
  value: number
  // Which generators this applies to (null = all)
  generatorIndices?: number[] | null
}
