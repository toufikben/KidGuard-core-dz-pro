import { MotionState, BehaviorEvent } from '../../types';

export interface MotionSnapshot {
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestampMs: number;
  insideSafeZone: boolean;
  zoneName?: string;
}

export class BehaviorAnalyzer {
  private recentSnapshots: MotionSnapshot[] = [];
  private maxHistory = 20;
  private stoppedSinceLeavingZone = true;
  private wasInsideSafeZone = true;

  // Edge-trigger tracking so events fire once per transition, not once per GPS sample.
  private lastMotionState: MotionState | null = null;
  private noStopAlertFired = false;
  private speedIncreaseAlertFired = false;

  public classifyMotion(speedKmh: number): MotionState {
    if (speedKmh < 0.8) return 'STATIONARY';
    if (speedKmh < 7.0) return 'WALKING';
    if (speedKmh < 15.0) return 'RUNNING';
    return 'VEHICLE';
  }

  public analyze(snapshot: MotionSnapshot): BehaviorEvent[] {
    const events: BehaviorEvent[] = [];

    if (this.wasInsideSafeZone && !snapshot.insideSafeZone) {
      const prevZone = this.recentSnapshots[this.recentSnapshots.length - 1]?.zoneName;
      events.push({ type: 'LeftSafeZone', zoneName: prevZone });
      this.stoppedSinceLeavingZone = false;
      this.noStopAlertFired = false;
      this.speedIncreaseAlertFired = false;
      this.lastMotionState = null;
    } else if (!this.wasInsideSafeZone && snapshot.insideSafeZone && snapshot.zoneName) {
      events.push({ type: 'ReturnedToSafeZone', zoneName: snapshot.zoneName });
      this.stoppedSinceLeavingZone = true;
      this.noStopAlertFired = false;
      this.speedIncreaseAlertFired = false;
      this.lastMotionState = null;
    }
    this.wasInsideSafeZone = snapshot.insideSafeZone;

    if (!snapshot.insideSafeZone) {
      const motion = this.classifyMotion(snapshot.speedKmh);

      if (motion === 'STATIONARY') {
        this.stoppedSinceLeavingZone = true;
        // A stop resets both "sustained" trackers - a fresh vehicle/acceleration
        // segment after stopping should be able to raise a new alert.
        this.noStopAlertFired = false;
        this.speedIncreaseAlertFired = false;
      }

      const previous = this.recentSnapshots[this.recentSnapshots.length - 1];
      if (previous) {
        const speedDelta = snapshot.speedKmh - previous.speedKmh;
        if (speedDelta > 4.0 && motion !== 'STATIONARY') {
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

    this.recentSnapshots.push(snapshot);
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
