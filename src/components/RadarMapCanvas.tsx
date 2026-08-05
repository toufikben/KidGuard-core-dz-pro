import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Map, Radar, Plus, Minus, Navigation, Layers, Target } from 'lucide-react';
import { KidProfile, GeofenceZone, MapDisplayMode, AppLanguageCode } from '../types';
import { getKidAvatarEmoji } from '../i18n/translations';

// Fallback coordinates when no kid is selected yet - central Algiers, matching
// the app's target market (see services/storage.ts default demo data).
const FALLBACK_LAT = 36.7538;
const FALLBACK_LNG = 3.0588;

export function calculateZoomForRadius(radiusMeters: number): number {
  if (radiusMeters >= 5000) return 11;
  if (radiusMeters >= 2500) return 12;
  if (radiusMeters >= 1200) return 13;
  if (radiusMeters >= 600) return 14;
  if (radiusMeters >= 300) return 15;
  if (radiusMeters >= 150) return 16;
  return 17;
}

interface RadarMapCanvasProps {
  kid: KidProfile | null;
  geofences: GeofenceZone[];
  currentLang: AppLanguageCode;
  onGeofenceClick?: (zone: GeofenceZone) => void;
  focusedZone?: GeofenceZone | null;
  onFitToZone?: (zone: GeofenceZone) => void;
}

// Component to dynamically re-center Leaflet Map when coordinates update
const MapRecenter: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom || map.getZoom());
  }, [center, map, zoom]);
  return null;
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION =
  'Tiles &copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community';

