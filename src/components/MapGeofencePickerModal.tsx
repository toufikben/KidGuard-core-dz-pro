import React, { useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect } from 'react';
import { Map, X, CheckCircle, Navigation, Home, Trees, GraduationCap, Trophy, Target } from 'lucide-react';
import { GeofenceZone, AppLanguageCode } from '../types';
import { AppStrings } from '../i18n/translations';
import { RadiusSelectorControl } from './RadiusSelectorControl';

interface MapGeofencePickerModalProps {
  initialZone?: GeofenceZone | null;
  defaultLat: number;
  defaultLng: number;
  currentLang: AppLanguageCode;
  onDismiss: () => void;
  onSaveGeofence: (zone: GeofenceZone) => void;
}

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

// Re-centers the map imperatively when the center is changed from outside a
// click (e.g. the "Reset Center to GPS" button), without fighting user drag/zoom.
const MapRecenter: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

// Captures a click anywhere on the map and reports the lat/lng that was tapped.
const ClickToSetCenter: React.FC<{ onPick: (lat: number, lng: number) => void }> = ({ onPick }) => {
  useMapEvents({
    click: (e) => onPick(e.latlng.lat, e.latlng.lng),
  });
  return null;
};

const createCenterIcon = (colorHex: string) =>
  L.divIcon({
    className: 'geofence-center-marker',
    html: `
      <div style="
        width: 22px;
        height: 22px;
        border-radius: 9999px;
        background-color: ${colorHex};
        border: 3px solid #ffffff;
        box-shadow: 0 0 0 2px ${colorHex}, 0 2px 6px rgba(0,0,0,0.5);
      "></div>
    `,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });

export const MapGeofencePickerModal: React.FC<MapGeofencePickerModalProps> = ({
  initialZone,
  defaultLat,
  defaultLng,
  currentLang,
  onDismiss,
  onSaveGeofence,
}) => {
  const [zoneName, setZoneName] = useState(initialZone?.name ?? '');
  const [radiusMeters, setRadiusMeters] = useState(initialZone?.radiusMeters ?? 200);
  const [centerLat, setCenterLat] = useState(initialZone?.latitude ?? defaultLat);
  const [centerLng, setCenterLng] = useState(initialZone?.longitude ?? defaultLng);
  const [selectedIcon, setSelectedIcon] = useState(initialZone?.iconName ?? 'home');
  const [selectedColorHex, setSelectedColorHex] = useState(initialZone?.colorHex ?? '#10B981');

  const icons = [
    { key: 'home', label: 'Home', icon: Home },
    { key: 'park', label: 'Park', icon: Trees },
    { key: 'school', label: 'School', icon: GraduationCap },
    { key: 'sports', label: 'Sports', icon: Trophy },
  ];

  return (
    <div
      data-testid="map_geofence_picker_modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Map className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              {initialZone ? 'Edit Zone on Map' : AppStrings.getMapZonePickerTitle(currentLang)}
            </h2>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">{AppStrings.getMapTapHint(currentLang)}</p>

        {/* Real interactive Leaflet map - tap/click anywhere to set the safe zone center */}
        <div
          data-testid="interactive_map_picker_container"
          className="relative w-full h-56 rounded-2xl overflow-hidden border border-slate-800 z-0"
        >
          <MapContainer
            center={[centerLat, centerLng]}
            zoom={16}
            scrollWheelZoom={true}
            zoomControl={false}
            className="w-full h-full"
          >
            <MapRecenter center={[centerLat, centerLng]} />
            <ClickToSetCenter
              onPick={(lat, lng) => {
                setCenterLat(lat);
                setCenterLng(lng);
              }}
            />
            <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_TILE_URL} />
            <Circle
              center={[centerLat, centerLng]}
              radius={radiusMeters}
              pathOptions={{
                color: selectedColorHex,
                fillColor: selectedColorHex,
                fillOpacity: 0.2,
                weight: 2,
              }}
            />
            <Marker position={[centerLat, centerLng]} icon={createCenterIcon(selectedColorHex)} />
          </MapContainer>

          {/* Coordinates badge */}
          <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 border border-slate-800 rounded-lg px-2.5 py-1 text-[10px] text-slate-300 pointer-events-none">
            GPS: {centerLat.toFixed(4)}, {centerLng.toFixed(4)} • {AppStrings.formatRadiusText(currentLang, Math.round(radiusMeters))}
          </div>
        </div>

        {/* Safe Zone Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">
            Safe Zone Name (e.g. Home, School, Park)
          </label>
          <input
            type="text"
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            data-testid="map_picker_zone_name_input"
            className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            placeholder="Home, School, Grandma's House..."
          />
        </div>

        {/* Reset button - only resets to the device's current GPS location.
            To choose a different location (e.g. "School"), tap that spot on
            the map above. */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => {
              setCenterLat(defaultLat);
              setCenterLng(defaultLng);
            }}
            data-testid="reset_center_to_gps_button"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Reset Center to GPS</span>
          </button>
        </div>

        {/* Radius Selector Control */}
        <RadiusSelectorControl
          radiusMeters={radiusMeters}
          onRadiusChange={setRadiusMeters}
          currentLang={currentLang}
        />

        {/* Icon & Color Selector */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-300">Icon:</span>
          <div className="flex items-center gap-2">
            {icons.map((item) => {
              const IconComp = item.icon;
              const isSelected = selectedIcon === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedIcon(item.key)}
                  className={`p-2 rounded-xl border flex items-center gap-1 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-600/20 text-blue-400 border-blue-500 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <button
          type="button"
          onClick={() => {
            if (!zoneName.trim()) return;
            onSaveGeofence({
              id: initialZone?.id ?? Date.now(),
              name: zoneName.trim(),
              latitude: centerLat,
              longitude: centerLng,
              radiusMeters,
              isEnabled: initialZone?.isEnabled ?? true,
              iconName: selectedIcon,
              colorHex: selectedColorHex,
            });
            onDismiss();
          }}
          data-testid="map_picker_save_button"
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <CheckCircle className="w-4 h-4" />
          <span>Save Safe Zone from Map</span>
        </button>
      </div>
    </div>
  );
};
