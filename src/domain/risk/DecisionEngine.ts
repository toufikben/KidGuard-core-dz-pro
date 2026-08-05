import { RiskAction } from '../../types';

export class DecisionEngine {
  private lastScore = 0;

  public decide(newScore: number): RiskAction[] {
    const newlyCrossed: RiskAction[] = [];

    const checkThreshold = (threshold: number, action: RiskAction) => {
      if (newScore >= threshold && this.lastScore < threshold) {
        newlyCrossed.push(action);
      }
    };

    checkThreshold(15, 'BEGIN_CLOSE_MONITORING');
    checkThreshold(40, 'NOTIFY_PARENT');
    checkThreshold(70, 'SMS_PARENT');
    checkThreshold(90, 'CALL_PARENT');
    checkThreshold(90, 'START_CONTINUOUS_LOCATION');
    checkThreshold(90, 'START_AUDIO_RECORDING');

    this.lastScore = newScore;
    return newlyCrossed;
  }

  public activeActionsFor(score: number): Set<RiskAction> {
    const actions = new Set<RiskAction>();
    if (score >= 15) actions.add('BEGIN_CLOSE_MONITORING');
    if (score >= 40) actions.add('NOTIFY_PARENT');
    if (score >= 70) actions.add('SMS_PARENT');
    if (score >= 90) {
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
