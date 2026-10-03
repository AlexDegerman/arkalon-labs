// Priority ordering: 0 (highest) > 1 > 2 > 3 > 4 (lowest)
// 0: Prestige warnings
// 1: Anomaly alerts
// 2: Unlock notifications
// 3: Achievement banners
// 4: Arkalon dialogue
export type AlertPriority = 0 | 1 | 2 | 3 | 4

export type AlertVariant =
  | 'prestige'
  | 'anomaly'
  | 'unlock'
  | 'achievement'
  | 'arkalon'
  | 'info'

export interface FacilityAlertPayload {
  id: string
  priority: AlertPriority
  variant: AlertVariant
  title: string
  message: string
  // Auto-dismiss delay in ms; 0 means manual dismiss only
  autoDismissMs?: number
}
