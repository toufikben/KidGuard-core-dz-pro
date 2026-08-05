import { describe, it, expect, beforeEach } from 'vitest';
import { EmergencyEngine, EMERGENCY_REASON_TEMPLATES } from './EmergencyEngine';

describe('EmergencyEngine', () => {
  let engine: EmergencyEngine;

  beforeEach(() => {
    engine = new EmergencyEngine();
  });

  it('should initialize with low risk score', () => {
    const report = engine.createRiskReport([], 0, 0, 0, true, 100);
    expect(report.riskScore).toBe(0);
  });

  it('should calculate higher risk on unusual speed or low battery', () => {
    const report = engine.createRiskReport([], 0, 0, 30, false, 10);
    expect(report.riskReasons.length).toBeGreaterThan(0);
    expect(report.riskReasons).toContain(EMERGENCY_REASON_TEMPLATES.OUT_OF_SAFE_BOUNDARY);
    expect(report.riskReasons).toContain(EMERGENCY_REASON_TEMPLATES.LOW_BATTERY(10));
  });

  it('should use injected clock provider for deterministic time', () => {
    const mockTime = 1700000000000;
    const customEngine = new EmergencyEngine(undefined, undefined, () => mockTime);
    const report = customEngine.createRiskReport([], 36.75, 3.05, 0, true, 80);
    expect(report.lastMovementTime).toBe(mockTime);
  });

  it('should sanitize batteryPercent, lat/lng, and speed values', () => {
    const report = engine.createRiskReport([], 150, -200, -50, true, 150);
    expect(report.lastLocation.latitude).toBe(90);
    expect(report.lastLocation.longitude).toBe(-180);
    expect(report.speedKmh).toBe(0);
    expect(report.batteryPercent).toBe(100);

    const NaNReport = engine.createRiskReport([], NaN, NaN, NaN, true, NaN);
    expect(NaNReport.lastLocation.latitude).toBe(0);
    expect(NaNReport.lastLocation.longitude).toBe(0);
    expect(NaNReport.speedKmh).toBe(0);
    expect(NaNReport.batteryPercent).toBe(100);
  });
});
