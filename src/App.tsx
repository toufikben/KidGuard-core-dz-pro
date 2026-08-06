import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { BottomNav, ActiveTab } from './components/BottomNav';
import { PinLockScreen } from './components/PinLockScreen';
import { ErrorBoundary } from './components/ErrorBoundary';

import { StorageService } from './services/storage';
import { audioSiren } from './services/audioSiren';
import { NotificationService } from './services/notifications';
import { locationService, LocationPosition } from './services/LocationService';
import { BatteryService } from './services/BatteryService';
import { AppStrings } from './i18n/translations';
import {
  KidProfile,
  GeofenceZone,
  LocationLog,
  AlertEvent,
  ParentAuth,
  AuthState,
  AppLanguageCode,
  AppThemeMode,
  RiskAction,
  TamperType,
} from './types';

import { GeofenceMonitor } from './domain/geofence/GeofenceMonitor';
import { BehaviorAnalyzer } from './domain/analyzer/BehaviorAnalyzer';
import { EmergencyEngine } from './domain/emergency/EmergencyEngine';

import { TimelineEventItem } from './components/EventTimelineWidget';

// Lazy-loaded main screens
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then((m) => ({ default: m.DashboardScreen })));
const GeofenceScreen = lazy(() => import('./screens/GeofenceScreen').then((m) => ({ default: m.GeofenceScreen })));
const HistoryScreen = lazy(() => import('./screens/HistoryScreen').then((m) => ({ default: m.HistoryScreen })));
const AlertsScreen = lazy(() => import('./screens/AlertsScreen').then((m) => ({ default: m.AlertsScreen })));
const KidsManagerScreen = lazy(() => import('./screens/KidsManagerScreen').then((m) => ({ default: m.KidsManagerScreen })));
const SettingsScreen = lazy(() => import('./screens/SettingsScreen').then((m) => ({ default: m.SettingsScreen })));

// Fallback spinner skeleton while lazy-loading screen chunk
const LoadingFallback: React.FC = () => (
  <div className="flex flex-col items-center justify-center min-h-[450px] p-6 text-slate-400 gap-3">
    <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
    <span className="text-xs font-semibold tracking-wide uppercase text-slate-500">Loading Module...</span>
  </div>
);

// Fallback coordinates when no kid is selected yet - central Algiers, matching
// the app's target market (see services/storage.ts default demo data).
const FALLBACK_LAT = 36.7538;
const FALLBACK_LNG = 3.0588;

