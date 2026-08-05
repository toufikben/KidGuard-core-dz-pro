import { GeofenceZone } from '../../types';

export interface SafeZoneStatus {
  isInsideSafeZone: boolean;
  matchedZone: GeofenceZone | null;
  distanceToNearestZoneMeters: number;
  isExitEventDetected: boolean;
  isEntryEventDetected: boolean;
  statusMessage: string;
}

export class GeofenceMonitor {
  // undefined = no observation yet for this kid (used to suppress a spurious
  // transition event on the very first GPS fix - see monitorCoordinates below).
  private previousZoneStates: Map<number, boolean> = new Map();

  public calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000.0;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  public monitorCoordinates(
    kidId: number,
    kidName: string,
    latitude: number,
    longitude: number,
    activeZones: GeofenceZone[]
  ): SafeZoneStatus {
    const enabledZones = activeZones.filter((z) => z.isEnabled);
    let insideZone: GeofenceZone | null = null;
    let insideZoneEdgeDistance = Number.MAX_VALUE;
    // Single consistent metric: how far from the nearest zone's *edge*, in
    // meters. 0 means at-or-inside a zone boundary. Previously this compared
    // raw distance-to-center (for zones you're inside) against
    // distance-to-edge (for zones you're outside) as if they were the same
    // unit, so the reported "nearest zone distance" could be misleading.
    let nearestEdgeDistance = Number.MAX_VALUE;

    for (const zone of enabledZones) {
      const dist = this.calculateDistanceMeters(latitude, longitude, zone.latitude, zone.longitude);
      const edgeDistance = dist - zone.radiusMeters; // <= 0 means inside this zone

      if (edgeDistance < nearestEdgeDistance) {
        nearestEdgeDistance = edgeDistance;
      }

      if (edgeDistance <= 0 && edgeDistance < insideZoneEdgeDistance) {
        insideZoneEdgeDistance = edgeDistance;
        insideZone = zone;
      }
    }

    const isCurrentlyInside = insideZone !== null;

    // No prior observation for this kid yet - there's nothing to compare
    // against, so don't report a transition either way. The old code
    // defaulted the "previous" state to `true` (assumed safe), which meant a
    // child whose very first GPS fix was already outside every zone would
    // incorrectly fire a "LeftSafeZone" exit event despite never having been
    // recorded as inside anywhere - i.e. a false alert on app startup.
    const previousState = this.previousZoneStates.get(kidId);
    const hasPriorObservation = previousState !== undefined;
    const isExitEvent = hasPriorObservation && previousState === true && !isCurrentlyInside;
    const isEntryEvent = hasPriorObservation && previousState === false && isCurrentlyInside;
    this.previousZoneStates.set(kidId, isCurrentlyInside);

    const statusText = isCurrentlyInside
      ? `Safe in ${insideZone?.name || 'Safe Zone'}`
      : 'Outside Safe Geofence Zone!';

    return {
      isInsideSafeZone: isCurrentlyInside,
      matchedZone: insideZone,
      distanceToNearestZoneMeters: nearestEdgeDistance === Number.MAX_VALUE ? 0 : Math.max(0, nearestEdgeDistance),
      isExitEventDetected: isExitEvent,
      isEntryEventDetected: isEntryEvent,
      statusMessage: statusText,
    };
  }

  public resetState(kidId: number): void {
    this.previousZoneStates.delete(kidId);
  }
}
