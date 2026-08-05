import { describe, it, expect, beforeEach } from 'vitest';
import { RiskEngine } from './RiskEngine';

describe('RiskEngine', () => {
  let engine: RiskEngine;

  beforeEach(() => {
    engine = new RiskEngine();
  });

  it('starts at 0', () => {
    expect(engine.currentScore).toBe(0);
  });

  it('increases score for LeftSafeZone', () => {
    engine.applyEvents([{ type: 'LeftSafeZone' }]);
    expect(engine.currentScore).toBe(15);
  });

  it('increases score for EnteredVehicle', () => {
    engine.applyEvents([{ type: 'EnteredVehicle' }]);
    expect(engine.currentScore).toBe(20);
  });

  it('increases score sharply for TamperDetected', () => {
    engine.applyEvents([{ type: 'TamperDetected', tamperType: 'APP_KILLED' }]);
    expect(engine.currentScore).toBe(90);
  });

  it('clamps score at 100', () => {
    engine.applyEvents([
      { type: 'TamperDetected', tamperType: 'APP_KILLED' },
      { type: 'TamperDetected', tamperType: 'GPS_DISABLED' },
    ]);
    expect(engine.currentScore).toBe(100);
  });

  it('clamps score at 0 (never negative)', () => {
    engine.applyEvents([{ type: 'ReturnedToSafeZone', zoneName: 'Home' }]);
    expect(engine.currentScore).toBe(0);
  });

  it('ReturnedToSafeZone resets score to 0 regardless of prior score', () => {
    engine.applyEvents([{ type: 'TamperDetected', tamperType: 'APP_KILLED' }]);
    expect(engine.currentScore).toBe(90);
    engine.applyEvents([{ type: 'ReturnedToSafeZone', zoneName: 'Home' }]);
    expect(engine.currentScore).toBe(0);
  });

  it('decay reduces score gradually and floors at 0', () => {
    engine.applyEvents([{ type: 'LeftSafeZone' }]); // 15
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
    engine.applyEvents([{ type: 'TamperDetected', tamperType: 'APP_KILLED' }]);
    engine.resetToSafe();
    expect(engine.currentScore).toBe(0);
  });
});
