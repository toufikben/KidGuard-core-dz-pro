export type LocationSignalSource = 'GPS' | 'NETWORK' | 'SIGNAL_LOST' | 'OFFLINE';

export interface LocationPosition {
  latitude: number;
  longitude: number;
  speedKmh: number;
  accuracyMeters: number;
  timestamp: number;
  source: LocationSignalSource;
}

export interface LocationServiceOptions {
  enableHighAccuracy?: boolean;
  gpsTimeoutMs?: number;
  signalLossThresholdMs?: number;
}

export type PositionCallback = (position: LocationPosition) => void;
export type SignalStatusCallback = (source: LocationSignalSource) => void;
export type ErrorCallback = (error: GeolocationPositionError | Error) => void;

export class LocationService {
  private watchId: number | null = null;
  private signalLossTimer: ReturnType<typeof setTimeout> | null = null;
  private currentSource: LocationSignalSource = 'OFFLINE';
  private lastPosition: LocationPosition | null = null;
  private isTracking = false;

  private onPositionCb: PositionCallback | null = null;
  private onErrorCb: ErrorCallback | null = null;
  private onSignalCb: SignalStatusCallback | null = null;

  /**
   * Calculates dynamic refresh rate options based on current speed in km/h.
   * - Stationary (< 1 km/h): 15s interval (Low battery usage)
   * - Walking (1 - 10 km/h): 5s interval (Medium battery usage)
   * - Vehicle (> 10 km/h): 2s interval (High precision tracking)
   */
  public static getDynamicIntervalMs(speedKmh: number): number {
    if (typeof speedKmh !== 'number' || isNaN(speedKmh) || speedKmh < 1.0) {
      return 15000; // 15 seconds
    } else if (speedKmh < 10.0) {
      return 5000; // 5 seconds
    } else {
      return 2000; // 2 seconds
    }
  }

  public isTrackingActive(): boolean {
    return this.isTracking;
  }

  public getCurrentSignalSource(): LocationSignalSource {
    return this.currentSource;
  }

  public startTracking(
    onPosition: PositionCallback,
    onError?: ErrorCallback,
    onSignalStatusChange?: SignalStatusCallback,
    options: LocationServiceOptions = {}
  ): boolean {
    // Ensure clean state before starting
    this.stopTracking();

    if (!('geolocation' in navigator)) {
      const err = new Error('Geolocation is not supported by this environment');
      this.updateSignalStatus('OFFLINE');
      if (onError) onError(err);
      return false;
    }

    this.isTracking = true;
    this.onPositionCb = onPosition;
    this.onErrorCb = onError || null;
    this.onSignalCb = onSignalStatusChange || null;

    const timeoutMs = options.gpsTimeoutMs || 10000;
    const signalLossMs = options.signalLossThresholdMs || 15000;

    const navOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: timeoutMs,
      maximumAge: 3000,
    };

    this.resetSignalLossTimer(signalLossMs);

    try {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handleSuccess(pos, signalLossMs),
        (err) => this.handleError(err, signalLossMs),
        navOptions
      );
      return true;
    } catch (e) {
      this.handleError(e as Error, signalLossMs);
      return false;
    }
  }

  /**
   * Complete cleanup to prevent battery drain and background memory leaks.
   * Must be called on service shutdown, logout, or tracking toggle.
   */
  public stopTracking(): void {
    if (this.watchId !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.clearSignalLossTimer();
    this.isTracking = false;
    this.updateSignalStatus('OFFLINE');
    this.onPositionCb = null;
    this.onErrorCb = null;
    this.onSignalCb = null;
  }

  private handleSuccess(pos: GeolocationPosition, signalLossMs: number): void {
    if (!this.isTracking) return;

    this.resetSignalLossTimer(signalLossMs);

    const { latitude, longitude, speed, accuracy } = pos.coords;
    let speedKmh = 0;

    if (speed !== null && speed !== undefined && !isNaN(speed) && speed >= 0) {
      speedKmh = speed * 3.6;
    } else if (this.lastPosition) {
      const timeDiffSec = Math.max(1, (pos.timestamp - this.lastPosition.timestamp) / 1000);
      const dLat = (latitude - this.lastPosition.latitude) * 111000;
      const dLng =
        (longitude - this.lastPosition.longitude) *
        111000 *
        Math.cos((latitude * Math.PI) / 180);
      const distMeters = Math.sqrt(dLat * dLat + dLng * dLng);
      speedKmh = (distMeters / timeDiffSec) * 3.6;
    }

    // High accuracy (< 30m) indicates direct GPS fix, higher accuracy indicates network/WiFi fallback
    const source: LocationSignalSource = accuracy <= 30 ? 'GPS' : 'NETWORK';
    this.updateSignalStatus(source);

    const locationPos: LocationPosition = {
      latitude,
      longitude,
      speedKmh: Math.max(0, speedKmh),
      accuracyMeters: accuracy || 10,
      timestamp: pos.timestamp || Date.now(),
      source,
    };

    this.lastPosition = locationPos;

    if (this.onPositionCb) {
      this.onPositionCb(locationPos);
    }
  }

  private handleError(err: GeolocationPositionError | Error, signalLossMs: number): void {
    if (!this.isTracking) return;

    console.warn('[LocationService] GPS Signal Error or Timeout:', err);

    // Transition smoothly to SIGNAL_LOST status
    this.updateSignalStatus('SIGNAL_LOST');

    // If we have a previous location, provide smooth fallback with updated timestamp
    if (this.lastPosition && this.onPositionCb) {
      const fallbackPos: LocationPosition = {
        ...this.lastPosition,
        source: 'SIGNAL_LOST',
        timestamp: Date.now(),
      };
      this.onPositionCb(fallbackPos);
    }

    if (this.onErrorCb) {
      this.onErrorCb(err);
    }
  }

  private resetSignalLossTimer(thresholdMs: number): void {
    this.clearSignalLossTimer();
    this.signalLossTimer = setTimeout(() => {
      if (this.isTracking) {
        this.updateSignalStatus('SIGNAL_LOST');
      }
    }, thresholdMs);
  }

  private clearSignalLossTimer(): void {
    if (this.signalLossTimer) {
      clearTimeout(this.signalLossTimer);
      this.signalLossTimer = null;
    }
  }

  private updateSignalStatus(newSource: LocationSignalSource): void {
    if (this.currentSource !== newSource) {
      this.currentSource = newSource;
      if (this.onSignalCb) {
        this.onSignalCb(newSource);
      }
    }
  }
}

export const locationService = new LocationService();
