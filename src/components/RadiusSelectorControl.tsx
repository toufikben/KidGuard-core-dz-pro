import React, { useState, useEffect } from 'react';
import { AppLanguageCode } from '../types';
import { AppStrings } from '../i18n/translations';

interface RadiusSelectorControlProps {
  radiusMeters: number;
  onRadiusChange: (radius: number) => void;
  currentLang: AppLanguageCode;
}

export const RadiusSelectorControl: React.FC<RadiusSelectorControlProps> = ({
  radiusMeters,
  onRadiusChange,
  currentLang,
}) => {
  const [isKmUnit, setIsKmUnit] = useState(radiusMeters >= 1000);
  const [directInputText, setDirectInputText] = useState('');

  useEffect(() => {
    if (isKmUnit) {
      const km = radiusMeters / 1000;
      setDirectInputText(km % 1 === 0 ? km.toFixed(0) : km.toFixed(1));
    } else {
      setDirectInputText(Math.round(radiusMeters).toString());
    }
  }, [radiusMeters, isKmUnit]);

  const presets = isKmUnit
    ? [
        { val: 1000, label: '1 km' },
        { val: 5000, label: '5 km' },
        { val: 10000, label: '10 km' },
        { val: 20000, label: '20 km' },
        { val: 50000, label: '50 km' },
      ]
    : [
        { val: 100, label: '100 m' },
        { val: 300, label: '300 m' },
        { val: 500, label: '500 m' },
        { val: 800, label: '800 m' },
        { val: 1000, label: '1 km' },
      ];

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-200">
          {AppStrings.getSafeRadius(currentLang, Math.round(radiusMeters))}
        </label>
        <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700">
          <button
            type="button"
            onClick={() => setIsKmUnit(false)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
              !isKmUnit ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Meters (متر)
          </button>
          <button
            type="button"
            onClick={() => setIsKmUnit(true)}
            className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-colors ${
              isKmUnit ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            KM (كم)
          </button>
        </div>
      </div>

      {/* Preset Suggestion Chips */}
      <div className="flex flex-wrap gap-1.5">
        {presets.map((preset) => {
          const isSelected = Math.abs(radiusMeters - preset.val) < 10;
          return (
            <button
              key={preset.val}
              type="button"
              onClick={() => onRadiusChange(preset.val)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                isSelected
                  ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* Slider */}
      <input
        type="range"
        min={50}
        max={50000}
        step={50}
        value={radiusMeters}
        onChange={(e) => onRadiusChange(parseFloat(e.target.value))}
        data-testid="radius_slider"
        className="w-full accent-blue-500 bg-slate-800 rounded-lg h-2 cursor-pointer"
      />

      {/* Direct Numeric Input */}
      <div>
        <label className="block text-[11px] text-slate-400 mb-1">
          {isKmUnit ? 'Direct Radius (in KM, 0.05-50)' : 'Direct Radius (in Meters, 50-50000)'}
        </label>
        <input
          type="number"
          value={directInputText}
          onChange={(e) => {
            setDirectInputText(e.target.value);
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val > 0) {
              const meters = isKmUnit ? val * 1000 : val;
              // Match the slider's 50m-50km range - the old 10m-1,000km cap
              // let a "safe zone" radius reach the size of a small country.
              onRadiusChange(Math.min(Math.max(meters, 50), 50000));
            }
          }}
          data-testid="custom_radius_direct_input"
          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          placeholder={isKmUnit ? 'e.g. 5' : 'e.g. 200'}
        />
      </div>
    </div>
  );
};
