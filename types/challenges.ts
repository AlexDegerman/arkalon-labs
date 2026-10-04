// Intermediate payload produced by checkChallengeCompletion
// Consumed by UI notification and permanent multiplier engine

export interface ChallengeRewardPayload {
  challengeId: string
  tiersCompleted: number
  targetMet: boolean
}
