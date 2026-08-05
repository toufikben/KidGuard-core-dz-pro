import { BehaviorEvent } from '../../types';

export class RiskEngine {
  private _currentScore = 0;
  private decayPerTick = 3;

  public get currentScore(): number {
    return this._currentScore;
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
      this._currentScore = Math.max(0, this._currentScore - this.decayPerTick);
    }
  }

  public resetToSafe(): void {
    this._currentScore = 0;
  }

  private scoreFor(event: BehaviorEvent): number {
    switch (event.type) {
      case 'LeftSafeZone': return 15;
      case 'ReturnedToSafeZone': return -this._currentScore;
      case 'UnusualRouteDetected': return 15;
      case 'SustainedSpeedIncrease': return 15;
      case 'NoStopDetected': return 15;
      case 'EnteredVehicle': return 20;
      case 'TamperDetected': return 90;
      default: return 0;
    }
  }
}
