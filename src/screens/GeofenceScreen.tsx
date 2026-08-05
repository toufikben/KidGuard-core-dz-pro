import React, { useState, useRef } from 'react';
import { Shield, Plus, Edit2, Trash2, MapPin, Home, Trees, GraduationCap, Trophy, Target, Maximize2 } from 'lucide-react';
import { GeofenceZone, AppLanguageCode, KidProfile } from '../types';
import { AppStrings } from '../i18n/translations';
import { MapGeofencePickerModal } from '../components/MapGeofencePickerModal';
import { RadarMapCanvas } from '../components/RadarMapCanvas';

interface GeofenceScreenProps {
  geofences: GeofenceZone[];
  defaultLat: number;
  defaultLng: number;
  currentLang: AppLanguageCode;
  onSaveGeofence: (zone: GeofenceZone) => void;
  onToggleGeofence: (id: number) => void;
  onDeleteGeofence: (id: number) => void;
  kid?: KidProfile | null;
}

export const GeofenceScreen: React.FC<GeofenceScreenProps> = ({
  geofences,
  defaultLat,
  defaultLng,
  currentLang,
  onSaveGeofence,
  onToggleGeofence,
  onDeleteGeofence,
  kid,
}) => {
  const [showPickerModal, setShowPickerModal] = useState(false);
  const [editingZone, setEditingZone] = useState<GeofenceZone | null>(null);
  const [focusedZone, setFocusedZone] = useState<GeofenceZone | null>(null);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'home': return Home;
      case 'park': return Trees;
      case 'school': return GraduationCap;
      case 'sports': return Trophy;
      default: return MapPin;
    }
  };

  const handleFitToZone = (zone: GeofenceZone) => {
    setFocusedZone(zone);
    if (mapContainerRef.current) {
      mapContainerRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const handleDeleteZone = (zone: GeofenceZone) => {
    const confirmed = window.confirm(
      currentLang === 'ar'
        ? `هل تريد حذف المنطقة الآمنة "${zone.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
        : `Delete safe zone "${zone.name}"? This can't be undone.`
    );
    if (confirmed) {
      onDeleteGeofence(zone.id);
      if (focusedZone?.id === zone.id) setFocusedZone(null);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Screen Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <span>{AppStrings.getGeofenceTitle(currentLang)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Set safe geographic boundaries. Trigger instant alerts when child exits boundary.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {geofences.length > 0 && (
            <button
              onClick={() => {
                const firstEnabled = geofences.find((g) => g.isEnabled) || geofences[0];
                if (firstEnabled) handleFitToZone(firstEnabled);
              }}
              data-testid="fit_all_zones_header_button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all border border-slate-700"
              title="Fit map zoom to active safe boundary"
            >
              <Target className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">Fit Active Zone</span>
            </button>
          )}

          <button
            onClick={() => {
              setEditingZone(null);
              setShowPickerModal(true);
            }}
            data-testid="add_safe_zone_fab"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Safe Zone</span>
          </button>
        </div>
      </div>

      {/* Interactive Geofence Map View */}
      <div ref={mapContainerRef} className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-1">
          <span>Safe Boundary Map Overview</span>
          {focusedZone && (
            <span className="text-emerald-400 text-[11px] font-bold flex items-center gap-1">
              <Target className="w-3 h-3 animate-pulse" />
              Focused: {focusedZone.name} ({Math.round(focusedZone.radiusMeters)}m)
            </span>
          )}
        </div>
        <RadarMapCanvas
          kid={kid || null}
          geofences={geofences}
          currentLang={currentLang}
          focusedZone={focusedZone}
          onFitToZone={(zone) => setFocusedZone(zone)}
          onGeofenceClick={(zone) => handleFitToZone(zone)}
        />
      </div>

      {/* Geofence Cards List */}
      {geofences.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400 mx-auto">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">{AppStrings.getNoGeofences(currentLang)}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {AppStrings.getAddZoneHint(currentLang)}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {geofences.map((zone) => {
            const IconComp = getIcon(zone.iconName);
            const isFocused = focusedZone?.id === zone.id;

            return (
              <div
                key={zone.id}
                className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                  isFocused
                    ? 'bg-slate-900 border-emerald-500/80 ring-1 ring-emerald-500/30'
                    : zone.isEnabled
                    ? 'bg-slate-900 border-slate-800 text-slate-100'
                    : 'bg-slate-900/50 border-slate-800/60 opacity-60 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0"
                    style={{ backgroundColor: `${zone.colorHex || '#10b981'}25`, color: zone.colorHex || '#10b981' }}
                  >
                    <IconComp className="w-5 h-5 shrink-0" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-xs font-bold text-white truncate">{zone.name}</h3>
                      {isFocused && (
                        <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 shrink-0 whitespace-nowrap">
                          Map Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {AppStrings.getSafeRadius(currentLang, Math.round(zone.radiusMeters))} • GPS ({zone.latitude.toFixed(4)}, {zone.longitude.toFixed(4)})
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                  {/* Fit to Zone Action Button */}
                  <button
                    onClick={() => handleFitToZone(zone)}
                    data-testid={`fit_to_zone_card_${zone.id}`}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
                      isFocused
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 border border-slate-700'
                    }`}
                    title="Center and adjust map zoom level to fit this safe boundary"
                  >
                    <Target className="w-3.5 h-3.5 shrink-0" />
                    <span>Fit to Zone</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Enable/Disable Toggle Switch */}
                    <button
                      onClick={() => onToggleGeofence(zone.id)}
                      className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center shrink-0 ${
                        zone.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-slate-700 justify-start'
                      }`}
                      title={zone.isEnabled ? 'Disable Safe Zone' : 'Enable Safe Zone'}
                    >
                      <div className="w-4 h-4 rounded-full bg-white shadow-md" />
                    </button>

                    <button
                      onClick={() => {
                        setEditingZone(zone);
                        setShowPickerModal(true);
                      }}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                      title="Edit Zone on Map"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteZone(zone)}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                      title="Delete Zone"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Map Geofence Picker Modal */}
      {showPickerModal && (
        <MapGeofencePickerModal
          initialZone={editingZone}
          defaultLat={defaultLat}
          defaultLng={defaultLng}
          currentLang={currentLang}
          onDismiss={() => {
            setShowPickerModal(false);
            setEditingZone(null);
          }}
          onSaveGeofence={(zone) => {
            onSaveGeofence(zone);
            setShowPickerModal(false);
            setEditingZone(null);
          }}
        />
      )}
    </div>
  );
};
