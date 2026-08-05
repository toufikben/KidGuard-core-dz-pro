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

// In-memory fallback cache in case localStorage/IndexedDB is disabled, closing, or hidden
const memoryCache: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key) ?? memoryCache[key] ?? null;
  } catch {
    return memoryCache[key] ?? null;
  }
}

function safeSetItem(key: string, value: string): void {
  memoryCache[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn(`Storage setItem failed for key ${key}:`, e);
  }
}

export const StorageService = {
  getKids(): KidProfile[] {
    try {
      const data = safeGetItem(KEYS.KIDS);
      if (!data) {
        this.saveKids(DEFAULT_KIDS);
        return DEFAULT_KIDS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_KIDS;
    }
  },

  saveKids(kids: KidProfile[]): void {
    try {
      safeSetItem(KEYS.KIDS, JSON.stringify(kids));
    } catch (e) {
      console.warn('saveKids failed:', e);
    }
  },

  getGeofences(): GeofenceZone[] {
    try {
      const data = safeGetItem(KEYS.GEOFENCES);
      if (!data) {
        this.saveGeofences(DEFAULT_GEOFENCES);
        return DEFAULT_GEOFENCES;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_GEOFENCES;
    }
  },

  saveGeofences(zones: GeofenceZone[]): void {
    try {
      safeSetItem(KEYS.GEOFENCES, JSON.stringify(zones));
    } catch (e) {
      console.warn('saveGeofences failed:', e);
    }
  },

  getLocationLogs(): LocationLog[] {
    try {
      const data = safeGetItem(KEYS.LOCATION_LOGS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveLocationLogs(logs: LocationLog[]): void {
    try {
      safeSetItem(KEYS.LOCATION_LOGS, JSON.stringify(logs));
    } catch (e) {
      console.warn('saveLocationLogs failed:', e);
    }
  },

  getAlerts(): AlertEvent[] {
    try {
      const data = safeGetItem(KEYS.ALERTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveAlerts(alerts: AlertEvent[]): void {
    try {
      safeSetItem(KEYS.ALERTS, JSON.stringify(alerts));
    } catch (e) {
      console.warn('saveAlerts failed:', e);
    }
  },

  getParentAuth(): ParentAuth {
    try {
      const data = safeGetItem(KEYS.PARENT_AUTH);
      if (!data) {
        this.saveParentAuth(DEFAULT_PARENT_AUTH);
        return DEFAULT_PARENT_AUTH;
      }
      const parsed = JSON.parse(data);
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
    try {
      safeSetItem(KEYS.PARENT_AUTH, JSON.stringify(auth));
    } catch (e) {
      console.warn('saveParentAuth failed:', e);
    }
  },

  getSelectedKidId(): number {
    try {
      const id = safeGetItem(KEYS.SELECTED_KID_ID);
      return id ? parseInt(id, 10) : 1;
    } catch {
      return 1;
    }
  },

  saveSelectedKidId(id: number): void {
    try {
      safeSetItem(KEYS.SELECTED_KID_ID, id.toString());
    } catch (e) {
      console.warn('saveSelectedKidId failed:', e);
    }
  },

  getLanguage(): AppLanguageCode {
    try {
      const lang = safeGetItem(KEYS.LANGUAGE);
      if (lang === 'ar' || lang === 'fr' || lang === 'en') return lang;
      return 'ar';
    } catch {
      return 'ar';
    }
  },

  saveLanguage(lang: AppLanguageCode): void {
    try {
      safeSetItem(KEYS.LANGUAGE, lang);
    } catch (e) {
      console.warn('saveLanguage failed:', e);
    }
  },

  getThemeMode(): AppThemeMode {
    try {
      const mode = safeGetItem(KEYS.THEME_MODE);
      if (mode === 'dark' || mode === 'system' || mode === 'light') return mode;
      return 'light';
    } catch {
      return 'light';
    }
  },

  saveThemeMode(mode: AppThemeMode): void {
    try {
      safeSetItem(KEYS.THEME_MODE, mode);
    } catch (e) {
      console.warn('saveThemeMode failed:', e);
    }
  },
};
