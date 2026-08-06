import React, { useState } from 'react';
import { ShieldAlert, Battery, Gauge, Compass, Phone, MessageSquare, AlertTriangle, CheckCircle2, UserCheck, Edit2, Play, Square } from 'lucide-react';
import { KidProfile, GeofenceZone, AppLanguageCode, ParentAuth, RiskAction, TamperType } from '../types';
import { AppStrings, getKidAvatarEmoji } from '../i18n/translations';
import { RadarMapCanvas } from '../components/RadarMapCanvas';
import { RiskEngineGauge } from '../components/RiskEngineGauge';
import { TamperControlPanel } from '../components/TamperControlPanel';
import { EventTimelineWidget, TimelineEventItem } from '../components/EventTimelineWidget';
import { AudioRecorderWidget } from '../components/AudioRecorderWidget';
import { SmartwatchCompanionWidget } from '../components/SmartwatchCompanionWidget';

interface DashboardScreenProps {
  kid: KidProfile | null;
  geofences: GeofenceZone[];
  parentAuth: ParentAuth;
  currentLang: AppLanguageCode;
  isSimulatingWalk: boolean;
  onToggleSimulateWalk: () => void;
  onTriggerSos: () => void;
  onCheckIn: () => void;
  onCallParent: () => void;
  onSmsParent: () => void;
  onUpdateParentPhone: (phone: string) => void;
  onOpenGeofencePicker: () => void;
  // Next Steps Props
  riskScore: number;
  activeActions: RiskAction[];
  adaptiveSamplingText: string;
  timelineEvents: TimelineEventItem[];
  isGpsActive: boolean;
  isAirplaneMode: boolean;
  isPermissionsGranted: boolean;
  onSimulateTamper: (type: TamperType) => void;
  onToggleGps: () => void;
  onToggleAirplaneMode: () => void;
  onTogglePermissions: () => void;
  onResetRisk: () => void;
  onClearTimeline?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  kid,
  geofences,
  parentAuth,
  currentLang,
  isSimulatingWalk,
  onToggleSimulateWalk,
  onTriggerSos,
  onCheckIn,
  onCallParent,
  onSmsParent,
  onUpdateParentPhone,
  onOpenGeofencePicker,
  riskScore,
  activeActions,
  adaptiveSamplingText,
  timelineEvents,
  isGpsActive,
  isAirplaneMode,
  isPermissionsGranted,
  onSimulateTamper,
  onToggleGps,
  onToggleAirplaneMode,
  onTogglePermissions,
  onResetRisk,
  onClearTimeline,
}) => {
  const [showSosDialog, setShowSosDialog] = useState(false);
  const [showEditPhoneModal, setShowEditPhoneModal] = useState(false);
  const [newParentPhone, setNewParentPhone] = useState(parentAuth.parentPhone);

  if (!kid) {
    return (
      <div className="p-8 text-center text-slate-400">
        No child profiles selected. Please select or add a child profile.
      </div>
    );
  }

  const isOutside = kid.statusText.includes('Outside') || kid.statusText.includes('Breach');
  const isAudioAutoTriggered = activeActions.includes('START_AUDIO_RECORDING') || riskScore >= 70;

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Top Status Banner Card */}
      <div
        className={`relative z-10 overflow-hidden p-4 rounded-3xl border shadow-xl transition-all ${
          isOutside || riskScore >= 70
            ? 'bg-red-950/40 border-red-800/80 text-red-100'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-md border ${
                isOutside || riskScore >= 70 ? 'bg-red-600/30 border-red-500' : 'bg-blue-600/20 border-blue-500/40'
              }`}
            >
              {getKidAvatarEmoji(kid.avatarPreset, kid.name)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">{kid.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isOutside || riskScore >= 70
                      ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                  }`}
                >
                  {isOutside ? AppStrings.getOutsideGeofence(currentLang) : kid.statusText}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {AppStrings.getMonitoringStatus(currentLang)}
              </p>
            </div>
          </div>

          {/* Live Child Battery Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-colors ${
              kid.batteryPercent <= 20
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse'
                : 'bg-slate-800 text-slate-300 border-slate-700'
            }`}
          >
            <Battery className="w-4 h-4" />
            <span>{kid.batteryPercent}%</span>
          </div>
        </div>

        {/* Status Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-800/80">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <Gauge className="w-3 h-3 text-blue-400" />
              <span>{AppStrings.getSpeedLabel(currentLang)}</span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {kid.currentSpeedKmh.toFixed(1)} km/h
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <Compass className="w-3 h-3 text-emerald-400" />
              <span>{AppStrings.getModeLabel(currentLang)}</span>
            </div>
            <div className="text-xs font-bold text-white mt-0.5 truncate">
              {isSimulatingWalk ? AppStrings.getOutdoorSim(currentLang) : AppStrings.getLiveGps(currentLang)}
            </div>
          </div>

          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-center">
            <div className="text-[10px] text-slate-400 font-medium flex items-center justify-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-400" />
              <span>{AppStrings.getAccuracyLabel(currentLang)}</span>
            </div>
            <div className="text-sm font-bold text-emerald-400 mt-0.5">High (±3m)</div>
          </div>
        </div>

        {/* Quick Action Buttons for Calling & SMS */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={onCallParent}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors shadow-md"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{AppStrings.getCallParentBtnText(currentLang)}</span>
          </button>
          <button
            onClick={onSmsParent}
            className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{AppStrings.getSendSmsBtnText(currentLang)}</span>
          </button>
        </div>
      </div>

      {/* Risk Engine Gauge Component */}
      <RiskEngineGauge
        score={riskScore}
        activeActions={activeActions}
        adaptiveSamplingText={adaptiveSamplingText}
        currentLang={currentLang}
        onResetRisk={onResetRisk}
      />

      {/* Simulated Walk Controls Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isSimulatingWalk ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            {isSimulatingWalk ? <Square className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </div>
          <div>
            <div className="text-xs font-bold text-white">
              {AppStrings.getSimulateWalkToggle(currentLang)}
            </div>
            <div className="text-[11px] text-slate-400">
              {isSimulatingWalk ? 'Child moving along simulated route...' : 'Simulate movement outside safe zone boundary'}
            </div>
          </div>
        </div>

        <button
          onClick={onToggleSimulateWalk}
          data-testid="simulate_walk_switch"
          className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${
            isSimulatingWalk
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-transparent'
          }`}
        >
          {isSimulatingWalk ? 'Stop Sim' : 'Start Walk'}
        </button>
      </div>

      {/* Tamper Control Panel */}
      <TamperControlPanel
        currentLang={currentLang}
        onSimulateTamper={onSimulateTamper}
        isGpsActive={isGpsActive}
        isAirplaneMode={isAirplaneMode}
        isPermissionsGranted={isPermissionsGranted}
        onToggleGps={onToggleGps}
        onToggleAirplaneMode={onToggleAirplaneMode}
        onTogglePermissions={onTogglePermissions}
      />

      {/* Smartwatch Companion wrist UI widget */}
      <SmartwatchCompanionWidget
        currentLang={currentLang}
        onTriggerSosFromWatch={onTriggerSos}
        kidName={kid.name}
        batteryPercent={kid.batteryPercent}
      />

      {/* Radar & Map Container */}
      <RadarMapCanvas
        kid={kid}
        geofences={geofences}
        currentLang={currentLang}
        onGeofenceClick={() => onOpenGeofencePicker()}
      />

      {/* Emergency Audio Recorder Monitor */}
      <AudioRecorderWidget
        isAutoTriggered={isAudioAutoTriggered}
        currentLang={currentLang}
      />

      {/* Emergency Action Buttons: Panic SOS & Check-In */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => setShowSosDialog(true)}
          data-testid="panic_sos_button"
          className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-sm shadow-xl shadow-red-600/30 transition-all active:scale-98"
        >
          <AlertTriangle className="w-5 h-5 animate-pulse" />
          <span>{AppStrings.getPanicSos(currentLang)}</span>
        </button>

        <button
          onClick={onCheckIn}
          data-testid="check_in_button"
          className="flex items-center justify-center gap-2.5 py-4 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 transition-all active:scale-98"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{AppStrings.getCheckIn(currentLang)}</span>
        </button>
      </div>

      {/* Full Event Timeline Log Component */}
      <EventTimelineWidget
        events={timelineEvents}
        currentLang={currentLang}
        onClearTimeline={onClearTimeline}
      />

      {/* Parent Hotline Contact Card */}
      <div
        data-testid="emergency_contact_card"
        className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>{AppStrings.getEmergencyHotline(currentLang)}</span>
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {parentAuth.parentPhone || '+213 555 0199'}
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowEditPhoneModal(true)}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          title="Edit Parent Phone Number"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      </div>

      {/* PANIC SOS DIALOG */}
      {showSosDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-red-800/80 rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-full bg-red-600/20 border-2 border-red-500 flex items-center justify-center text-red-500 mx-auto animate-ping">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white">Trigger Emergency Panic SOS?</h3>
            <p className="text-xs text-slate-300">
              This will immediately trigger loud siren alarms, log a high-priority alert, send live GPS map coordinates to parent phone{' '}
              <span className="font-mono text-red-400 font-bold">{parentAuth.parentPhone}</span>, and initiate immediate emergency call.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowSosDialog(false)}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowSosDialog(false);
                  onTriggerSos();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-red-600/50"
              >
                DISPATCH SOS ALARM
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PARENT PHONE MODAL */}
      {showEditPhoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">
              {AppStrings.getEditParentPhoneTitle(currentLang)}
            </h3>
            <p className="text-xs text-slate-400">
              Enter the primary phone number to receive emergency calls and SMS notifications.
            </p>

            <input
              type="text"
              value={newParentPhone}
              onChange={(e) => setNewParentPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              placeholder="+213 555 0199"
            />

            <div className="flex gap-2">
              <button
                onClick={() => setShowEditPhoneModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (newParentPhone.trim()) {
                    onUpdateParentPhone(newParentPhone.trim());
                    setShowEditPhoneModal(false);
                  }
                }}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Save Phone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

