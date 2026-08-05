import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { LocationService, LocationPosition, LocationSignalSource } from './LocationService';

describe('LocationService', () => {
  let locationService: LocationService;

  beforeEach(() => {
    locationService = new LocationService();
    vi.useFakeTimers();
  });

  afterEach(() => {
    locationService.stopTracking();
    vi.restoreAllMocks();
  });

  describe('getDynamicIntervalMs', () => {
    it('returns 15s for stationary speeds (< 1 km/h)', () => {
      expect(LocationService.getDynamicIntervalMs(0)).toBe(15000);
      expect(LocationService.getDynamicIntervalMs(0.5)).toBe(15000);
    });

    it('returns 5s for walking speeds (1 - 10 km/h)', () => {
      expect(LocationService.getDynamicIntervalMs(3.5)).toBe(5000);
      expect(LocationService.getDynamicIntervalMs(9.9)).toBe(5000);
    });

    it('returns 2s for driving speeds (> 10 km/h)', () => {
      expect(LocationService.getDynamicIntervalMs(15)).toBe(2000);
      expect(LocationService.getDynamicIntervalMs(80)).toBe(2000);
    });

    it('handles NaN, Infinity, negative, and null/undefined values safely', () => {
      expect(LocationService.getDynamicIntervalMs(NaN)).toBe(15000);
      expect(LocationService.getDynamicIntervalMs(Infinity)).toBe(2000);
      expect(LocationService.getDynamicIntervalMs(-5)).toBe(15000);
      expect(LocationService.getDynamicIntervalMs(null as any)).toBe(15000);
      expect(LocationService.getDynamicIntervalMs(undefined as any)).toBe(15000);
    });
  });

  describe('tracking lifecycle', () => {
    it('stops tracking completely and resets status on stopTracking', () => {
      const mockClearWatch = vi.fn();
      const mockWatchPosition = vi.fn().mockReturnValue(123);

      vi.stubGlobal('navigator', {
        geolocation: {
          watchPosition: mockWatchPosition,
          clearWatch: mockClearWatch,
        },
      });

      locationService.startTracking(vi.fn());
      expect(locationService.isTrackingActive()).toBe(true);

      locationService.stopTracking();
      expect(locationService.isTrackingActive()).toBe(false);
      expect(locationService.getCurrentSignalSource()).toBe('OFFLINE');
      expect(mockClearWatch).toHaveBeenCalledWith(123);
    });

    it('handles GPS signal loss and emits fallback status', () => {
      let successCb: (pos: GeolocationPosition) => void = () => {};
      let errorCb: (err: GeolocationPositionError) => void = () => {};

      vi.stubGlobal('navigator', {
        geolocation: {
          watchPosition: (sc: any, ec: any) => {
            successCb = sc;
            errorCb = ec;
            return 1;
          },
          clearWatch: vi.fn(),
        },
      });

      const positionCb = vi.fn();
      const signalCb = vi.fn();

      locationService.startTracking(positionCb, vi.fn(), signalCb, { signalLossThresholdMs: 5000 });

      // First valid GPS fix
      successCb({
        coords: { latitude: 36.75, longitude: 3.05, speed: 2, accuracy: 10 } as any,
        timestamp: Date.now(),
      });

      expect(signalCb).toHaveBeenCalledWith('GPS');
      expect(positionCb).toHaveBeenCalled();

      // Trigger timeout for signal loss
      vi.advanceTimersByTime(6000);

      expect(locationService.getCurrentSignalSource()).toBe('SIGNAL_LOST');
      expect(signalCb).toHaveBeenCalledWith('SIGNAL_LOST');
    });
  });
});
