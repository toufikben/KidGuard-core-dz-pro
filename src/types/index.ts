export type MotionState = 'STATIONARY' | 'WALKING' | 'RUNNING' | 'VEHICLE';

export type TamperType = 
  | 'GPS_DISABLED' 
  | 'APP_KILLED' 
  | 'PERMISSION_REVOKED' 
  | 'AIRPLANE_MODE' 
  | 'LOCATION_SERVICE_STOPPED';

export type BehaviorEvent =
  | { type: 'LeftSafeZone'; zoneName?: string }
  | { type: 'ReturnedToSafeZone'; zoneName: string }
  | { type: 'UnusualRouteDetected' }
  | { type: 'SustainedSpeedIncrease' }
  | { type: 'NoStopDetected' }
  | { type: 'EnteredVehicle' }
  | { type: 'TamperDetected'; tamperType: TamperType };

export type RiskAction =
  | 'BEGIN_CLOSE_MONITORING'
  | 'NOTIFY_PARENT'
  | 'SMS_PARENT'
  | 'CALL_PARENT'
  | 'START_CONTINUOUS_LOCATION'
  | 'START_AUDIO_RECORDING';

export interface RiskReport {
  riskScore: number;
  riskReasons: string[];
  lastLocation: { latitude: number; longitude: number } | null;
  speedKmh: number;
  isInsideSafeZone: boolean;
  hasInternet: boolean;
  batteryPercent: number;
  lastMovementTime: number;
  activeActions: RiskAction[];
}

export interface KidProfile {
  id: number;
  name: string;
  avatarColorHex: string;
  avatarPreset: string; // 'boy_1' | 'girl_1' | 'superhero' | 'bear' | 'star' | 'rocket'
  emergencyPhone: string;
  isTrackingActive: boolean;
  batteryPercent: number;
  currentLat: number;
  currentLng: number;
  currentSpeedKmh: number;
  lastUpdatedTime: number;
  statusText: string;
}

export interface GeofenceZone {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  isEnabled: boolean;
  iconName: string; // 'home' | 'school' | 'park' | 'sports'
  colorHex: string;
}

export interface LocationLog {
  id: number;
  kidId: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  timestamp: number;
  addressLabel: string;
}

export interface AlertEvent {
  id: number;
  kidId: number;
  kidName: string;
  alertType: 'SOS' | 'BREACH_OUT' | 'BREACH_IN' | 'LOW_BATTERY' | 'UNUSUAL_BEHAVIOR' | 'SPEED_WARNING' | 'TAMPER_ALERT';
  title: string;
  message: string;
  timestamp: number;
  latitude: number;
  longitude: number;
  isRead: boolean;
}

export interface ParentAuth {
  id: number;
  /** SHA-256 hex digest of the 4-digit PIN. Never store the raw PIN. */
  pinCode: string;
  parentPhone: string;
  alertMethod: 'CALL' | 'SMS' | 'BOTH';
  isSetupComplete: boolean;
  lastLoginTimestamp: number;
  /** Consecutive failed PIN attempts since the last successful unlock. */
  failedPinAttempts: number;
  /** Epoch ms until which PIN entry is locked out, or null if not currently locked. */
  lockedUntilTimestamp: number | null;
}

export type AuthState = 
  | { type: 'SetupRequired' }
  | { type: 'Locked' }
  | { type: 'Unlocked' };

export type AppLanguageCode = 'en' | 'ar' | 'fr';

export interface AppLanguage {
  code: AppLanguageCode;
  displayName: string;
  isRtl: boolean;
}

export type AppThemeMode = 'light' | 'dark' | 'system';

export type MapDisplayMode = 'LEAFLET_MAP' | 'TACTICAL_RADAR';
