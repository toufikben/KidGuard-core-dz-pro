import { describe, it, expect, beforeEach } from 'vitest';
import { GeofenceMonitor, isValidCoordinate } from './GeofenceMonitor';
import { GeofenceZone } from '../../types';

const homeZone: GeofenceZone = {
  id: 1,
  name: 'Home',
  latitude: 36.7538,
  longitude: 3.0588,
  radiusMeters: 200,
  isEnabled: true,
  iconName: 'home',
  colorHex: '#10B981',
};

const FAR_AWAY_LAT = 40.0;
const FAR_AWAY_LNG = 10.0;

describe('GeofenceMonitor', () => {
  let monitor: GeofenceMonitor;

  beforeEach(() => {
    monitor = new GeofenceMonitor();
  });

  describe('calculateDistanceMeters', () => {
    it('returns ~0 for identical coordinates', () => {
      expect(monitor.calculateDistanceMeters(36.75, 3.05, 36.75, 3.05)).toBeCloseTo(0, 1);
    });

    it('returns approximately the correct real-world distance (haversine)', () => {
      // 1 degree of latitude is ~111.2km
      const dist = monitor.calculateDistanceMeters(0, 0, 1, 0);
      expect(dist).toBeGreaterThan(110000);
      expect(dist).toBeLessThan(112000);
    });

    it('returns Infinity for invalid coordinates', () => {
      expect(monitor.calculateDistanceMeters(100, 0, 0, 0)).toBe(Infinity);
      expect(monitor.calculateDistanceMeters(0, 0, NaN, 10)).toBe(Infinity);
    });
  });

  describe('monitorCoordinates - first observation', () => {
    it('does not report an exit event on the very first observation, even when starting outside every zone', () => {
      const status = monitor.monitorCoordinates(1, FAR_AWAY_LAT, FAR_AWAY_LNG, [homeZone]);
      expect(status.isInsideSafeZone).toBe(false);
      expect(status.isExitEventDetected).toBe(false);
      expect(status.isEntryEventDetected).toBe(false);
    });

    it('does not report an entry event on the very first observation, even when starting inside a zone', () => {
      const status = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      expect(status.isInsideSafeZone).toBe(true);
      expect(status.isEntryEventDetected).toBe(false);
      expect(status.isExitEventDetected).toBe(false);
    });
  });

  describe('monitorCoordinates - transitions', () => {
    it('fires an exit event when moving from inside to outside on a later call', () => {
      monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      const status = monitor.monitorCoordinates(1, FAR_AWAY_LAT, FAR_AWAY_LNG, [homeZone]);
      expect(status.isExitEventDetected).toBe(true);
      expect(status.isEntryEventDetected).toBe(false);
    });

    it('fires an entry event when moving from outside to inside on a later call', () => {
      monitor.monitorCoordinates(1, FAR_AWAY_LAT, FAR_AWAY_LNG, [homeZone]);
      const status = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      expect(status.isEntryEventDetected).toBe(true);
      expect(status.isExitEventDetected).toBe(false);
    });

    it('does not fire a transition event while staying inside across multiple calls', () => {
      monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      const status = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      expect(status.isExitEventDetected).toBe(false);
      expect(status.isEntryEventDetected).toBe(false);
    });
  });

  describe('distanceToNearestZoneMeters', () => {
    it('is clamped to 0 when inside a zone', () => {
      const status = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      expect(status.distanceToNearestZoneMeters).toBe(0);
    });

    it('reports a positive edge-distance when outside every zone', () => {
      const status = monitor.monitorCoordinates(1, FAR_AWAY_LAT, FAR_AWAY_LNG, [homeZone]);
      expect(status.distanceToNearestZoneMeters).toBeGreaterThan(0);
    });

    it('returns Infinity when no active safe zones are available', () => {
      const statusNoZones = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, []);
      expect(statusNoZones.distanceToNearestZoneMeters).toBe(Infinity);

      const disabledZone = { ...homeZone, isEnabled: false };
      const statusDisabled = monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [disabledZone]);
      expect(statusDisabled.distanceToNearestZoneMeters).toBe(Infinity);
    });
  });

  describe('validation & edge cases', () => {
    it('validates coordinate boundaries', () => {
      expect(isValidCoordinate(36.75, 3.05)).toBe(true);
      expect(isValidCoordinate(-90, 180)).toBe(true);
      expect(isValidCoordinate(91, 0)).toBe(false);
      expect(isValidCoordinate(0, -181)).toBe(false);
      expect(isValidCoordinate(NaN, 0)).toBe(false);
    });

    it('handles invalid input coordinates gracefully', () => {
      const status = monitor.monitorCoordinates(1, 100, 200, [homeZone]);
      expect(status.isInsideSafeZone).toBe(false);
      expect(status.distanceToNearestZoneMeters).toBe(Infinity);
      expect(status.statusMessage).toBe('Invalid GPS Coordinates');
    });
  });

  describe('resetState', () => {
    it('clears prior observation so the next call is treated as a fresh first observation', () => {
      monitor.monitorCoordinates(1, homeZone.latitude, homeZone.longitude, [homeZone]);
      monitor.resetState(1);
      const status = monitor.monitorCoordinates(1, FAR_AWAY_LAT, FAR_AWAY_LNG, [homeZone]);
      expect(status.isExitEventDetected).toBe(false);
    });
  });
});

