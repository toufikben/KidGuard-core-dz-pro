import { GeofenceZone } from '../../types';

export interface SafeZoneStatus {
  isInsideSafeZone: boolean;
  matchedZone: GeofenceZone | null;
  distanceToNearestZoneMeters: number;
  isExitEventDetected: boolean;
  isEntryEventDetected: boolean;
  statusMessage: string;
}

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

export class GeofenceMonitor {
  // undefined = no observation yet for this kid (used to suppress a spurious
  // transition event on the very first GPS fix - see monitorCoordinates below).
  private previousZoneStates: Map<number, boolean> = new Map();

  public calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
    if (!isValidCoordinate(lat1, lng1) || !isValidCoordinate(lat2, lng2)) {
      return Infinity;
    }

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
    latitude: number,
    longitude: number,
    activeZones: GeofenceZone[]
  ): SafeZoneStatus {
    if (!isValidCoordinate(latitude, longitude)) {
      return {
        isInsideSafeZone: false,
        matchedZone: null,
        distanceToNearestZoneMeters: Infinity,
        isExitEventDetected: false,
        isEntryEventDetected: false,
        statusMessage: 'Invalid GPS Coordinates',
      };
    }

    const enabledZones = activeZones.filter((z) => z.isEnabled && isValidCoordinate(z.latitude, z.longitude));
    let insideZone: GeofenceZone | null = null;
    let insideZoneEdgeDistance = Number.MAX_VALUE;
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
      distanceToNearestZoneMeters:
        enabledZones.length === 0 || nearestEdgeDistance === Number.MAX_VALUE
          ? Infinity
          : Math.max(0, nearestEdgeDistance),
      isExitEventDetected: isExitEvent,
      isEntryEventDetected: isEntryEvent,
      statusMessage: statusText,
    };
  }

  public resetState(kidId: number): void {
    this.previousZoneStates.delete(kidId);
  }
}

