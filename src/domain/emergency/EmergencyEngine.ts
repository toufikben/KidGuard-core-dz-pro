import { BehaviorEvent, MotionState, RiskAction, RiskReport } from '../../types';
import { RiskEngine } from '../risk/RiskEngine';
import { DecisionEngine } from '../risk/DecisionEngine';

export interface EmergencyTick {
  riskScore: number;
  newlyTriggeredActions: RiskAction[];
}

export type ClockProvider = () => number;

export const EMERGENCY_REASON_TEMPLATES = {
  OUT_OF_SAFE_BOUNDARY: 'Out of safe boundary',
  ENTERED_VEHICLE: 'Entered vehicle',
  UNUSUAL_ROUTE: 'Unusual route',
  NO_STOP_CONTINUOUS: 'Moving continuously without stopping',
  HIGH_SPEED: (speedKmh: number) => `High speed detected: ${speedKmh.toFixed(1)} km/h`,
  LOW_BATTERY: (batteryPercent: number) => `Low battery: ${batteryPercent}%`,
  TAMPER_EVENT: (tamperType: string) => `Tamper Event: ${tamperType}`,
} as const;

export class EmergencyEngine {
  private riskEngine: RiskEngine;
  private decisionEngine: DecisionEngine;
  private clockProvider: ClockProvider;

  constructor(
    riskEngine: RiskEngine = new RiskEngine(),
    decisionEngine: DecisionEngine = new DecisionEngine(),
    clockProvider: ClockProvider = () => Date.now()
  ) {
    this.riskEngine = riskEngine;
    this.decisionEngine = decisionEngine;
    this.clockProvider = clockProvider;
  }

  private sanitizeBattery(batteryPercent: number): number {
    if (typeof batteryPercent !== 'number' || Number.isNaN(batteryPercent) || !Number.isFinite(batteryPercent)) {
      return 100;
    }
    return Math.max(0, Math.min(100, Math.round(batteryPercent)));
  }

  private sanitizeCoordinate(coord: number, isLat: boolean): number {
    if (typeof coord !== 'number' || Number.isNaN(coord) || !Number.isFinite(coord)) {
      return 0;
    }
    const min = isLat ? -90 : -180;
    const max = isLat ? 90 : 180;
    return Math.max(min, Math.min(max, coord));
  }

  private sanitizeSpeed(speedKmh: number): number {
    if (typeof speedKmh !== 'number' || Number.isNaN(speedKmh) || !Number.isFinite(speedKmh)) {
      return 0;
    }
    return Math.max(0, speedKmh);
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
    const validLat = this.sanitizeCoordinate(lat, true);
    const validLng = this.sanitizeCoordinate(lng, false);
    const validSpeed = this.sanitizeSpeed(speedKmh);
    const validBattery = this.sanitizeBattery(batteryPercent);

    const tick = this.evaluate(events);
    const activeActions = this.getActiveActions();

    const riskReasons: string[] = [];
    if (!isInsideSafeZone) riskReasons.push(EMERGENCY_REASON_TEMPLATES.OUT_OF_SAFE_BOUNDARY);
    if (validSpeed > 20) riskReasons.push(EMERGENCY_REASON_TEMPLATES.HIGH_SPEED(validSpeed));
    if (validBattery < 15) riskReasons.push(EMERGENCY_REASON_TEMPLATES.LOW_BATTERY(validBattery));
    for (const ev of events) {
      if (ev.type === 'TamperDetected') riskReasons.push(EMERGENCY_REASON_TEMPLATES.TAMPER_EVENT(ev.tamperType));
      if (ev.type === 'EnteredVehicle') riskReasons.push(EMERGENCY_REASON_TEMPLATES.ENTERED_VEHICLE);
      if (ev.type === 'UnusualRouteDetected') riskReasons.push(EMERGENCY_REASON_TEMPLATES.UNUSUAL_ROUTE);
      if (ev.type === 'NoStopDetected') riskReasons.push(EMERGENCY_REASON_TEMPLATES.NO_STOP_CONTINUOUS);
    }

    return {
      riskScore: tick.riskScore,
      riskReasons,
      lastLocation: { latitude: validLat, longitude: validLng },
      speedKmh: validSpeed,
      isInsideSafeZone,
      hasInternet,
      batteryPercent: validBattery,
      lastMovementTime: this.clockProvider(),
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
