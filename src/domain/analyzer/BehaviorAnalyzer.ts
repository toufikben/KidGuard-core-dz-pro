import { MotionState, BehaviorEvent } from '../../types';

export interface MotionSnapshot {
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestampMs: number;
  insideSafeZone: boolean;
  zoneName?: string;
}

export const DEFAULT_MAX_HISTORY = 20;

export const SPEED_THRESHOLDS = {
  STATIONARY_MAX: 0.8,
  WALKING_MAX: 7.0,
  RUNNING_MAX: 15.0,
  SUSTAINED_SPEED_DELTA: 4.0,
} as const;

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180
  );
}

export class BehaviorAnalyzer {
  private recentSnapshots: MotionSnapshot[] = [];
  private maxHistory: number;
  private stoppedSinceLeavingZone = true;
  private wasInsideSafeZone = true;

  // Edge-trigger tracking so events fire once per transition, not once per GPS sample.
  private lastMotionState: MotionState | null = null;
  private noStopAlertFired = false;
  private speedIncreaseAlertFired = false;

  constructor(maxHistory: number = DEFAULT_MAX_HISTORY) {
    this.maxHistory = Math.max(1, maxHistory);
  }

  public classifyMotion(speedKmh: number): MotionState {
    const speed = Math.max(0, Number.isFinite(speedKmh) ? speedKmh : 0);
    if (speed < SPEED_THRESHOLDS.STATIONARY_MAX) return 'STATIONARY';
    if (speed < SPEED_THRESHOLDS.WALKING_MAX) return 'WALKING';
    if (speed < SPEED_THRESHOLDS.RUNNING_MAX) return 'RUNNING';
    return 'VEHICLE';
  }

  public analyze(snapshot: MotionSnapshot): BehaviorEvent[] {
    if (!isValidCoordinate(snapshot.latitude, snapshot.longitude)) {
      console.warn('Invalid coordinate snapshot ignored:', snapshot.latitude, snapshot.longitude);
      return [];
    }

    const safeSpeed = Math.max(0, Number.isFinite(snapshot.speedKmh) ? snapshot.speedKmh : 0);
    const validSnapshot: MotionSnapshot = {
      ...snapshot,
      speedKmh: safeSpeed,
    };

    const events: BehaviorEvent[] = [];

    if (this.wasInsideSafeZone && !validSnapshot.insideSafeZone) {
      const prevZone = this.recentSnapshots[this.recentSnapshots.length - 1]?.zoneName;
      events.push({ type: 'LeftSafeZone', zoneName: prevZone });
      this.stoppedSinceLeavingZone = false;
      this.noStopAlertFired = false;
      this.speedIncreaseAlertFired = false;
      this.lastMotionState = null;
    } else if (!this.wasInsideSafeZone && validSnapshot.insideSafeZone && validSnapshot.zoneName) {
      events.push({ type: 'ReturnedToSafeZone', zoneName: validSnapshot.zoneName });
      this.stoppedSinceLeavingZone = true;
      this.noStopAlertFired = false;
      this.speedIncreaseAlertFired = false;
      this.lastMotionState = null;
    }
    this.wasInsideSafeZone = validSnapshot.insideSafeZone;

    if (!validSnapshot.insideSafeZone) {
      const motion = this.classifyMotion(validSnapshot.speedKmh);

      if (motion === 'STATIONARY') {
        this.stoppedSinceLeavingZone = true;
        // A stop resets both "sustained" trackers - a fresh vehicle/acceleration
        // segment after stopping should be able to raise a new alert.
        this.noStopAlertFired = false;
        this.speedIncreaseAlertFired = false;
      }

      const previous = this.recentSnapshots[this.recentSnapshots.length - 1];
      if (previous) {
        const speedDelta = validSnapshot.speedKmh - previous.speedKmh;
        if (speedDelta > SPEED_THRESHOLDS.SUSTAINED_SPEED_DELTA && motion !== 'STATIONARY') {
          // Fire once per acceleration episode, not on every sample of the climb.
          if (!this.speedIncreaseAlertFired) {
            events.push({ type: 'SustainedSpeedIncrease' });
            this.speedIncreaseAlertFired = true;
          }
        } else if (speedDelta <= 0) {
          // Speed has leveled off/dropped - allow a future increase to alert again.
          this.speedIncreaseAlertFired = false;
        }
      }

      if (motion === 'VEHICLE') {
        // Only fire "entered vehicle" on the transition into vehicle motion.
        if (this.lastMotionState !== 'VEHICLE') {
          events.push({ type: 'EnteredVehicle' });
        }
        // Fire "no stop" once per continuous non-stopping vehicle segment, not every tick.
        if (!this.stoppedSinceLeavingZone && !this.noStopAlertFired) {
          events.push({ type: 'NoStopDetected' });
          this.noStopAlertFired = true;
        }
      }

      this.lastMotionState = motion;
    } else {
      this.lastMotionState = null;
    }

    this.recentSnapshots.push(validSnapshot);
    if (this.recentSnapshots.length > this.maxHistory) {
      this.recentSnapshots.shift();
    }

    return events;
  }

  public reset(): void {
    this.recentSnapshots = [];
    this.stoppedSinceLeavingZone = true;
    this.wasInsideSafeZone = true;
    this.lastMotionState = null;
    this.noStopAlertFired = false;
    this.speedIncreaseAlertFired = false;
  }
}

