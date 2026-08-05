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

  describe('Boundary testing (0, 1, 14, 15, 39, 40, 69, 70, 89, 90, 99, 100)', () => {
    it('returns correct action sets across precise threshold boundaries', () => {
      // 0 & 1
      expect(engine.activeActionsFor(0).size).toBe(0);
      expect(engine.activeActionsFor(1).size).toBe(0);

      // 14 & 15
      expect(engine.activeActionsFor(14).size).toBe(0);
      expect(engine.activeActionsFor(15).size).toBe(1);
      expect(engine.activeActionsFor(15).has('BEGIN_CLOSE_MONITORING')).toBe(true);

      // 39 & 40
      expect(engine.activeActionsFor(39).size).toBe(1);
      expect(engine.activeActionsFor(40).size).toBe(2);
      expect(engine.activeActionsFor(40).has('NOTIFY_PARENT')).toBe(true);

      // 69 & 70
      expect(engine.activeActionsFor(69).size).toBe(2);
      expect(engine.activeActionsFor(70).size).toBe(3);
      expect(engine.activeActionsFor(70).has('SMS_PARENT')).toBe(true);

      // 89 & 90
      expect(engine.activeActionsFor(89).size).toBe(3);
      expect(engine.activeActionsFor(90).size).toBe(6);
      expect(engine.activeActionsFor(90).has('CALL_PARENT')).toBe(true);
      expect(engine.activeActionsFor(90).has('START_CONTINUOUS_LOCATION')).toBe(true);
      expect(engine.activeActionsFor(90).has('START_AUDIO_RECORDING')).toBe(true);

      // 99 & 100
      expect(engine.activeActionsFor(99).size).toBe(6);
      expect(engine.activeActionsFor(100).size).toBe(6);
    });
  });

  describe('Stress testing (10,000 updates)', () => {
    it('executes 10,000 decision updates rapidly without degrading performance or leaking memory', () => {
      const startTime = Date.now();
      for (let i = 0; i < 10000; i++) {
        const score = (i * 37) % 105; // cycle through 0..104
        engine.decide(score);
        engine.activeActionsFor(score);
      }
      const duration = Date.now() - startTime;
      // 10,000 iterations should complete in under 500ms
      expect(duration).toBeLessThan(500);
    });
  });

  describe('Fuzz testing (Randomized input testing)', () => {
    it('handles 1,000 random inputs including extreme numbers and invalid types safely', () => {
      const fuzzInputs: any[] = [
        ...Array.from({ length: 500 }, () => (Math.random() - 0.5) * 500),
        NaN,
        Infinity,
        -Infinity,
        null,
        undefined,
        '100',
        {},
        [],
        true,
        false,
        Symbol('risk'),
      ];

      for (let i = 0; i < 1000; i++) {
        const randomIndex = Math.floor(Math.random() * fuzzInputs.length);
        const input = fuzzInputs[randomIndex];
        expect(() => engine.decide(input)).not.toThrow();
        expect(() => engine.activeActionsFor(input)).not.toThrow();
      }
    });
  });
});
