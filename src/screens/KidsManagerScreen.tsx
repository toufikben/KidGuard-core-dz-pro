import React, { useState } from 'react';
import { Users, UserPlus, Edit2, Trash2, CheckCircle2, Phone, Battery } from 'lucide-react';
import { KidProfile, AppLanguageCode } from '../types';
import { getKidAvatarEmoji } from '../i18n/translations';

// Fallback coordinates for a brand-new child profile with no location yet -
// central Algiers, matching the app's target market (see services/storage.ts
// default demo data).
const FALLBACK_LAT = 36.7538;
const FALLBACK_LNG = 3.0588;

interface KidsManagerScreenProps {
  kids: KidProfile[];
  selectedKidId: number;
  currentLang: AppLanguageCode;
  onSelectKid: (id: number) => void;
  onSaveKid: (kid: KidProfile) => void;
  onDeleteKid: (id: number) => void;
}

export const KidsManagerScreen: React.FC<KidsManagerScreenProps> = ({
  kids,
  selectedKidId,
  currentLang,
  onSelectKid,
  onSaveKid,
  onDeleteKid,
}) => {
  const [showModal, setShowModal] = useState(false);
  const [editingKid, setEditingKid] = useState<KidProfile | null>(null);

  const [name, setName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('+213 555 0199');
  const [avatarPreset, setAvatarPreset] = useState('boy_1');
  const [avatarColorHex, setAvatarColorHex] = useState('#3B82F6');

  const avatarPresets = [
    { key: 'boy_1', label: 'Boy', emoji: '👦' },
    { key: 'girl_1', label: 'Girl', emoji: '👧' },
    { key: 'superhero', label: 'Hero', emoji: '🦸' },
    { key: 'bear', label: 'Teddy', emoji: '🧸' },
    { key: 'star', label: 'Star', emoji: '🌟' },
    { key: 'rocket', label: 'Rocket', emoji: '🚀' },
  ];

  const avatarColors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

  const handleOpenModal = (kid?: KidProfile) => {
    if (kid) {
      setEditingKid(kid);
      setName(kid.name);
      setEmergencyPhone(kid.emergencyPhone);
      setAvatarPreset(kid.avatarPreset);
      setAvatarColorHex(kid.avatarColorHex);
    } else {
      setEditingKid(null);
      setName('');
      setEmergencyPhone('+213 555 0199');
      setAvatarPreset('boy_1');
      setAvatarColorHex('#3B82F6');
    }
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedKid: KidProfile = {
      id: editingKid?.id ?? Date.now(),
      name: name.trim(),
      avatarColorHex,
      avatarPreset,
      emergencyPhone: emergencyPhone.trim(),
      isTrackingActive: editingKid?.isTrackingActive ?? true,
      batteryPercent: editingKid?.batteryPercent ?? 100,
      currentLat: editingKid?.currentLat ?? FALLBACK_LAT,
      currentLng: editingKid?.currentLng ?? FALLBACK_LNG,
      currentSpeedKmh: editingKid?.currentSpeedKmh ?? 0.0,
      lastUpdatedTime: Date.now(),
      statusText: editingKid?.statusText ?? 'Safe in Home Safe Zone',
    };

    onSaveKid(savedKid);
    setShowModal(false);
  };

  const handleDeleteKid = (kid: KidProfile) => {
    const confirmed = window.confirm(
      currentLang === 'ar'
        ? `هل تريد حذف ملف الطفل "${kid.name}"؟ سيتم حذف سجل المواقع والتنبيهات المرتبطة به. لا يمكن التراجع عن هذا الإجراء.`
        : `Delete ${kid.name}'s profile? This can't be undone.`
    );
    if (confirmed) {
      onDeleteKid(kid.id);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Child Safety Profiles</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage profiles, avatar themes, and individual emergency phone numbers.
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Child Profile</span>
        </button>
      </div>

      {/* Children List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {kids.map((kid) => {
          const isSelected = kid.id === selectedKidId;
          const emoji = getKidAvatarEmoji(kid.avatarPreset, kid.name);

          return (
            <div
              key={kid.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md ${
                isSelected
                  ? 'bg-blue-950/30 border-blue-500/60 ring-1 ring-blue-500/30'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border border-white/20 shadow-sm shrink-0"
                  style={{ backgroundColor: kid.avatarColorHex || '#3b82f6' }}
                >
                  {emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-bold text-white truncate">{kid.name}</h3>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/40 shrink-0 whitespace-nowrap">
                        {currentLang === 'ar' ? 'محدد حالياً' : currentLang === 'fr' ? 'Sélectionné' : 'Active Selection'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-mono shrink-0">
                      <Phone className="w-3 h-3 text-slate-500" />
                      <span>{kid.emergencyPhone}</span>
                    </span>
                    <span className="shrink-0">•</span>
                    <span className="flex items-center gap-1 shrink-0">
                      <Battery className="w-3 h-3 text-emerald-400" />
                      <span>{kid.batteryPercent}%</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-slate-800/80">
                {!isSelected && (
                  <button
                    onClick={() => onSelectKid(kid.id)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                    title="Select Child"
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  </button>
                )}

                <button
                  onClick={() => handleOpenModal(kid)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors shrink-0"
                  title="Edit Child Profile"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                {kids.length > 1 && (
                  <button
                    onClick={() => handleDeleteKid(kid)}
                    className="p-2 rounded-xl bg-slate-800 hover:bg-red-950/60 text-slate-400 hover:text-red-400 transition-colors shrink-0"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD / EDIT CHILD MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">
              {editingKid ? 'Edit Child Profile' : 'Add New Child Profile'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Child Name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="e.g. Leo, Maya, Sarah"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Emergency Hotline Phone:</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                placeholder="+213 555 0199"
                required
              />
            </div>

            {/* Avatar Preset Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avatar Icon Preset:</label>
              <div className="grid grid-cols-3 gap-2">
                {avatarPresets.map((preset) => (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => setAvatarPreset(preset.key)}
                    className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                      avatarPreset === preset.key
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <span className="text-base">{preset.emoji}</span>
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Avatar Color Picker */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Avatar Badge Color:</label>
              <div className="flex gap-2">
                {avatarColors.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAvatarColorHex(color)}
                    style={{ backgroundColor: color }}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      avatarColorHex === color ? 'scale-110 border-white shadow-md' : 'border-transparent'
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Save Profile
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
