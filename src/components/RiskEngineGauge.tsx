import React from 'react';
import { ShieldAlert, Phone, MessageSquare, Bell, Eye, Radio, Mic } from 'lucide-react';
import { RiskAction, AppLanguageCode } from '../types';

interface RiskEngineGaugeProps {
  score: number; // 0 to 100
  activeActions: RiskAction[];
  adaptiveSamplingText: string;
  currentLang: AppLanguageCode;
  onResetRisk?: () => void;
}

export const RiskEngineGauge: React.FC<RiskEngineGaugeProps> = ({
  score,
  activeActions,
  adaptiveSamplingText,
  currentLang,
  onResetRisk,
}) => {
  const isAr = currentLang === 'ar';

  // Determine Risk Level Theme
  const getRiskLevelDetails = () => {
    if (score < 15) {
      return {
        levelLabel: isAr ? 'مستوى آمن (منخفض)' : 'Safe (Low Risk)',
        colorClass: 'text-emerald-400',
        bgClass: 'bg-emerald-500/10 border-emerald-500/30',
        barColor: 'bg-emerald-500',
        badge: 'NORMAL',
      };
    } else if (score < 40) {
      return {
        levelLabel: isAr ? 'مراقبة عن قرب (متوسط)' : 'Guarded (Moderate)',
        colorClass: 'text-yellow-400',
        bgClass: 'bg-yellow-500/10 border-yellow-500/30',
        barColor: 'bg-yellow-500',
        badge: 'GUARDED',
      };
    } else if (score < 70) {
      return {
        levelLabel: isAr ? 'مستوى مرتفع (تنبيه)' : 'Elevated Alert',
        colorClass: 'text-orange-400',
        bgClass: 'bg-orange-500/10 border-orange-500/30',
        barColor: 'bg-orange-500',
        badge: 'ELEVATED',
      };
    } else {
      return {
        levelLabel: isAr ? 'حالة طوارئ قصوى (خطر عالي)' : 'CRITICAL HIGH RISK',
        colorClass: 'text-red-400',
        bgClass: 'bg-red-950/60 border-red-500/60 shadow-red-900/40 animate-pulse',
        barColor: 'bg-red-600',
        badge: 'CRITICAL',
      };
    }
  };

  const riskDetails = getRiskLevelDetails();

  const actionMap: { action: RiskAction; labelEn: string; labelAr: string; icon: React.ReactNode }[] = [
    { action: 'BEGIN_CLOSE_MONITORING', labelEn: 'Close Monitoring', labelAr: 'مراقبة دقيقة', icon: <Eye className="w-3.5 h-3.5 text-yellow-400" /> },
    { action: 'NOTIFY_PARENT', labelEn: 'Push Notification', labelAr: 'إشعار فوري', icon: <Bell className="w-3.5 h-3.5 text-blue-400" /> },
    { action: 'SMS_PARENT', labelEn: 'SMS Alert Sent', labelAr: 'رسالة نصية SMS', icon: <MessageSquare className="w-3.5 h-3.5 text-orange-400" /> },
    { action: 'CALL_PARENT', labelEn: 'Emergency Call', labelAr: 'اتصال طوارئ تلقائي', icon: <Phone className="w-3.5 h-3.5 text-red-400" /> },
    { action: 'START_CONTINUOUS_LOCATION', labelEn: 'Continuous Live GPS (5s)', labelAr: 'تتبع مباشر مكثف', icon: <Radio className="w-3.5 h-3.5 text-emerald-400" /> },
    { action: 'START_AUDIO_RECORDING', labelEn: 'Ambient Mic Audio Record', labelAr: 'بدء تسجيل الصوت المحيط', icon: <Mic className="w-3.5 h-3.5 text-purple-400" /> },
  ];

  return (
    <div className={`p-4 rounded-2xl border shadow-lg transition-all ${riskDetails.bgClass}`}>
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${riskDetails.colorClass}`} />
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              {isAr ? 'محرك تقييم المخاطر الذكي' : 'Smart Risk Assessment Engine'}
            </h3>
            <p className="text-[11px] text-slate-400">
              {isAr ? 'حساب مستوى الخطر والتفاعل الفوري' : 'Automated AI Risk Scoring & Tiered Response'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${riskDetails.colorClass} border-current`}>
            {riskDetails.badge}
          </span>
          {score > 0 && onResetRisk && (
            <button
              onClick={onResetRisk}
              className="text-[10px] text-slate-400 hover:text-white underline font-semibold"
            >
              {isAr ? 'إعادة ضبط' : 'Reset Score'}
            </button>
          )}
        </div>
      </div>

      {/* Progress Score Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className={riskDetails.colorClass}>{riskDetails.levelLabel}</span>
          <span className="font-mono text-white text-sm">{score} / 100</span>
        </div>

        <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800 p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-500 ${riskDetails.barColor}`}
            style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
          />
        </div>
      </div>

      {/* Adaptive Sampling Rate Note */}
      <div className="mt-3 flex items-center justify-between bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 text-[11px]">
        <span className="text-slate-400">
          {isAr ? 'معدل تحديث الموقع الذكي:' : 'Adaptive GPS Interval:'}
        </span>
        <span className="font-mono font-bold text-emerald-400 flex items-center gap-1">
          <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
          {adaptiveSamplingText}
        </span>
      </div>

      {/* Triggered Tiered Actions List */}
      <div className="mt-3 pt-3 border-t border-slate-800/80">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
          {isAr ? 'الإجراءات الأوتوماتيكية النشطة:' : 'Active Automated Responses:'}
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {actionMap.map((item) => {
            const isActive = activeActions.includes(item.action);
            return (
              <div
                key={item.action}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] border transition-all ${
                  isActive
                    ? 'bg-slate-800 border-slate-700 text-slate-100 font-bold shadow-sm'
                    : 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60'
                }`}
              >
                {item.icon}
                <span className="truncate">{isAr ? item.labelAr : item.labelEn}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
