import React, { useState, useEffect } from 'react';
import { Watch, Heart, ShieldAlert, Battery, Radio, Bell } from 'lucide-react';
import { AppLanguageCode } from '../types';

interface SmartwatchCompanionWidgetProps {
  currentLang: AppLanguageCode;
  onTriggerSosFromWatch: () => void;
  kidName: string;
  batteryPercent: number;
}

export const SmartwatchCompanionWidget: React.FC<SmartwatchCompanionWidgetProps> = ({
  currentLang,
  onTriggerSosFromWatch,
  kidName,
  batteryPercent,
}) => {
  const isAr = currentLang === 'ar';
  const [bpm, setBpm] = useState(82);
  const [sosSent, setSosSent] = useState(false);

  // Simulate slight Heart Rate variation
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(Math.floor(75 + Math.random() * 18));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSosPress = () => {
    setSosSent(true);
    onTriggerSosFromWatch();
    setTimeout(() => setSosSent(false), 4000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
            <Watch className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {isAr ? 'معاينة ساعات الأطفال الذكية (Watch UI)' : 'KidGuard Smartwatch Wrist UI Mode'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr
                ? 'محاكاة واجهة الساعة الذكية المزودة بزر طوارئ ومستشعر النبض'
                : 'Interactive child wristband simulator with 1-tap Emergency SOS & Bio-sensors.'}
            </p>
          </div>
        </div>

        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
          WEAR OS / WATCH
        </span>
      </div>

      {/* Circular Smartwatch Display Frame */}
      <div className="flex items-center justify-center py-2">
        <div className="relative w-52 h-52 rounded-full bg-black border-4 border-slate-700 shadow-2xl p-4 flex flex-col items-center justify-between text-center overflow-hidden">
          {/* Top Status Indicators */}
          <div className="flex items-center justify-between w-full text-[10px] text-slate-400 px-2 pt-1 font-mono">
            <span className="flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
              GPS
            </span>
            <span className="flex items-center gap-1">
              <Battery className="w-3 h-3 text-yellow-400" />
              {batteryPercent}%
            </span>
          </div>

          {/* Center Info: Kid Name & Heart Rate */}
          <div className="space-y-1">
            <div className="text-xs font-black text-white uppercase tracking-wide truncate max-w-[120px]">
              {kidName}
            </div>

            <div className="flex items-center justify-center gap-1 text-red-400 text-xs font-bold font-mono">
              <Heart className="w-3.5 h-3.5 fill-current animate-ping" />
              <span>{bpm} BPM</span>
            </div>
          </div>

          {/* 1-Tap SOS Button on Watch */}
          <button
            onClick={handleSosPress}
            className={`w-28 py-2 rounded-full text-xs font-extrabold transition-all border shadow-lg ${
              sosSent
                ? 'bg-emerald-600 border-emerald-400 text-white animate-bounce'
                : 'bg-red-600 hover:bg-red-500 border-red-400 text-white shadow-red-600/50'
            }`}
          >
            {sosSent ? (isAr ? 'تم الإرسال!' : 'SOS SENT!') : (isAr ? 'طوارئ SOS' : 'TAP SOS')}
          </button>

          {/* Bottom Time Label */}
          <div className="text-[9px] font-mono text-slate-500 pb-1">
            KidGuard OS v2.4
          </div>
        </div>
      </div>
    </div>
  );
};