export const App: React.FC = () => {
  // Domain engine singletons
  const geofenceMonitorRef = useRef(new GeofenceMonitor());
  const behaviorAnalyzerRef = useRef(new BehaviorAnalyzer());
  const emergencyEngineRef = useRef(new EmergencyEngine());

  // Storage and State Initialization
  const [parentAuth, setParentAuth] = useState<ParentAuth>(() => StorageService.getParentAuth());
  const [authState, setAuthState] = useState<AuthState>(() =>
    StorageService.getParentAuth().isSetupComplete ? { type: 'Unlocked' } : { type: 'SetupRequired' }
  );

  const [kids, setKids] = useState<KidProfile[]>(() => StorageService.getKids());
  const [selectedKidId, setSelectedKidId] = useState<number>(() => StorageService.getSelectedKidId());
  const [geofences, setGeofences] = useState<GeofenceZone[]>(() => StorageService.getGeofences());
  const [locationLogs, setLocationLogs] = useState<LocationLog[]>(() => StorageService.getLocationLogs());
  const [alerts, setAlerts] = useState<AlertEvent[]>(() => StorageService.getAlerts());

  const [currentLang, setCurrentLang] = useState<AppLanguageCode>(() => StorageService.getLanguage());
  const [currentTheme, setCurrentTheme] = useState<AppThemeMode>(() => StorageService.getThemeMode());
  const [activeTab, setActiveTab] = useState<ActiveTab>('radar');

  const [isSimulatingWalk, setIsSimulatingWalk] = useState(false);

  // Next Steps Domain States
  const [riskScore, setRiskScore] = useState<number>(0);
  const [activeActions, setActiveActions] = useState<RiskAction[]>([]);
  const [isGpsActive, setIsGpsActive] = useState(true);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [isPermissionsGranted, setIsPermissionsGranted] = useState(true);

  // Initial rich Event Timeline items
  const [timelineEvents, setTimelineEvents] = useState<TimelineEventItem[]>([
    {
      id: 't_0814',
      timeString: '08:14 AM',
      timestampMs: Date.now() - 4 * 3600 * 1000,
      title: 'Entered Safe Zone: Primary School',
      subtitle: 'Child arrived safely within geofence boundary.',
      category: 'SAFE_ZONE',
      locationName: 'Primary School, 123 Education Ave',
      riskScore: 0,
    },
    {
      id: 't_1232',
      timeString: '12:32 PM',
      timestampMs: Date.now() - 2 * 3600 * 1000,
      title: 'Exited Safe Zone: School Boundary',
      subtitle: 'Geofence breach detected outside scheduled dismissal time.',
      category: 'SAFE_ZONE',
      locationName: 'Out-of-bounds Perimeter',
      riskScore: 15,
    },
    {
      id: 't_1236',
      timeString: '12:36 PM',
      timestampMs: Date.now() - 110 * 60 * 1000,
      title: 'Entered Vehicle / Speed Acceleration',
      subtitle: 'Rapid velocity increase to 24.5 km/h along main road.',
      category: 'VEHICLE',
      locationName: 'Boulevard Highway',
      riskScore: 35,
    },
    {
      id: 't_1241',
      timeString: '12:41 PM',
      timestampMs: Date.now() - 105 * 60 * 1000,
      title: 'Moved 3.2km Away From Safe Route',
      subtitle: 'Unusual movement direction flagged by BehaviorAnalyzer.',
      category: 'EMERGENCY',
      locationName: 'West Suburban Sector',
      riskScore: 70,
    },
    {
      id: 't_1244',
      timeString: '12:44 PM',
      timestampMs: Date.now() - 102 * 60 * 1000,
      title: 'Automatic Ambient Audio Recording Started',
      subtitle: 'Micro-recording triggered due to Elevated Risk Level (70/100).',
      category: 'AUDIO',
      locationName: 'Suburban Sector',
      riskScore: 70,
    },
  ]);

  // Adaptive sampling calculation
  const getAdaptiveSamplingText = () => {
    if (riskScore >= 70) return currentLang === 'ar' ? 'كل 5 ثوان (خطر مرتفع)' : '5s (High Risk Dynamic)';
    if (isSimulatingWalk) return currentLang === 'ar' ? 'كل 20 ثانية (مشاة / حركة)' : '20s (Active Walking)';
    return currentLang === 'ar' ? 'كل دقيقة (ثابت / آمن)' : '1min (Stationary Mode)';
  };


  // Sync RTL, Language, and Document Title
  useEffect(() => {
    StorageService.saveLanguage(currentLang);
    const isRtl = currentLang === 'ar';
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    document.title = `${AppStrings.getAppName(currentLang)} - ${AppStrings.getAppSubTitle(currentLang)}`;
  }, [currentLang]);

  // Sync Theme Mode
  useEffect(() => {
    StorageService.saveThemeMode(currentTheme);
    if (currentTheme === 'dark' || (currentTheme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [currentTheme]);

  // Save changes to storage
  useEffect(() => { StorageService.saveKids(kids); }, [kids]);
  useEffect(() => { StorageService.saveGeofences(geofences); }, [geofences]);
  useEffect(() => { StorageService.saveLocationLogs(locationLogs); }, [locationLogs]);
  useEffect(() => { StorageService.saveAlerts(alerts); }, [alerts]);
  useEffect(() => { StorageService.saveParentAuth(parentAuth); }, [parentAuth]);
  useEffect(() => { StorageService.saveSelectedKidId(selectedKidId); }, [selectedKidId]);

  const activeKid = kids.find((k) => k.id === selectedKidId) || kids[0] || null;

  // Real-time Browser GPS Tracking via LocationService
  useEffect(() => {
    if (isSimulatingWalk || !isGpsActive || isAirplaneMode || !isPermissionsGranted || !activeKid || authState.type !== 'Unlocked') {
      locationService.stopTracking();
      return;
    }

    const handleNewPosition = (pos: LocationPosition) => {
      const { latitude, longitude, speedKmh, timestamp } = pos;
      const now = timestamp || Date.now();

      const status = geofenceMonitorRef.current.monitorCoordinates(
        activeKid.id,
        latitude,
        longitude,
        geofences
      );

      const behaviorEvents = behaviorAnalyzerRef.current.analyze({
        latitude,
        longitude,
        speedKmh,
        timestampMs: now,
        insideSafeZone: status.isInsideSafeZone,
        zoneName: status.matchedZone?.name,
      });

      const emergencyTick = emergencyEngineRef.current.evaluate(behaviorEvents);
      setRiskScore(emergencyTick.riskScore);
      setActiveActions(emergencyEngineRef.current.getActiveActions());

      setKids((prevKids) =>
        prevKids.map((k) =>
          k.id === activeKid.id
            ? {
                ...k,
                currentLat: latitude,
                currentLng: longitude,
                currentSpeedKmh: speedKmh,
                lastUpdatedTime: now,
                statusText: pos.source === 'SIGNAL_LOST' ? 'GPS Signal Lost' : status.statusMessage,
              }
            : k
        )
      );

      const newLog: LocationLog = {
        id: now,
        kidId: activeKid.id,
        latitude,
        longitude,
        speedKmh,
        timestamp: now,
        addressLabel: status.isInsideSafeZone ? status.matchedZone?.name || 'Safe Boundary' : 'Live GPS Location',
      };
      setLocationLogs((prev) => [newLog, ...prev.slice(0, 49)]);

      if (status.isExitEventDetected) {
        const breachAlert: AlertEvent = {
          id: now,
          kidId: activeKid.id,
          kidName: activeKid.name,
          alertType: 'BREACH_OUT',
          title: '🚨 Geofence Breach Out Alert!',
          message: `${activeKid.name} exited safe boundary zone! Risk Score: ${emergencyTick.riskScore}/100.`,
            timestamp: now,
            latitude,
            longitude,
            isRead: false,
          };
          setAlerts((prev) => [breachAlert, ...prev]);

          const nowStr = new Date(now).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          setTimelineEvents((prev) => [
            {
              id: `tl_${now}`,
              timeString: nowStr,
              timestampMs: now,
              title: `Exited Safe Zone: ${status.matchedZone?.name || 'Boundary'}`,
              subtitle: `Real GPS boundary breach recorded.`,
              category: 'SAFE_ZONE',
              locationName: status.matchedZone?.name || 'Outside Safe Perimeter',
              riskScore: emergencyTick.riskScore,
            },
            ...prev,
          ]);
        }
      };

      locationService.startTracking(
        handleNewPosition,
        (error) => {
          console.warn('Geolocation positioning unavailable or ungranted:', error.message);
        },
        undefined,
        {
          enableHighAccuracy: true,
          gpsTimeoutMs: 10000,
          signalLossThresholdMs: 15000,
        }
      );

      return () => {
        locationService.stopTracking();
      };
    }, [isSimulatingWalk, isGpsActive, isAirplaneMode, isPermissionsGranted, activeKid?.id, geofences, authState.type]);

  // Real-time GPS & Simulated Walk Trajectory Loop
  useEffect(() => {
    if (!isSimulatingWalk || !activeKid) return;

    let stepCount = 0;
    const interval = setInterval(() => {
      stepCount++;
      // Move trajectory slightly away from center (0.0003 lat/lng per tick)
      const latOffset = 0.00035 * Math.sin(stepCount * 0.4);
      const lngOffset = 0.00045 * Math.cos(stepCount * 0.4);

      const newLat = activeKid.currentLat + latOffset;
      const newLng = activeKid.currentLng + lngOffset;
      const speed = 4.2 + Math.random() * 2.5;

      // Geofence & Risk Engine Evaluation
      const status = geofenceMonitorRef.current.monitorCoordinates(
        activeKid.id,
        newLat,
        newLng,
        geofences
      );

      // Behavior Analyzer Evaluation
      const behaviorEvents = behaviorAnalyzerRef.current.analyze({
        latitude: newLat,
        longitude: newLng,
        speedKmh: speed,
        timestampMs: Date.now(),
        insideSafeZone: status.isInsideSafeZone,
        zoneName: status.matchedZone?.name,
      });

      // Emergency Engine Evaluation
      const emergencyTick = emergencyEngineRef.current.evaluate(behaviorEvents);
      setRiskScore(emergencyTick.riskScore);
      setActiveActions(emergencyEngineRef.current.getActiveActions());

      // Update Active Kid State
      setKids((prevKids) =>
        prevKids.map((k) =>
          k.id === activeKid.id
            ? {
                ...k,
                currentLat: newLat,
                currentLng: newLng,
                currentSpeedKmh: speed,
                lastUpdatedTime: Date.now(),
                statusText: status.statusMessage,
              }
            : k
        )
      );

      // Add Location Breadcrumb Log
      const newLog: LocationLog = {
        id: Date.now(),
        kidId: activeKid.id,
        latitude: newLat,
        longitude: newLng,
        speedKmh: speed,
        timestamp: Date.now(),
        addressLabel: status.isInsideSafeZone ? status.matchedZone?.name || 'Safe Boundary' : 'Algiers, Algeria (Outside Zone)',
      };
      setLocationLogs((prev) => [newLog, ...prev.slice(0, 49)]);

      // Create Breach Alert if Exit Event Detected
      if (status.isExitEventDetected) {
        const breachAlert: AlertEvent = {
          id: Date.now(),
          kidId: activeKid.id,
          kidName: activeKid.name,
          alertType: 'BREACH_OUT',
          title: '🚨 Geofence Breach Out Alert!',
          message: `${activeKid.name} exited safe boundary zone! Risk Score: ${emergencyTick.riskScore}/100.`,
          timestamp: Date.now(),
          latitude: newLat,
          longitude: newLng,
          isRead: false,
        };
        setAlerts((prev) => [breachAlert, ...prev]);

        // Add to Event Timeline
        const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimelineEvents((prev) => [
          {
            id: `tl_${Date.now()}`,
            timeString: nowStr,
            timestampMs: Date.now(),
            title: `Exited Safe Zone: ${status.matchedZone?.name || 'Boundary'}`,
            subtitle: `Child crossed perimeter safe zone.`,
            category: 'SAFE_ZONE',
            locationName: status.matchedZone?.name || 'Outside Geofence',
            riskScore: emergencyTick.riskScore,
          },
          ...prev,
        ]);
      }
    }, 2500);

    return () => clearInterval(interval);
  }, [isSimulatingWalk, activeKid, geofences]);

  // Tamper Event Simulation Handler
  const handleSimulateTamper = (type: TamperType) => {
    if (!activeKid) return;

    // Trigger Tamper Event in Emergency Engine
    const emergencyTick = emergencyEngineRef.current.evaluate([{ type: 'TamperDetected', tamperType: type }]);
    setRiskScore(emergencyTick.riskScore);
    setActiveActions(emergencyEngineRef.current.getActiveActions());

    const tamperTitleMap: Record<TamperType, string> = {
      GPS_DISABLED: '🚫 GPS Location Disabled Tamper Alert',
      APP_KILLED: '🛑 App Kill / Anti-Removal Tamper Attempt',
      PERMISSION_REVOKED: '🔒 Location Permission Revoked Alert',
      AIRPLANE_MODE: '✈️ Airplane / Flight Mode Disconnect',
      LOCATION_SERVICE_STOPPED: '⚠️ Location Service Force Stopped',
    };

    const title = tamperTitleMap[type] || '⚠️ Device Tamper Detected';

    // Log High Risk Tamper Alert
    const tamperAlert: AlertEvent = {
      id: Date.now(),
      kidId: activeKid.id,
      kidName: activeKid.name,
      alertType: 'TAMPER_ALERT',
      title,
      message: `Tamper attempt detected on ${activeKid.name}'s device! Risk score elevated to ${emergencyTick.riskScore}/100. Automated hotline call & continuous live location stream triggered.`,
      timestamp: Date.now(),
      latitude: activeKid.currentLat,
      longitude: activeKid.currentLng,
      isRead: false,
    };
    setAlerts((prev) => [tamperAlert, ...prev]);

    // Append to Timeline
    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimelineEvents((prev) => [
      {
        id: `tl_tamper_${Date.now()}`,
        timeString: nowStr,
        timestampMs: Date.now(),
        title,
        subtitle: `Tamper attempt detected: ${type}. Continuous live GPS broadcast & audio recording initiated.`,
        category: 'TAMPER',
        locationName: 'Device Sensor Event',
        riskScore: emergencyTick.riskScore,
      },
      ...prev,
    ]);

    setActiveTab('radar');
  };

  const handleResetRisk = () => {
    audioSiren.stopSiren();
    emergencyEngineRef.current.resolveIncident();
    setRiskScore(0);
    setActiveActions([]);
  };

  // Handlers
  const handleToggleSimulateWalk = () => {
    setIsSimulatingWalk((prev) => !prev);
  };

  // Automatically sync with real device battery telemetry via BatteryService
  useEffect(() => {
    const cleanup = BatteryService.startMonitoring((level) => {
      setKids((prevKids) =>
        prevKids.map((k, idx) => (idx === 0 ? { ...k, batteryPercent: level } : k))
      );
    }, 20000);
    return cleanup;
  }, []);

  const handleTriggerSos = () => {
    if (!activeKid) return;
    const emergencyTick = emergencyEngineRef.current.evaluate([{ type: 'TamperDetected', tamperType: 'APP_KILLED' }]);
    setRiskScore(emergencyTick.riskScore);
    setActiveActions(emergencyEngineRef.current.getActiveActions());

    // Request native notifications permission on start
    NotificationService.requestPermission();
    audioSiren.startSiren();
    NotificationService.sendAlertNotification(
      AppStrings.getNotifSosTitle(currentLang),
      AppStrings.getNotifSosBody(currentLang, activeKid.name, parentAuth.parentPhone),
      'sos_emergency'
    );

    const sosAlert: AlertEvent = {
      id: Date.now(),
      kidId: activeKid.id,
      kidName: activeKid.name,
      alertType: 'SOS',
      title: '🆘 EMERGENCY PANIC SOS DISPATCHED!',
      message: `Emergency Panic Button pressed for ${activeKid.name}! Parent hotline ${parentAuth.parentPhone} notified. Live coordinates broadcasted.`,
      timestamp: Date.now(),
      latitude: activeKid.currentLat,
      longitude: activeKid.currentLng,
      isRead: false,
    };
    setAlerts((prev) => [sosAlert, ...prev]);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimelineEvents((prev) => [
      {
        id: `tl_sos_${Date.now()}`,
        timeString: nowStr,
        timestampMs: Date.now(),
        title: '🆘 EMERGENCY PANIC SOS DISPATCHED',
        subtitle: `Panic button pressed by child. High-priority alarm triggered.`,
        category: 'EMERGENCY',
        locationName: 'Panic Button Trigger',
        riskScore: 100,
      },
      ...prev,
    ]);

    setActiveTab('alerts');
  };

  const handleCheckIn = () => {
    if (!activeKid) return;
    audioSiren.playCheckInChime();
    const checkInAlert: AlertEvent = {
      id: Date.now(),
      kidId: activeKid.id,
      kidName: activeKid.name,
      alertType: 'BREACH_IN',
      title: '✅ Safety Check-In Received',
      message: `${activeKid.name} sent a manual check-in status from current coordinates.`,
      timestamp: Date.now(),
      latitude: activeKid.currentLat,
      longitude: activeKid.currentLng,
      isRead: false,
    };
    setAlerts((prev) => [checkInAlert, ...prev]);

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setTimelineEvents((prev) => [
      {
        id: `tl_checkin_${Date.now()}`,
        timeString: nowStr,
        timestampMs: Date.now(),
        title: '✅ Safety Check-In Confirmed',
        subtitle: `Manual check-in received from child device.`,
        category: 'CHECK_IN',
        locationName: 'Current Position',
        riskScore: riskScore,
      },
      ...prev,
    ]);
  };

  const handleToggleBatterySimulation = () => {
    if (!activeKid) return;
    const nextBattery = activeKid.batteryPercent <= 20 ? 95 : 15;
    setKids((prev) =>
      prev.map((k) => (k.id === activeKid.id ? { ...k, batteryPercent: nextBattery } : k))
    );

    if (nextBattery <= 20) {
      const batAlert: AlertEvent = {
        id: Date.now(),
        kidId: activeKid.id,
        kidName: activeKid.name,
        alertType: 'LOW_BATTERY',
        title: '🔋 Low Battery Warning (15%)',
        message: `${activeKid.name}'s tracking device battery is critically low (15%). Please charge immediately.`,
        timestamp: Date.now(),
        latitude: activeKid.currentLat,
        longitude: activeKid.currentLng,
        isRead: false,
      };
      setAlerts((prev) => [batAlert, ...prev]);

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setTimelineEvents((prev) => [
        {
          id: `tl_bat_${Date.now()}`,
          timeString: nowStr,
          timestampMs: Date.now(),
          title: '🔋 Critical Low Battery Warning (15%)',
          subtitle: `Device battery low alert dispatched to parent app.`,
          category: 'BATTERY',
          locationName: 'Device Battery Status',
          riskScore: riskScore,
        },
        ...prev,
      ]);
    }
  };

  const handleCallParent = () => {
    window.open(`tel:${parentAuth.parentPhone || '+2135550199'}`, '_self');
  };

  const handleSmsParent = () => {
    window.open(`sms:${parentAuth.parentPhone || '+2135550199'}?body=KidGuard%20Alert%20for%20${activeKid?.name}`, '_self');
  };

  const handleSaveGeofence = (zone: GeofenceZone) => {
    setGeofences((prev) => {
      const exists = prev.some((z) => z.id === zone.id);
      if (exists) {
        return prev.map((z) => (z.id === zone.id ? zone : z));
      } else {
        return [...prev, zone];
      }
    });
  };

  const handleToggleGeofence = (id: number) => {
    setGeofences((prev) =>
      prev.map((z) => (z.id === id ? { ...z, isEnabled: !z.isEnabled } : z))
    );
  };

  const handleDeleteGeofence = (id: number) => {
    setGeofences((prev) => prev.filter((z) => z.id !== id));
  };

  const handleDeleteKid = (id: number) => {
    setKids((prev) => prev.filter((k) => k.id !== id));
    // If the currently-selected kid was the one deleted, fall back to whichever
    // kid remains first so selectedKidId never keeps pointing at a deleted id.
    setSelectedKidId((prevSelected) => {
      if (prevSelected !== id) return prevSelected;
      const remaining = kids.filter((k) => k.id !== id);
      return remaining[0]?.id ?? prevSelected;
    });
  };

  const unreadAlertsCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Passcode Lock Overlay if App is Locked or Setup Required */}
      {authState.type !== 'Unlocked' ? (
        <PinLockScreen
          auth={parentAuth}
          authState={authState}
          currentLang={currentLang}
          onLanguageChange={setCurrentLang}
          onUnlockSuccess={() => setAuthState({ type: 'Unlocked' })}
          onSetupSuccess={(newAuth) => {
            setParentAuth(newAuth);
            setAuthState({ type: 'Unlocked' });
          }}
          onAuthUpdate={setParentAuth}
        />
      ) : (
        <>
          {/* Top Bar */}
          <Navbar
            currentLang={currentLang}
            kids={kids}
            selectedKid={activeKid}
            onSelectKid={(k) => setSelectedKidId(k.id)}
            unreadAlertsCount={unreadAlertsCount}
            onOpenAlerts={() => setActiveTab('alerts')}
            onLockApp={() => setAuthState({ type: 'Locked' })}
          />

          {/* Main Content Area */}
          <main className="flex-1 max-w-7xl w-full mx-auto">
            <ErrorBoundary>
              <Suspense fallback={<LoadingFallback />}>
                {activeTab === 'radar' && (
                  <DashboardScreen
                    kid={activeKid}
                    geofences={geofences}
                    parentAuth={parentAuth}
                    currentLang={currentLang}
                    isSimulatingWalk={isSimulatingWalk}
                    onToggleSimulateWalk={handleToggleSimulateWalk}
                    onTriggerSos={handleTriggerSos}
                    onCheckIn={handleCheckIn}
                    onCallParent={handleCallParent}
                    onSmsParent={handleSmsParent}
                    onUpdateParentPhone={(phone) => setParentAuth({ ...parentAuth, parentPhone: phone })}
                    onOpenGeofencePicker={() => setActiveTab('geofence')}
                    riskScore={riskScore}
                    activeActions={activeActions}
                    adaptiveSamplingText={getAdaptiveSamplingText()}
                    timelineEvents={timelineEvents}
                    isGpsActive={isGpsActive}
                    isAirplaneMode={isAirplaneMode}
                    isPermissionsGranted={isPermissionsGranted}
                    onSimulateTamper={handleSimulateTamper}
                    onToggleGps={() => {
                      setIsGpsActive((prev) => {
                        const next = !prev;
                        if (!next) handleSimulateTamper('GPS_DISABLED');
                        return next;
                      });
                    }}
                    onToggleAirplaneMode={() => {
                      setIsAirplaneMode((prev) => {
                        const next = !prev;
                        if (next) handleSimulateTamper('AIRPLANE_MODE');
                        return next;
                      });
                    }}
                    onTogglePermissions={() => {
                      setIsPermissionsGranted((prev) => {
                        const next = !prev;
                        if (!next) handleSimulateTamper('PERMISSION_REVOKED');
                        return next;
                      });
                    }}
                    onResetRisk={handleResetRisk}
                    onClearTimeline={() => setTimelineEvents([])}
                  />
                )}

                {activeTab === 'geofence' && (
                  <GeofenceScreen
                    geofences={geofences}
                    defaultLat={activeKid?.currentLat ?? FALLBACK_LAT}
                    defaultLng={activeKid?.currentLng ?? FALLBACK_LNG}
                    currentLang={currentLang}
                    onSaveGeofence={handleSaveGeofence}
                    onToggleGeofence={handleToggleGeofence}
                    onDeleteGeofence={handleDeleteGeofence}
                    kid={activeKid}
                  />
                )}

                {activeTab === 'history' && (
                  <HistoryScreen
                    logs={locationLogs}
                    currentLang={currentLang}
                    onClearLogs={() => setLocationLogs([])}
                  />
                )}

                {activeTab === 'alerts' && (
                  <AlertsScreen
                    alerts={alerts}
                    currentLang={currentLang}
                    onMarkAllRead={() => setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })))}
                    onDeleteAlert={(id) => setAlerts((prev) => prev.filter((a) => a.id !== id))}
                  />
                )}

                {activeTab === 'kids' && (
                  <KidsManagerScreen
                    kids={kids}
                    selectedKidId={selectedKidId}
                    currentLang={currentLang}
                    onSelectKid={setSelectedKidId}
                    onSaveKid={(kid) => {
                      setKids((prev) => {
                        const exists = prev.some((k) => k.id === kid.id);
                        return exists ? prev.map((k) => (k.id === kid.id ? kid : k)) : [...prev, kid];
                      });
                    }}
                    onDeleteKid={handleDeleteKid}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsScreen
                    auth={parentAuth}
                    currentLang={currentLang}
                    currentTheme={currentTheme}
                    onLanguageChange={setCurrentLang}
                    onThemeChange={setCurrentTheme}
                    onUpdateParentAuth={setParentAuth}
                    onLockApp={() => setAuthState({ type: 'Locked' })}
                  />
                )}
              </Suspense>
            </ErrorBoundary>
          </main>

          {/* Bottom Tab Bar */}
          <BottomNav
            activeTab={activeTab}
            onTabChange={setActiveTab}
            currentLang={currentLang}
            unreadAlertsCount={unreadAlertsCount}
          />
        </>
      )}
    </div>
  );
};

export default App;
