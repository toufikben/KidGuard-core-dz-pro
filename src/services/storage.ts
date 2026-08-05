import { KidProfile, GeofenceZone, LocationLog, AlertEvent, ParentAuth, AppLanguageCode, AppThemeMode } from '../types';

const KEYS = {
  KIDS: 'kidguard_kids',
  GEOFENCES: 'kidguard_geofences',
  LOCATION_LOGS: 'kidguard_location_logs',
  ALERTS: 'kidguard_alerts',
  PARENT_AUTH: 'kidguard_parent_auth',
  SELECTED_KID_ID: 'kidguard_selected_kid_id',
  LANGUAGE: 'selected_language',
  THEME_MODE: 'selected_theme_mode',
};

// Default demo coordinates are in central Algiers, Algeria - matching the
// app's target market (and the +213 phone numbers used throughout the demo
// data below). These previously pointed at San Francisco, CA, which was an
// inconsistent leftover from an earlier template.
const DEFAULT_KIDS: KidProfile[] = [
  {
    id: 1,
    name: 'Leo',
    avatarColorHex: '#3B82F6',
    avatarPreset: 'boy_1',
    emergencyPhone: '+213 555 0199',
    isTrackingActive: true,
    batteryPercent: 88,
    currentLat: 36.7538,
    currentLng: 3.0588,
    currentSpeedKmh: 3.2,
    lastUpdatedTime: Date.now(),
    statusText: 'Safe in Home Safe Zone',
  },
  {
    id: 2,
    name: 'Maya',
    avatarColorHex: '#EC4899',
    avatarPreset: 'girl_1',
    emergencyPhone: '+213 555 0199',
    isTrackingActive: true,
    batteryPercent: 94,
    currentLat: 36.7569,
    currentLng: 3.0662,
    currentSpeedKmh: 0.0,
    lastUpdatedTime: Date.now(),
    statusText: 'Safe in School Zone',
  },
];

const DEFAULT_GEOFENCES: GeofenceZone[] = [
  {
    id: 1,
    name: 'Home Safe Zone',
    latitude: 36.7538,
    longitude: 3.0588,
    radiusMeters: 200,
    isEnabled: true,
    iconName: 'home',
    colorHex: '#10B981',
  },
  {
    id: 2,
    name: 'School Safe Zone',
    latitude: 36.7569,
    longitude: 3.0662,
    radiusMeters: 300,
    isEnabled: true,
    iconName: 'school',
    colorHex: '#3B82F6',
  },
];

// IMPORTANT: no hardcoded default PIN/answer here. Shipping a real-looking
// default secret ("1234" / "Teddy") meant every fresh install was protected
// by a publicly-known passcode. isSetupComplete starts false so every new
// install is forced through PinLockScreen's SETUP_PIN flow, where the parent
// picks and hashes their own PIN before the app is usable.
const DEFAULT_PARENT_AUTH: ParentAuth = {
  id: 1,
  pinCode: '',
  parentPhone: '+213 555 0199',
  alertMethod: 'BOTH',
  isSetupComplete: false,
  lastLoginTimestamp: Date.now(),
  failedPinAttempts: 0,
  lockedUntilTimestamp: null,
};

export const StorageService = {
  getKids(): KidProfile[] {
    const data = localStorage.getItem(KEYS.KIDS);
    if (!data) {
      localStorage.setItem(KEYS.KIDS, JSON.stringify(DEFAULT_KIDS));
      return DEFAULT_KIDS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_KIDS;
    }
  },

  saveKids(kids: KidProfile[]): void {
    localStorage.setItem(KEYS.KIDS, JSON.stringify(kids));
  },

  getGeofences(): GeofenceZone[] {
    const data = localStorage.getItem(KEYS.GEOFENCES);
    if (!data) {
      localStorage.setItem(KEYS.GEOFENCES, JSON.stringify(DEFAULT_GEOFENCES));
      return DEFAULT_GEOFENCES;
    }
    try {
      return JSON.parse(data);
    } catch {
      return DEFAULT_GEOFENCES;
    }
  },

  saveGeofences(zones: GeofenceZone[]): void {
    localStorage.setItem(KEYS.GEOFENCES, JSON.stringify(zones));
  },

  getLocationLogs(): LocationLog[] {
    const data = localStorage.getItem(KEYS.LOCATION_LOGS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveLocationLogs(logs: LocationLog[]): void {
    localStorage.setItem(KEYS.LOCATION_LOGS, JSON.stringify(logs));
  },

  getAlerts(): AlertEvent[] {
    const data = localStorage.getItem(KEYS.ALERTS);
    if (!data) return [];
    try {
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAlerts(alerts: AlertEvent[]): void {
    localStorage.setItem(KEYS.ALERTS, JSON.stringify(alerts));
  },

  getParentAuth(): ParentAuth {
    const data = localStorage.getItem(KEYS.PARENT_AUTH);
    if (!data) {
      localStorage.setItem(KEYS.PARENT_AUTH, JSON.stringify(DEFAULT_PARENT_AUTH));
      return DEFAULT_PARENT_AUTH;
    }
    try {
      const parsed = JSON.parse(data);
      // Backfill fields for auth records saved before brute-force lockout was added.
      return {
        ...DEFAULT_PARENT_AUTH,
        ...parsed,
        failedPinAttempts: parsed.failedPinAttempts ?? 0,
        lockedUntilTimestamp: parsed.lockedUntilTimestamp ?? null,
      };
    } catch {
      return DEFAULT_PARENT_AUTH;
    }
  },

  saveParentAuth(auth: ParentAuth): void {
    localStorage.setItem(KEYS.PARENT_AUTH, JSON.stringify(auth));
  },

  getSelectedKidId(): number {
    const id = localStorage.getItem(KEYS.SELECTED_KID_ID);
    return id ? parseInt(id, 10) : 1;
  },

  saveSelectedKidId(id: number): void {
    localStorage.setItem(KEYS.SELECTED_KID_ID, id.toString());
  },

  getLanguage(): AppLanguageCode {
    const lang = localStorage.getItem(KEYS.LANGUAGE);
    if (lang === 'ar' || lang === 'fr' || lang === 'en') return lang;
    return 'ar'; // Default matching Android app
  },

  saveLanguage(lang: AppLanguageCode): void {
    localStorage.setItem(KEYS.LANGUAGE, lang);
  },

  getThemeMode(): AppThemeMode {
    const mode = localStorage.getItem(KEYS.THEME_MODE);
    if (mode === 'dark' || mode === 'system' || mode === 'light') return mode;
    return 'light';
  },

  saveThemeMode(mode: AppThemeMode): void {
    localStorage.setItem(KEYS.THEME_MODE, mode);
  },
};
