import React from 'react';
import { Route, MapPin, Clock, Gauge, Navigation } from 'lucide-react';
import { LocationLog, AppLanguageCode } from '../types';
import { AppStrings } from '../i18n/translations';

interface HistoryScreenProps {
  logs: LocationLog[];
  currentLang: AppLanguageCode;
  onClearLogs?: () => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  logs,
  currentLang,
  onClearLogs,
}) => {
  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Route className="w-5 h-5 text-blue-400" />
            <span>{AppStrings.getNavHistory(currentLang)} - Location Breadcrumbs</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Chronological GPS location history and speed logs.
          </p>
        </div>

        {logs.length > 0 && onClearLogs && (
          <button
            onClick={onClearLogs}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Clear Log History
          </button>
        )}
      </div>

      {logs.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Navigation className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Location History Captured</h3>
          <p className="text-xs text-slate-400">
            Location breadcrumb updates will automatically record here during active tracking or walk simulation.
          </p>
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-3 space-y-4 py-1">
          {logs.map((log) => {
            const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            const dateStr = new Date(log.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

            return (
              <div key={log.id} className="relative pl-6">
                {/* Timeline Dot */}
                <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-blue-600 border-2 border-slate-900 shadow-sm" />

                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 space-y-2 shadow-md">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-400" />
                      <span>{log.addressLabel || 'San Francisco, CA'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{dateStr}, {timeStr}</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-300">
                      GPS: {log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                      <Gauge className="w-3 h-3" />
                      <span>{log.speedKmh.toFixed(1)} km/h</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
