import { RiskAction } from '../../types';

export const RISK_THRESHOLDS = {
  CLOSE_MONITORING: 15,
  NOTIFY_PARENT: 40,
  SMS_PARENT: 70,
  EMERGENCY_ACTIONS: 90,
} as const;

export class DecisionEngine {
  private lastScore = 0;

  private sanitizeScore(score: number): number {
    if (typeof score !== 'number' || Number.isNaN(score) || !Number.isFinite(score)) {
      return 0;
    }
    return Math.max(0, Math.min(100, score));
  }

  public decide(rawScore: number): RiskAction[] {
    const newScore = this.sanitizeScore(rawScore);
    const newlyCrossed: RiskAction[] = [];

    const checkThreshold = (threshold: number, action: RiskAction) => {
      if (newScore >= threshold && this.lastScore < threshold) {
        newlyCrossed.push(action);
      }
    };

    checkThreshold(RISK_THRESHOLDS.CLOSE_MONITORING, 'BEGIN_CLOSE_MONITORING');
    checkThreshold(RISK_THRESHOLDS.NOTIFY_PARENT, 'NOTIFY_PARENT');
    checkThreshold(RISK_THRESHOLDS.SMS_PARENT, 'SMS_PARENT');
    checkThreshold(RISK_THRESHOLDS.EMERGENCY_ACTIONS, 'CALL_PARENT');
    checkThreshold(RISK_THRESHOLDS.EMERGENCY_ACTIONS, 'START_CONTINUOUS_LOCATION');
    checkThreshold(RISK_THRESHOLDS.EMERGENCY_ACTIONS, 'START_AUDIO_RECORDING');

    this.lastScore = newScore;
    return newlyCrossed;
  }

  public activeActionsFor(rawScore: number): Set<RiskAction> {
    const score = this.sanitizeScore(rawScore);
    const actions = new Set<RiskAction>();

    if (score >= RISK_THRESHOLDS.CLOSE_MONITORING) actions.add('BEGIN_CLOSE_MONITORING');
    if (score >= RISK_THRESHOLDS.NOTIFY_PARENT) actions.add('NOTIFY_PARENT');
    if (score >= RISK_THRESHOLDS.SMS_PARENT) actions.add('SMS_PARENT');
    if (score >= RISK_THRESHOLDS.EMERGENCY_ACTIONS) {
      actions.add('CALL_PARENT');
      actions.add('START_CONTINUOUS_LOCATION');
      actions.add('START_AUDIO_RECORDING');
    }
    return actions;
  }

  public reset(): void {
    this.lastScore = 0;
  }
}