export const RadarMapCanvas: React.FC<RadarMapCanvasProps> = ({
  kid,
  geofences,
  currentLang,
  onGeofenceClick,
  focusedZone,
  onFitToZone,
}) => {
  const [displayMode, setDisplayMode] = useState<MapDisplayMode>('LEAFLET_MAP');
  const [isSatelliteMap, setIsSatelliteMap] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(15);
  const [tacticalZoom, setTacticalZoom] = useState(1000);

  const defaultLat = kid?.currentLat ?? FALLBACK_LAT;
  const defaultLng = kid?.currentLng ?? FALLBACK_LNG;
  const [mapCenter, setMapCenter] = useState<[number, number]>([defaultLat, defaultLng]);

  // Handle focusedZone changes to auto fit zoom & center
  useEffect(() => {
    if (focusedZone) {
      setMapCenter([focusedZone.latitude, focusedZone.longitude]);
      setZoomLevel(calculateZoomForRadius(focusedZone.radiusMeters));
    } else if (kid) {
      setMapCenter([kid.currentLat, kid.currentLng]);
    }
  }, [focusedZone, kid]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Tactical Radar Canvas Rendering Loop
  useEffect(() => {
    if (displayMode !== 'TACTICAL_RADAR' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animFrameId: number;
    let pulseRadius = 20;
    let pulseAlpha = 0.8;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;

      // Clear Canvas
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, width, height);

      // Grid Lines
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.4)';
      ctx.lineWidth = 1;
      const gridSpacing = 50;
      for (let x = 0; x <= width; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y <= height; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Radar Concentric Circles
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.setLineDash([6, 6]);
      [80, 160, 240].forEach((r) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      });
      ctx.setLineDash([]);

      const centerLat = kid?.currentLat ?? defaultLat;
      const centerLng = kid?.currentLng ?? defaultLng;

      // Real-world meters-per-degree conversion (matches the haversine-based
      // GeofenceMonitor and App.tsx's speed calc) so a geofence circle drawn
      // here is actually the same real-world size as the dot's offset from
      // center - previously this used an arbitrary *1000 factor for position
      // but a completely different, uncalibrated factor for the circle radius,
      // so a child could appear inside/outside the drawn circle regardless of
      // whether they were really inside/outside the geofence.
      const METERS_PER_DEGREE_LAT = 111320;
      const pxPerMeter = tacticalZoom / 2000;

      const latLngToOffset = (lat: number, lng: number) => {
        const dLatMeters = (lat - centerLat) * METERS_PER_DEGREE_LAT;
        const dLngMeters = (lng - centerLng) * METERS_PER_DEGREE_LAT * Math.cos((centerLat * Math.PI) / 180);
        const screenX = centerX + dLngMeters * pxPerMeter;
        const screenY = centerY - dLatMeters * pxPerMeter;
        return { x: screenX, y: screenY };
      };

      // Draw Geofences
      geofences.forEach((fence) => {
        if (!fence.isEnabled) return;
        const pos = latLngToOffset(fence.latitude, fence.longitude);
        const radiusPx = fence.radiusMeters * pxPerMeter;

        ctx.fillStyle = fence.colorHex + '33';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radiusPx, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = fence.colorHex;
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#f8fafc';
        ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(fence.name, pos.x, pos.y - radiusPx - 8);
      });

      // Draw Kid Location Pin & Pulse
      if (kid) {
        const kidPos = latLngToOffset(kid.currentLat, kid.currentLng);

        // Pulsing Ring
        pulseRadius += 0.8;
        pulseAlpha -= 0.012;
        if (pulseRadius > 60 || pulseAlpha <= 0) {
          pulseRadius = 15;
          pulseAlpha = 0.8;
        }

        ctx.fillStyle = `rgba(59, 130, 246, ${pulseAlpha})`;
        ctx.beginPath();
        ctx.arc(kidPos.x, kidPos.y, pulseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Status Ring
        const isBreached = kid.statusText.includes('Outside') || kid.statusText.includes('Breach');
        const statusColor = isBreached ? '#ef4444' : '#10b981';

        ctx.fillStyle = kid.avatarColorHex || '#3b82f6';
        ctx.beginPath();
        ctx.arc(kidPos.x, kidPos.y, 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(kidPos.x, kidPos.y, 24, 0, Math.PI * 2);
        ctx.stroke();

        // Avatar Emoji
        const emoji = getKidAvatarEmoji(kid.avatarPreset, kid.name);
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, kidPos.x, kidPos.y);

        // Name Banner
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(kidPos.x - 55, kidPos.y + 30, 110, 22);
        ctx.strokeStyle = statusColor;
        ctx.lineWidth = 1;
        ctx.strokeRect(kidPos.x - 55, kidPos.y + 30, 110, 22);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(`${kid.name} (${kid.currentSpeedKmh.toFixed(1)} km/h)`, kidPos.x, kidPos.y + 41);
      }

      animFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [displayMode, kid, geofences, tacticalZoom, defaultLat, defaultLng]);

  // Create custom DivIcon for child avatar pin in Leaflet
  const createKidIcon = (profile: KidProfile) => {
    const emoji = getKidAvatarEmoji(profile.avatarPreset, profile.name);
    const isBreached = profile.statusText.includes('Outside') || profile.statusText.includes('Breach');
    const ringColor = isBreached ? '#ef4444' : '#10b981';

    return L.divIcon({
      className: 'custom-kid-avatar-marker',
      html: `
        <div style="position: relative; display: flex; flex-direction: column; items-center: center; align-items: center;">
          <div style="
            width: 48px;
            height: 48px;
            border-radius: 9999px;
            background-color: ${profile.avatarColorHex || '#3b82f6'};
            border: 4px solid ${ringColor};
            box-shadow: 0 0 16px ${ringColor}88;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            cursor: pointer;
            transition: transform 0.2s;
          ">
            ${emoji}
          </div>
          <div style="
            margin-top: 4px;
            background-color: #0f172a;
            color: #ffffff;
            border: 1px solid ${ringColor};
            border-radius: 8px;
            padding: 2px 8px;
            font-size: 10px;
            font-weight: 700;
            white-space: nowrap;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);
          ">
            ${profile.name} • ${profile.currentSpeedKmh.toFixed(1)} km/h
          </div>
        </div>
      `,
      iconSize: [60, 75],
      iconAnchor: [30, 45],
    });
  };

  return (
    <div
      data-testid="radar_map_canvas_container"
      className="relative w-full h-[380px] rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-xl"
    >
      {/* Map View */}
      {displayMode === 'LEAFLET_MAP' ? (
        <div data-testid="interactive_google_map" className="w-full h-full relative z-0">
          <MapContainer
            center={mapCenter}
            zoom={zoomLevel}
            scrollWheelZoom={true}
            zoomControl={false}
            className="w-full h-full"
          >
            <MapRecenter center={mapCenter} zoom={zoomLevel} />

            <TileLayer
              attribution={isSatelliteMap ? SATELLITE_ATTRIBUTION : OSM_ATTRIBUTION}
              url={isSatelliteMap ? SATELLITE_TILE_URL : OSM_TILE_URL}
            />

            {/* Geofence Circles */}
            {geofences.map((fence) => {
              if (!fence.isEnabled) return null;
              return (
                <Circle
                  key={fence.id}
                  center={[fence.latitude, fence.longitude]}
                  radius={fence.radiusMeters}
                  pathOptions={{
                    color: fence.colorHex || '#10b981',
                    fillColor: fence.colorHex || '#10b981',
                    fillOpacity: 0.2,
                    weight: 2,
                  }}
                  eventHandlers={{
                    click: () => onGeofenceClick && onGeofenceClick(fence),
                  }}
                />
              );
            })}

            {/* Kid Location Marker */}
            {kid && (
              <Marker position={[kid.currentLat, kid.currentLng]} icon={createKidIcon(kid)}>
                <Popup>
                  <div className="p-2 text-slate-100">
                    <div className="font-bold text-sm flex items-center gap-1.5">
                      <span>{getKidAvatarEmoji(kid.avatarPreset, kid.name)}</span>
                      <span>{kid.name} (Live GPS)</span>
                    </div>
                    <div className="text-xs text-slate-300 mt-1">
                      Status: <span className="font-semibold text-emerald-400">{kid.statusText}</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Speed: {kid.currentSpeedKmh.toFixed(1)} km/h • Battery: {kid.batteryPercent}%
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      ) : (
        <div data-testid="tactical_radar_canvas" className="w-full h-full relative">
          <canvas
            ref={canvasRef}
            width={600}
            height={380}
            className="w-full h-full object-cover block"
          />
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1 flex items-center gap-1 shadow-lg">
          <button
            onClick={() => setDisplayMode('LEAFLET_MAP')}
            data-testid="google_map_mode_chip"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              displayMode === 'LEAFLET_MAP'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
          <button
            onClick={() => setDisplayMode('TACTICAL_RADAR')}
            data-testid="tactical_radar_mode_chip"
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              displayMode === 'TACTICAL_RADAR'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <Radar className="w-3.5 h-3.5" />
            <span>Radar</span>
          </button>
        </div>

        {displayMode === 'LEAFLET_MAP' && (
          <button
            onClick={() => setIsSatelliteMap(!isSatelliteMap)}
            data-testid="satellite_toggle_chip"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-900/90 backdrop-blur border border-slate-700/80 shadow-lg transition-all ${
              isSatelliteMap ? 'text-blue-400 border-blue-500/50' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isSatelliteMap ? 'Satellite' : 'Standard'}</span>
          </button>
        )}
      </div>

      {/* Bottom Zoom & Recenter Controls Overlay */}
      <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-2">
        <div className="flex flex-col gap-1 bg-slate-900/90 backdrop-blur border border-slate-700/80 rounded-xl p-1 shadow-lg">
          <button
            onClick={() => {
              if (displayMode === 'LEAFLET_MAP') {
                setZoomLevel((prev) => Math.min(prev + 1, 18));
              } else {
                setTacticalZoom((prev) => Math.min(prev * 1.25, 2500));
              }
            }}
            data-testid="zoom_in_button"
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (displayMode === 'LEAFLET_MAP') {
                setZoomLevel((prev) => Math.max(prev - 1, 3));
              } else {
                setTacticalZoom((prev) => Math.max(prev / 1.25, 300));
              }
            }}
            data-testid="zoom_out_button"
            className="p-1.5 rounded-lg text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          {geofences.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const zoneToFit = focusedZone || geofences.find((g) => g.isEnabled) || geofences[0];
                if (zoneToFit) {
                  setMapCenter([zoneToFit.latitude, zoneToFit.longitude]);
                  setZoomLevel(calculateZoomForRadius(zoneToFit.radiusMeters));
                  if (onFitToZone) onFitToZone(zoneToFit);
                }
              }}
              data-testid="fit_to_zone_button"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
              title="Automatically adjust map center and zoom level to fit active geofence boundary"
            >
              <Target className="w-4 h-4" />
              <span>Fit to Zone</span>
            </button>
          )}

          <button
            onClick={() => {
              if (kid) {
                setMapCenter([kid.currentLat, kid.currentLng]);
                setZoomLevel(16);
              }
            }}
            data-testid="recenter_child_fab"
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg transition-all active:scale-95"
          >
            <Navigation className="w-4 h-4" />
            <span>Recenter</span>
          </button>
        </div>
      </div>
    </div>
  );
};
