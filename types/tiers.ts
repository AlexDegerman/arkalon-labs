export interface TierThreshold {
  readonly label: string
  readonly cls: string
  readonly min: bigint
}

export type NotationMode = 'suffix' | 'scientific' | 'engineering' | 'logarithm'
export type DecimalPrecision = 1 | 2 | 3
