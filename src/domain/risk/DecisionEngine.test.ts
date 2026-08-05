import { describe, it, expect, beforeEach } from 'vitest';
import { DecisionEngine } from './DecisionEngine';

describe('DecisionEngine', () => {
  let engine: DecisionEngine;

  beforeEach(() => {
    engine = new DecisionEngine();
  });

  it('returns no actions when score stays at 0', () => {
    expect(engine.decide(0)).toEqual([]);
  });

  it('triggers BEGIN_CLOSE_MONITORING when crossing 15 upward', () => {
    const actions = engine.decide(15);
    expect(actions).toContain('BEGIN_CLOSE_MONITORING');
  });

  it('does not re-trigger an action while score stays above the threshold', () => {
    engine.decide(20); // crosses 15
    const actions = engine.decide(25); // still above 15
    expect(actions).not.toContain('BEGIN_CLOSE_MONITORING');
  });

  it('re-triggers an action after dropping below the threshold and crossing it again', () => {
    engine.decide(20); // crosses 15
    engine.decide(10); // drops below 15
    const actions = engine.decide(20); // crosses 15 again
    expect(actions).toContain('BEGIN_CLOSE_MONITORING');
  });

  it('triggers CALL_PARENT, START_CONTINUOUS_LOCATION, and START_AUDIO_RECORDING together at 90', () => {
    const actions = engine.decide(90);
    expect(actions).toEqual(
      expect.arrayContaining(['CALL_PARENT', 'START_CONTINUOUS_LOCATION', 'START_AUDIO_RECORDING'])
    );
  });

  describe('activeActionsFor', () => {
    it('returns an empty set below 15', () => {
      expect(engine.activeActionsFor(10).size).toBe(0);
    });

    it('accumulates actions as score rises through thresholds', () => {
      const actions = engine.activeActionsFor(95);
      expect(actions.has('BEGIN_CLOSE_MONITORING')).toBe(true);
      expect(actions.has('NOTIFY_PARENT')).toBe(true);
      expect(actions.has('SMS_PARENT')).toBe(true);
      expect(actions.has('CALL_PARENT')).toBe(true);
      expect(actions.has('START_AUDIO_RECORDING')).toBe(true);
    });
  });

  describe('reset', () => {
    it('allows a threshold to re-trigger immediately after reset', () => {
      engine.decide(20); // crosses 15
      engine.reset();
      const actions = engine.decide(20); // crosses again since lastScore was reset to 0
      expect(actions).toContain('BEGIN_CLOSE_MONITORING');
    });
  });
});
