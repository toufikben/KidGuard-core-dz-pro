import { BehaviorEvent, MotionState, RiskAction, RiskReport } from '../../types';
import { RiskEngine } from '../risk/RiskEngine';
import { DecisionEngine } from '../risk/DecisionEngine';

export interface EmergencyTick {
  riskScore: number;
  newlyTriggeredActions: RiskAction[];
}

export class EmergencyEngine {
  private riskEngine: RiskEngine;
  private decisionEngine: DecisionEngine;

  constructor(
    riskEngine: RiskEngine = new RiskEngine(),
    decisionEngine: DecisionEngine = new DecisionEngine()
  ) {
    this.riskEngine = riskEngine;
    this.decisionEngine = decisionEngine;
  }

  public evaluate(events: BehaviorEvent[]): EmergencyTick {
    let score: number;
    if (events.length === 0) {
      this.riskEngine.decay();
      score = this.riskEngine.currentScore;
    } else {
      score = this.riskEngine.applyEvents(events);
    }
    const newActions = this.decisionEngine.decide(score);
    return { riskScore: score, newlyTriggeredActions: newActions };
  }

  public createRiskReport(
    events: BehaviorEvent[],
    lat: number,
    lng: number,
    speedKmh: number,
    isInsideSafeZone: boolean,
    batteryPercent: number,
    hasInternet: boolean = true
  ): RiskReport {
    const tick = this.evaluate(events);
    const activeActions = this.getActiveActions();

    const riskReasons: string[] = [];
    if (!isInsideSafeZone) riskReasons.push('Out of safe boundary');
    if (speedKmh > 20) riskReasons.push(`High speed detected: ${speedKmh.toFixed(1)} km/h`);
    if (batteryPercent < 15) riskReasons.push(`Low battery: ${batteryPercent}%`);
    for (const ev of events) {
      if (ev.type === 'TamperDetected') riskReasons.push(`Tamper Event: ${ev.tamperType}`);
      if (ev.type === 'EnteredVehicle') riskReasons.push('Entered vehicle');
      if (ev.type === 'UnusualRouteDetected') riskReasons.push('Unusual route');
      if (ev.type === 'NoStopDetected') riskReasons.push('Moving continuously without stopping');
    }

    return {
      riskScore: tick.riskScore,
      riskReasons,
      lastLocation: { latitude: lat, longitude: lng },
      speedKmh,
      isInsideSafeZone,
      hasInternet,
      batteryPercent,
      lastMovementTime: Date.now(),
      activeActions,
    };
  }

  public resolveIncident(): void {
    this.riskEngine.resetToSafe();
    this.decisionEngine.reset();
  }

  public getActiveActions(): RiskAction[] {
    return Array.from(this.decisionEngine.activeActionsFor(this.riskEngine.currentScore));
  }

  public pollingIntervalMs(motionState: MotionState, riskScore: number): number {
    if (riskScore >= 70) return 1000;
    if (motionState === 'VEHICLE' || motionState === 'RUNNING') return 5000;
    if (motionState === 'WALKING') return 20000;
    return 5 * 60000;
  }
}
