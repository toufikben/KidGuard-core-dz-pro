import { BehaviorEvent } from '../../types';

export const RISK_EVENT_TYPES = {
  LEFT_SAFE_ZONE: 'LeftSafeZone',
  RETURNED_TO_SAFE_ZONE: 'ReturnedToSafeZone',
  UNUSUAL_ROUTE_DETECTED: 'UnusualRouteDetected',
  SUSTAINED_SPEED_INCREASE: 'SustainedSpeedIncrease',
  NO_STOP_DETECTED: 'NoStopDetected',
  ENTERED_VEHICLE: 'EnteredVehicle',
  TAMPER_DETECTED: 'TamperDetected',
} as const;

export type RiskEventType = (typeof RISK_EVENT_TYPES)[keyof typeof RISK_EVENT_TYPES];

export interface RiskWeightsConfig {
  LEFT_SAFE_ZONE: number;
  UNUSUAL_ROUTE: number;
  SUSTAINED_SPEED_INCREASE: number;
  NO_STOP_DETECTED: number;
  ENTERED_VEHICLE: number;
  TAMPER_DETECTED: number;
  DECAY_PER_TICK: number;
}

export const DEFAULT_RISK_WEIGHTS: RiskWeightsConfig = {
  LEFT_SAFE_ZONE: 15,
  UNUSUAL_ROUTE: 15,
  SUSTAINED_SPEED_INCREASE: 15,
  NO_STOP_DETECTED: 15,
  ENTERED_VEHICLE: 20,
  TAMPER_DETECTED: 90,
  DECAY_PER_TICK: 3,
};

export class RiskEngine {
  private _currentScore = 0;
  private weights: RiskWeightsConfig;

  constructor(customWeights: Partial<RiskWeightsConfig> = {}) {
    this.weights = { ...DEFAULT_RISK_WEIGHTS, ...customWeights };
  }

  public get currentScore(): number {
    return this._currentScore;
  }

  public get currentWeights(): RiskWeightsConfig {
    return { ...this.weights };
  }

  public applyEvents(events: BehaviorEvent[]): number {
    for (const event of events) {
      this._currentScore += this.scoreFor(event);
    }
    this._currentScore = Math.max(0, Math.min(100, this._currentScore));
    return this._currentScore;
  }

  public decay(): void {
    if (this._currentScore > 0) {
      this._currentScore = Math.max(0, this._currentScore - this.weights.DECAY_PER_TICK);
    }
  }

  public resetToSafe(): void {
    this._currentScore = 0;
  }

  private scoreFor(event: BehaviorEvent): number {
    if (!event || !event.type) return 0;
    switch (event.type) {
      case RISK_EVENT_TYPES.LEFT_SAFE_ZONE:
        return this.weights.LEFT_SAFE_ZONE;
      case RISK_EVENT_TYPES.RETURNED_TO_SAFE_ZONE:
        return -this._currentScore;
      case RISK_EVENT_TYPES.UNUSUAL_ROUTE_DETECTED:
        return this.weights.UNUSUAL_ROUTE;
      case RISK_EVENT_TYPES.SUSTAINED_SPEED_INCREASE:
        return this.weights.SUSTAINED_SPEED_INCREASE;
      case RISK_EVENT_TYPES.NO_STOP_DETECTED:
        return this.weights.NO_STOP_DETECTED;
      case RISK_EVENT_TYPES.ENTERED_VEHICLE:
        return this.weights.ENTERED_VEHICLE;
      case RISK_EVENT_TYPES.TAMPER_DETECTED:
        return this.weights.TAMPER_DETECTED;
      default:
        return 0;
    }
  }
}

