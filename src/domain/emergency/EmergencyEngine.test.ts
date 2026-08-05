import { describe, it, expect, beforeEach } from 'vitest';
import { EmergencyEngine } from './EmergencyEngine';

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
  });
});
