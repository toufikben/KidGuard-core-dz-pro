import React, { useState } from 'react';
import { Clock, MapPin, ShieldAlert, AlertTriangle, CheckCircle2, Car, Mic, Battery, Search, Filter } from 'lucide-react';
import { AppLanguageCode } from '../types';

export interface TimelineEventItem {
  id: string;
  timeString: string;
  timestampMs: number;
  title: string;
  subtitle: string;
  category: 'SAFE_ZONE' | 'EMERGENCY' | 'TAMPER' | 'VEHICLE' | 'AUDIO' | 'BATTERY' | 'CHECK_IN';
  locationName?: string;
  riskScore?: number;
}

interface EventTimelineWidgetProps {
  events: TimelineEventItem[];
  currentLang: AppLanguageCode;
  onClearTimeline?: () => void;
}

export const EventTimelineWidget: React.FC<EventTimelineWidgetProps> = ({
  events,
  currentLang,
  onClearTimeline,
}) => {
  const isAr = currentLang === 'ar';
  const [filterCategory, setFilterCategory] = useState<'ALL' | 'SAFE_ZONE' | 'EMERGENCY' | 'TAMPER'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEvents = events.filter((e) => {
    if (filterCategory === 'SAFE_ZONE' && e.category !== 'SAFE_ZONE') return false;
    if (filterCategory === 'EMERGENCY' && e.category !== 'EMERGENCY' && e.category !== 'AUDIO') return false;
    if (filterCategory === 'TAMPER' && e.category !== 'TAMPER') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return e.title.toLowerCase().includes(q) || e.subtitle.toLowerCase().includes(q);
    }
    return true;
  });

  const getCategoryIcon = (category: TimelineEventItem['category']) => {
    switch (category) {
      case 'SAFE_ZONE':
        return <MapPin className="w-4 h-4 text-emerald-400" />;
      case 'EMERGENCY':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'TAMPER':
        return <ShieldAlert className="w-4 h-4 text-amber-400" />;
      case 'VEHICLE':
        return <Car className="w-4 h-4 text-blue-400" />;
      case 'AUDIO':
        return <Mic className="w-4 h-4 text-purple-400 animate-pulse" />;
      case 'BATTERY':
        return <Battery className="w-4 h-4 text-yellow-400" />;
      case 'CHECK_IN':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getCategoryBadgeClass = (category: TimelineEventItem['category']) => {
    switch (category) {
      case 'SAFE_ZONE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'EMERGENCY':
        return 'bg-red-500/20 text-red-300 border-red-500/30';
      case 'TAMPER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'VEHICLE':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      case 'AUDIO':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
              <span>{isAr ? 'سجل زمني كامل للأحداث' : 'Full Event Timeline Log'}</span>
            </h3>
            <p className="text-xs text-slate-400">
              {isAr
                ? 'تتبع الأحداث بالتفصيل الزمني: الدخول للخروج، السرعة، وتسجيل الصوت'
                : 'Chronological timeline of boundary breaches, movement transitions & risk triggers.'}
            </p>
          </div>
        </div>

        {onClearTimeline && events.length > 0 && (
          <button
            onClick={onClearTimeline}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800 hover:bg-slate-700"
          >
            {isAr ? 'مسح السجل' : 'Clear'}
          </button>
        )}
      </div>

      {/* Search & Category Filter Pills */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'البحث في الأحداث...' : 'Search events timeline...'}
            className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {(['ALL', 'SAFE_ZONE', 'EMERGENCY', 'TAMPER'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-colors shrink-0 ${
                filterCategory === cat
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {cat === 'ALL' && (isAr ? 'الكل' : 'All Events')}
              {cat === 'SAFE_ZONE' && (isAr ? 'المناطق' : 'Zones')}
              {cat === 'EMERGENCY' && (isAr ? 'الطوارئ' : 'Emergency')}
              {cat === 'TAMPER' && (isAr ? 'العبث' : 'Tamper')}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline List View */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center text-slate-500 text-xs">
          {isAr ? 'لا توجد أحداث في السجل الزمني' : 'No recorded timeline events match your criteria.'}
        </div>
      ) : (
        <div className="relative pl-4 border-l-2 border-slate-800 space-y-4 my-2 max-h-80 overflow-y-auto pr-2 scrollbar-thin">
          {filteredEvents.map((evt) => (
            <div key={evt.id} className="relative group">
              {/* Timeline Bullet Node */}
              <div className="absolute -left-[23px] top-1.5 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-blue-500 flex items-center justify-center group-hover:scale-125 transition-transform" />

              <div className="bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 p-3 rounded-2xl space-y-1 transition-all">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-slate-900 border border-slate-800">
                      {getCategoryIcon(evt.category)}
                    </div>
                    <span className="text-xs font-bold text-white">{evt.title}</span>
                  </div>

                  <span className="text-[10px] font-mono font-semibold text-slate-400 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {evt.timeString}
                  </span>
                </div>

                <p className="text-xs text-slate-300 pl-7">{evt.subtitle}</p>

                <div className="flex items-center justify-between pl-7 pt-1 text-[10px]">
                  {evt.locationName && (
                    <span className="text-slate-400 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      {evt.locationName}
                    </span>
                  )}

                  {evt.riskScore !== undefined && (
                    <span className={`font-bold px-1.5 py-0.5 rounded border ${getCategoryBadgeClass(evt.category)}`}>
                      Risk Score: {evt.riskScore}/100
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
