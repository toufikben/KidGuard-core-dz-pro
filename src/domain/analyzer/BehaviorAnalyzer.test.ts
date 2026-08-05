import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorAnalyzer } from './BehaviorAnalyzer';

describe('BehaviorAnalyzer', () => {
  let analyzer: BehaviorAnalyzer;

  beforeEach(() => {
    analyzer = new BehaviorAnalyzer();
  });

  describe('classifyMotion', () => {
    it('classifies stationary speeds', () => {
      expect(analyzer.classifyMotion(0)).toBe('STATIONARY');
      expect(analyzer.classifyMotion(0.5)).toBe('STATIONARY');
    });

    it('classifies walking speeds', () => {
      expect(analyzer.classifyMotion(3)).toBe('WALKING');
    });

    it('classifies running speeds', () => {
      expect(analyzer.classifyMotion(10)).toBe('RUNNING');
    });

    it('classifies vehicle speeds', () => {
      expect(analyzer.classifyMotion(30)).toBe('VEHICLE');
    });
  });

  describe('safe zone transitions', () => {
    it('fires LeftSafeZone exactly once when exiting, not on every subsequent tick', () => {
      const base = { latitude: 1, longitude: 1, timestampMs: Date.now() };

      let events = analyzer.analyze({ ...base, speedKmh: 0, insideSafeZone: true, zoneName: 'Home' });
      expect(events.find((e) => e.type === 'LeftSafeZone')).toBeUndefined();

      events = analyzer.analyze({ ...base, speedKmh: 5, insideSafeZone: false });
      expect(events.filter((e) => e.type === 'LeftSafeZone')).toHaveLength(1);

      events = analyzer.analyze({ ...base, speedKmh: 5, insideSafeZone: false });
      expect(events.find((e) => e.type === 'LeftSafeZone')).toBeUndefined();
    });

    it('fires ReturnedToSafeZone once on re-entry', () => {
      analyzer.analyze({ latitude: 1, longitude: 1, speedKmh: 5, timestampMs: Date.now(), insideSafeZone: false });
      const events = analyzer.analyze({
        latitude: 1,
        longitude: 1,
        speedKmh: 0,
        timestampMs: Date.now(),
        insideSafeZone: true,
        zoneName: 'Home',
      });
      expect(events.filter((e) => e.type === 'ReturnedToSafeZone')).toHaveLength(1);
    });
  });

  describe('vehicle motion events (regression: previously fired on every GPS tick)', () => {
    it('fires EnteredVehicle only on the transition into vehicle speed, not on every subsequent sample', () => {
      const base = { latitude: 1, longitude: 1, insideSafeZone: false };
      const t = Date.now();

      const e1 = analyzer.analyze({ ...base, speedKmh: 40, timestampMs: t });
      expect(e1.filter((e) => e.type === 'EnteredVehicle')).toHaveLength(1);

      const e2 = analyzer.analyze({ ...base, speedKmh: 42, timestampMs: t + 1000 });
      expect(e2.find((e) => e.type === 'EnteredVehicle')).toBeUndefined();

      const e3 = analyzer.analyze({ ...base, speedKmh: 41, timestampMs: t + 2000 });
      expect(e3.find((e) => e.type === 'EnteredVehicle')).toBeUndefined();
    });

    it('fires EnteredVehicle again after stopping and re-entering vehicle motion', () => {
      const base = { latitude: 1, longitude: 1, insideSafeZone: false };
      const t = Date.now();

      analyzer.analyze({ ...base, speedKmh: 40, timestampMs: t });
      analyzer.analyze({ ...base, speedKmh: 0, timestampMs: t + 1000 }); // stops
      const events = analyzer.analyze({ ...base, speedKmh: 40, timestampMs: t + 2000 });
      expect(events.filter((e) => e.type === 'EnteredVehicle')).toHaveLength(1);
    });

    it('fires NoStopDetected only once per continuous non-stopping vehicle segment', () => {
      const base = { latitude: 1, longitude: 1, insideSafeZone: false };
      const t = Date.now();

      const e1 = analyzer.analyze({ ...base, speedKmh: 40, timestampMs: t });
      const e2 = analyzer.analyze({ ...base, speedKmh: 41, timestampMs: t + 1000 });
      const e3 = analyzer.analyze({ ...base, speedKmh: 39, timestampMs: t + 2000 });

      const totalNoStopEvents = [e1, e2, e3].flat().filter((e) => e.type === 'NoStopDetected').length;
      expect(totalNoStopEvents).toBe(1);
    });

    it('fires SustainedSpeedIncrease only once per acceleration episode, not on every tick of the climb', () => {
      const base = { latitude: 1, longitude: 1, insideSafeZone: false };
      const t = Date.now();

      analyzer.analyze({ ...base, speedKmh: 5, timestampMs: t });
      const e1 = analyzer.analyze({ ...base, speedKmh: 15, timestampMs: t + 1000 }); // +10, should fire
      const e2 = analyzer.analyze({ ...base, speedKmh: 22, timestampMs: t + 2000 }); // still climbing
      const e3 = analyzer.analyze({ ...base, speedKmh: 30, timestampMs: t + 3000 }); // still climbing

      const fires = [e1, e2, e3].flat().filter((e) => e.type === 'SustainedSpeedIncrease');
      expect(fires).toHaveLength(1);
    });

    it('a 10-tick car ride produces only a handful of events, not one set per tick (the original false-positive bug)', () => {
      const base = { latitude: 1, longitude: 1 };
      const t = Date.now();
      const allEvents: { type: string }[] = [];

      allEvents.push(
        ...analyzer.analyze({ ...base, speedKmh: 0, timestampMs: t, insideSafeZone: true, zoneName: 'Home' })
      );
      for (let i = 1; i <= 10; i++) {
        allEvents.push(
          ...analyzer.analyze({ ...base, speedKmh: 40, timestampMs: t + i * 1000, insideSafeZone: false })
        );
      }

      // Only the first vehicle tick should produce events (LeftSafeZone,
      // EnteredVehicle, NoStopDetected, SustainedSpeedIncrease) - the other 9
      // steady-speed ticks should produce none. Before the fix, every one of
      // the 10 ticks independently re-fired EnteredVehicle/NoStopDetected,
      // which is what pinned the risk score at maximum during any car ride.
      expect(allEvents.length).toBeLessThanOrEqual(4);
    });
  });

  describe('reset', () => {
    it('clears internal state so the next analyze() behaves like a fresh analyzer', () => {
      analyzer.analyze({ latitude: 1, longitude: 1, speedKmh: 40, timestampMs: Date.now(), insideSafeZone: false });
      analyzer.reset();
      const events = analyzer.analyze({
        latitude: 1,
        longitude: 1,
        speedKmh: 40,
        timestampMs: Date.now(),
        insideSafeZone: false,
      });
      expect(events.filter((e) => e.type === 'EnteredVehicle')).toHaveLength(1);
    });
  });
});
