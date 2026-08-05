import React from 'react';
import { ShieldX, Navigation, Plane, Lock, AlertOctagon } from 'lucide-react';
import { TamperType, AppLanguageCode } from '../types';

interface TamperControlPanelProps {
  currentLang: AppLanguageCode;
  onSimulateTamper: (type: TamperType) => void;
  isGpsActive: boolean;
  isAirplaneMode: boolean;
  isPermissionsGranted: boolean;
  onToggleGps: () => void;
  onToggleAirplaneMode: () => void;
  onTogglePermissions: () => void;
}

export const TamperControlPanel: React.FC<TamperControlPanelProps> = ({
  currentLang,
  onSimulateTamper,
  isGpsActive,
  isAirplaneMode,
  isPermissionsGranted,
  onToggleGps,
  onToggleAirplaneMode,
  onTogglePermissions,
}) => {
  const isAr = currentLang === 'ar';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3">
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-red-500/20 text-red-400 border border-red-500/30">
            <ShieldX className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {isAr ? 'اكتشاف وتنبيهات العبث بالجهاز' : 'Tamper Detection & Anti-Disable System'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'تنبيه فوري عند محاولة إيقاف التطبيق أو تعطيل GPS أو وضع الطيران'
                : 'Real-time alert when child attempts to close app, turn off GPS, or enable Airplane mode.'}
            </p>
          </div>
        </div>
      </div>

      {/*
        NOTE: onToggleGps / onToggleAirplaneMode / onTogglePermissions already raise the
        matching TamperDetected event themselves (see App.tsx) when the toggle crosses into
        the "tampered" state. Do NOT also call onSimulateTamper here - doing both was firing
        two tamper alerts (and double risk-score increments) per single button press.
      */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* Toggle GPS */}
        <button
          onClick={onToggleGps}
          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
            isGpsActive
              ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
              : 'bg-red-950/60 border-red-500/60 text-red-200 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <Navigation className={`w-4 h-4 ${isGpsActive ? 'text-emerald-400' : 'text-red-400'}`} />
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                isGpsActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/30 text-red-300'
              }`}
            >
              {isGpsActive ? 'ON' : 'OFF'}
            </span>
          </div>
          <div className="text-[11px] font-bold text-white">GPS Signal</div>
          <div className="text-[9px] text-slate-400">
            {isGpsActive ? (isAr ? 'مستقر' : 'Active') : isAr ? 'معطل (عبث!)' : 'Disabled (Tamper)'}
          </div>
        </button>

        {/* Toggle Airplane Mode */}
        <button
          onClick={onToggleAirplaneMode}
          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
            !isAirplaneMode
              ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
              : 'bg-amber-950/60 border-amber-500/60 text-amber-200 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <Plane className={`w-4 h-4 ${!isAirplaneMode ? 'text-slate-400' : 'text-amber-400'}`} />
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                !isAirplaneMode ? 'bg-slate-800 text-slate-400' : 'bg-amber-500/30 text-amber-300'
              }`}
            >
              {isAirplaneMode ? 'PLANE' : 'NORMAL'}
            </span>
          </div>
          <div className="text-[11px] font-bold text-white">Flight Mode</div>
          <div className="text-[9px] text-slate-400">
            {!isAirplaneMode ? (isAr ? 'معطل' : 'Normal') : isAr ? 'طيران (انقطاع)' : 'Airplane Mode'}
          </div>
        </button>

        {/* Toggle Permissions */}
        <button
          onClick={onTogglePermissions}
          className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
            isPermissionsGranted
              ? 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
              : 'bg-red-950/60 border-red-500/60 text-red-200 animate-pulse'
          }`}
        >
          <div className="flex items-center justify-between w-full mb-1">
            <Lock className={`w-4 h-4 ${isPermissionsGranted ? 'text-blue-400' : 'text-red-400'}`} />
            <span
              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                isPermissionsGranted ? 'bg-blue-500/20 text-blue-400' : 'bg-red-500/30 text-red-300'
              }`}
            >
              {isPermissionsGranted ? 'GRANTED' : 'REVOKED'}
            </span>
          </div>
          <div className="text-[11px] font-bold text-white">Permissions</div>
          <div className="text-[9px] text-slate-400">
            {isPermissionsGranted ? (isAr ? 'ممنوحة' : 'Granted') : isAr ? 'ملغاة (تنبيه)' : 'Revoked'}
          </div>
        </button>

        {/* Trigger Direct App Kill / Tamper Simulation */}
        <button
          onClick={() => onSimulateTamper('APP_KILLED')}
          className="p-2.5 rounded-xl border border-red-800/80 bg-red-950/40 hover:bg-red-900/50 text-red-100 transition-all text-left flex flex-col justify-between"
        >
          <div className="flex items-center justify-between w-full mb-1">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-red-600 text-white">
              TEST
            </span>
          </div>
          <div className="text-[11px] font-bold text-white">Simulate Kill</div>
          <div className="text-[9px] text-red-300">
            {isAr ? 'حرب تجريبية لتثبيت الخطر' : 'Force High Risk Trigger'}
          </div>
        </button>
      </div>
    </div>
  );
};
