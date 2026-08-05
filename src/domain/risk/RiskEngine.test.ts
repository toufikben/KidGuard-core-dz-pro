import { describe, it, expect, beforeEach } from 'vitest';
import { RiskEngine, RISK_EVENT_TYPES, DEFAULT_RISK_WEIGHTS } from './RiskEngine';

describe('RiskEngine', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = new RiskEngine();
  });

  it('starts at 0', () => {
    expect(engine.currentScore).toBe(0);
  });

  it('increases score for LeftSafeZone using RISK_EVENT_TYPES', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.LEFT_SAFE_ZONE }]);
    expect(engine.currentScore).toBe(15);
  });

  it('increases score for EnteredVehicle', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.ENTERED_VEHICLE }]);
    expect(engine.currentScore).toBe(20);
  });

  it('increases score sharply for TamperDetected', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.TAMPER_DETECTED, tamperType: 'APP_KILLED' }]);
    expect(engine.currentScore).toBe(90);
  });

  it('clamps score at 100', () => {
    engine.applyEvents([
      { type: RISK_EVENT_TYPES.TAMPER_DETECTED, tamperType: 'APP_KILLED' },
      { type: RISK_EVENT_TYPES.TAMPER_DETECTED, tamperType: 'GPS_DISABLED' },
    ]);
    expect(engine.currentScore).toBe(100);
  });

  it('clamps score at 0 (never negative)', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.RETURNED_TO_SAFE_ZONE, zoneName: 'Home' }]);
    expect(engine.currentScore).toBe(0);
  });

  it('ReturnedToSafeZone resets score to 0 regardless of prior score', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.TAMPER_DETECTED, tamperType: 'APP_KILLED' }]);
    expect(engine.currentScore).toBe(90);
    engine.applyEvents([{ type: RISK_EVENT_TYPES.RETURNED_TO_SAFE_ZONE, zoneName: 'Home' }]);
    expect(engine.currentScore).toBe(0);
  });

  it('decay reduces score gradually and floors at 0', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.LEFT_SAFE_ZONE }]); // 15
    engine.decay(); // 12
    expect(engine.currentScore).toBe(12);
    engine.decay(); // 9
    engine.decay(); // 6
    engine.decay(); // 3
    engine.decay(); // 0
    engine.decay(); // stays 0
    expect(engine.currentScore).toBe(0);
  });

  it('resetToSafe zeroes the score immediately', () => {
    engine.applyEvents([{ type: RISK_EVENT_TYPES.TAMPER_DETECTED, tamperType: 'APP_KILLED' }]);
    engine.resetToSafe();
    expect(engine.currentScore).toBe(0);
  });

  it('supports custom risk weights configuration', () => {
    const customEngine = new RiskEngine({
      LEFT_SAFE_ZONE: 25,
      DECAY_PER_TICK: 5,
    });
    expect(customEngine.currentWeights.LEFT_SAFE_ZONE).toBe(25);
    expect(customEngine.currentWeights.ENTERED_VEHICLE).toBe(DEFAULT_RISK_WEIGHTS.ENTERED_VEHICLE);

    customEngine.applyEvents([{ type: RISK_EVENT_TYPES.LEFT_SAFE_ZONE }]);
    expect(customEngine.currentScore).toBe(25);
    customEngine.decay();
    expect(customEngine.currentScore).toBe(20);
  });

  describe('edge cases & invalid values (NaN, Infinity, null, undefined)', () => {
    it('handles null, undefined, or empty events array gracefully', () => {
      expect(engine.applyEvents([])).toBe(0);
      expect(engine.applyEvents([null as any, undefined as any])).toBe(0);
      expect(engine.currentScore).toBe(0);
    });

    it('ignores unknown or invalid event types without throwing', () => {
      engine.applyEvents([
        { type: 'UNKNOWN_EVENT_TYPE' as any },
        { type: null as any },
        { type: undefined as any },
        { type: NaN as any },
        { type: Infinity as any },
      ]);
      expect(engine.currentScore).toBe(0);
    });

    it('handles NaN and Infinity in custom weights safely', () => {
      const nanEngine = new RiskEngine({
        LEFT_SAFE_ZONE: NaN,
        ENTERED_VEHICLE: Infinity,
      });
      nanEngine.applyEvents([{ type: RISK_EVENT_TYPES.LEFT_SAFE_ZONE }]);
      expect(typeof nanEngine.currentScore).toBe('number');
    });
  });
});

