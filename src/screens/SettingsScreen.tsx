import React, { useState, useEffect } from 'react';
import { Settings, Globe, KeyRound, Lock, Phone, MessageSquare, Sun, Moon, Laptop, ShieldCheck, Cloud, LogIn, LogOut, AlertTriangle, Heart, Code2, Sparkles, Mic, Camera, MapPin, CheckCircle2 } from 'lucide-react';
import { ParentAuth, AppLanguageCode, AppThemeMode } from '../types';
import { AppStrings, APP_LANGUAGES } from '../i18n/translations';
import { PermissionService } from '../services/PermissionService';
import { auth, loginWithGoogle, logoutFirebase, subscribeToAuthChanges } from '../services/firebase';
import { hashPin } from '../services/hashing';
import { User } from 'firebase/auth';

interface SettingsScreenProps {
  auth: ParentAuth;
  currentLang: AppLanguageCode;
  currentTheme: AppThemeMode;
  onLanguageChange: (lang: AppLanguageCode) => void;
  onThemeChange: (theme: AppThemeMode) => void;
  onUpdateParentAuth: (auth: ParentAuth) => void;
  onLockApp: () => void;
}

/** Keep only digits and cap length - used on every numeric-PIN input field. */
const sanitizeDigits = (value: string, maxLen = 4) => value.replace(/[^0-9]/g, '').slice(0, maxLen);

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  auth: parentAuth,
  currentLang,
  currentTheme,
  onLanguageChange,
  onThemeChange,
  onUpdateParentAuth,
  onLockApp,
}) => {
  const [showPinModal, setShowPinModal] = useState(false);
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [isSavingPin, setIsSavingPin] = useState(false);

  const [parentPhoneInput, setParentPhoneInput] = useState(parentAuth.parentPhone);
  const [user, setUser] = useState<User | null>(auth.currentUser);
  const [permStatus, setPermStatus] = useState({ location: false, microphone: false, camera: false });
  const [isRequestingPerms, setIsRequestingPerms] = useState(false);

  const handleRequestAllPermissions = async () => {
    setIsRequestingPerms(true);
    const res = await PermissionService.requestAllPermissions();
    setPermStatus(res);
    setIsRequestingPerms(false);
    alert(
      currentLang === 'ar'
        ? `تم تحديث الأذونات: الموقع (${res.location ? 'مسموح' : 'مرفوض'}), الميكروفون والصوت (${res.microphone ? 'مسموح' : 'مرفوض'}), الكاميرا (${res.camera ? 'مسموح' : 'مرفوض'})`
        : currentLang === 'fr'
        ? `Permissions mises à jour : Localisation (${res.location ? 'Accordé' : 'Refusé'}), Micro (${res.microphone ? 'Accordé' : 'Refusé'}), Caméra (${res.camera ? 'Accordé' : 'Refusé'})`
        : `Permissions updated: Location (${res.location ? 'Granted' : 'Denied'}), Microphone/Audio (${res.microphone ? 'Granted' : 'Denied'}), Camera (${res.camera ? 'Granted' : 'Denied'})`
    );
  };

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleAlertMethodChange = (method: 'CALL' | 'SMS' | 'BOTH') => {
    onUpdateParentAuth({ ...parentAuth, alertMethod: method });
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4) {
      setPinError('New PIN must be exactly 4 digits.');
      return;
    }
    if (newPin !== confirmPin) {
      setPinError('New PINs do not match.');
      return;
    }

    setIsSavingPin(true);
    try {
      const oldPinHash = await hashPin(oldPin);
      if (oldPinHash !== parentAuth.pinCode) {
        setPinError('Current PIN passcode is incorrect.');
        return;
      }

      const newPinHash = await hashPin(newPin);
      onUpdateParentAuth({ ...parentAuth, pinCode: newPinHash, failedPinAttempts: 0, lockedUntilTimestamp: null });
      setShowPinModal(false);
      setOldPin('');
      setNewPin('');
      setConfirmPin('');
      setPinError('');
    } finally {
      setIsSavingPin(false);
    }
  };

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Header */}
      <div>
        <h2 className="text-base font-bold dark:text-white text-slate-900 flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-400" />
          <span>{AppStrings.getSettingsTitle(currentLang)}</span>
        </h2>
        <p className="text-xs dark:text-slate-400 text-slate-600 mt-0.5">
          Configure safety preferences, language localization, theme, and PIN security.
        </p>
      </div>

      {/* 1. Language Selector Card */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center gap-2 dark:text-white text-slate-900 font-bold text-xs">
          <Globe className="w-4 h-4 text-blue-400" />
          <span>{AppStrings.getLanguageSelector(currentLang)}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              data-testid={`language_switcher_${lang.code}`}
              className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                currentLang === lang.code
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-700 dark:border-slate-700 border-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang.displayName}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Theme Selector Card */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div>
          <div className="flex items-center gap-2 dark:text-white text-slate-900 font-bold text-xs">
            <Sun className="w-4 h-4 text-amber-400" />
            <span>{AppStrings.getThemeTitle(currentLang)}</span>
          </div>
          <p className="text-[11px] dark:text-slate-400 text-slate-600 mt-1">
            {AppStrings.getThemeDesc(currentLang)}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onThemeChange('light')}
            data-testid="theme_selector_light"
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              currentTheme === 'light'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>

          <button
            onClick={() => onThemeChange('dark')}
            data-testid="theme_selector_dark"
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              currentTheme === 'dark'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            onClick={() => onThemeChange('system')}
            data-testid="theme_selector_system"
            className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all ${
              currentTheme === 'system'
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
          >
            <Laptop className="w-3.5 h-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>

      {/* 3. Parent Phone & Emergency Dispatch Action Preference */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 dark:text-white text-slate-900 font-bold text-xs">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{AppStrings.getParentPhoneLabel(currentLang)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={parentPhoneInput}
            onChange={(e) => setParentPhoneInput(e.target.value)}
            className="flex-1 min-w-0 px-3.5 py-2 dark:bg-slate-800 bg-slate-100 dark:border-slate-700 border-slate-300 rounded-xl text-xs dark:text-white text-slate-900 font-mono focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={() => {
              if (parentPhoneInput.trim()) {
                onUpdateParentAuth({ ...parentAuth, parentPhone: parentPhoneInput.trim() });
              }
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow shrink-0 whitespace-nowrap"
          >
            {currentLang === 'ar' ? 'حفظ الرقم' : currentLang === 'fr' ? 'Enregistrer' : 'Save Phone'}
          </button>
        </div>

        <div className="pt-2">
          <label className="block text-[11px] font-bold dark:text-slate-300 text-slate-700 mb-1.5">
            {AppStrings.getAlertActionTitle(currentLang)}:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {[
              {
                key: 'BOTH',
                label: currentLang === 'ar' ? 'اتصال ورسالة معا' : currentLang === 'fr' ? 'Appel & SMS' : 'Call & SMS Both',
                icon: ShieldCheck,
              },
              {
                key: 'CALL',
                label: currentLang === 'ar' ? 'اتصال فقط' : currentLang === 'fr' ? 'Appel uniquement' : 'Call Only',
                icon: Phone,
              },
              {
                key: 'SMS',
                label: currentLang === 'ar' ? 'رسالة SMS فقط' : currentLang === 'fr' ? 'SMS uniquement' : 'SMS Only',
                icon: MessageSquare,
              },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = parentAuth.alertMethod === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => handleAlertMethodChange(item.key as any)}
                  className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-semibold transition-all whitespace-nowrap ${
                    isSelected
                      ? 'bg-blue-600/30 text-blue-300 border-blue-500 font-bold'
                      : 'dark:bg-slate-800 bg-slate-100 dark:text-slate-300 text-slate-700 dark:border-slate-700 border-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 4. Google Account Sign-In (Auth only - NOT a data backup/sync) */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap dark:text-white text-slate-900 font-bold text-xs">
            <Cloud className="w-4 h-4 text-sky-400 shrink-0" />
            <span className="shrink-0">
              {currentLang === 'ar'
                ? 'تسجيل الدخول بحساب Google'
                : currentLang === 'fr'
                ? 'Connexion Compte Google'
                : 'Google Account Sign-In'}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 inline-flex items-center gap-1 shrink-0 whitespace-nowrap">
              <AlertTriangle className="w-3 h-3 shrink-0" />
              <span>
                {user
                  ? currentLang === 'ar'
                    ? 'تم تسجيل الدخول'
                    : currentLang === 'fr'
                    ? 'Connecté'
                    : 'Signed In'
                  : currentLang === 'ar'
                  ? 'غير مسجل'
                  : currentLang === 'fr'
                  ? 'Non connecté'
                  : 'Not Signed In'}
              </span>
            </span>
          </div>

          {user ? (
            <button
              onClick={() => logoutFirebase()}
              className="px-3.5 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0 whitespace-nowrap w-full sm:w-auto"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span>{currentLang === 'ar' ? 'تسجيل الخروج' : currentLang === 'fr' ? 'Se déconnecter' : 'Sign Out'}</span>
            </button>
          ) : (
            <button
              onClick={() => loginWithGoogle()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-colors shrink-0 whitespace-nowrap w-full sm:w-auto"
            >
              <LogIn className="w-3.5 h-3.5 shrink-0" />
              <span>
                {currentLang === 'ar'
                  ? 'تسجيل الدخول عبر Google'
                  : currentLang === 'fr'
                  ? 'Se connecter avec Google'
                  : 'Sign In with Google'}
              </span>
            </button>
          )}
        </div>

        {user ? (
          <div className="p-3 dark:bg-slate-800/80 bg-slate-100 rounded-xl dark:border-slate-700/80 border-slate-300 flex items-center gap-3">
            {user.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || 'Parent'} className="w-9 h-9 rounded-full border border-blue-400 shrink-0" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-blue-600/20 border border-blue-400 flex items-center justify-center font-bold text-blue-400 text-xs shrink-0">
                {(user.displayName || user.email || 'P')[0]}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold dark:text-white text-slate-900 truncate">{user.displayName || 'Authenticated Parent'}</div>
              <div className="text-[11px] dark:text-slate-400 text-slate-600 truncate">{user.email}</div>
            </div>
          </div>
        ) : null}
        <p className="text-xs dark:text-slate-400 text-slate-600 leading-relaxed">
          {currentLang === 'ar'
            ? 'هذا الإجراء يقوم بتسجيل الدخول بحساب Google فقط - لا يقوم بنسخ احتياطي أو مزامنة لبيانات الأطفال أو المناطق الآمنة حالياً. جميع البيانات مخزنة محلياً على هذا الجهاز.'
            : currentLang === 'fr'
            ? 'Ceci vous connecte uniquement avec Google - cela ne sauvegarde pas encore vos profils ou zones de sécurité sur le cloud. Tout est stocké localement sur cet appareil.'
            : 'This only signs you in with Google - it does not back up or sync your child profiles, geofences, or alerts to the cloud yet. Everything is currently stored locally on this device only.'}
        </p>
      </div>

      {/* 5. PIN Passcode & Security */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 dark:text-white text-slate-900 font-bold text-xs">
            <KeyRound className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {currentLang === 'ar'
                ? 'حماية رمز PIN للوالدين'
                : currentLang === 'fr'
                ? 'Protection PIN Parent'
                : 'Parent PIN Protection'}
            </span>
          </div>

          <button
            onClick={() => setShowPinModal(true)}
            className="px-3.5 py-2 dark:bg-slate-800 bg-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700 dark:border-slate-700 border-slate-300 dark:text-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors shrink-0 whitespace-nowrap w-full sm:w-auto"
          >
            {AppStrings.getChangePin(currentLang)}
          </button>
        </div>

        <p className="text-xs dark:text-slate-400 text-slate-600">
          The 4-digit PIN is required to access or modify safety settings and manage children profiles.
        </p>
      </div>



      {/* 6. Device Permissions & Audio Recording Access */}
      <div className="dark:bg-slate-900 bg-white dark:border-slate-800 border-slate-200 rounded-2xl p-4 space-y-3 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 dark:text-white text-slate-900 font-bold text-xs">
            <Mic className="w-4 h-4 text-rose-400 shrink-0" />
            <span>
              {currentLang === 'ar'
                ? 'أذونات الجهاز وتسجيل الصوت'
                : currentLang === 'fr'
                ? 'Permissions de l appareil & Audio'
                : 'Device Permissions & Audio Recording'}
            </span>
          </div>

          <button
            onClick={handleRequestAllPermissions}
            disabled={isRequestingPerms}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 text-white text-xs font-bold rounded-xl shadow transition-colors shrink-0 whitespace-nowrap w-full sm:w-auto"
          >
            {isRequestingPerms
              ? (currentLang === 'ar' ? 'جاري الطلب...' : currentLang === 'fr' ? 'Demande...' : 'Requesting...')
              : (currentLang === 'ar' ? 'منح وتأكيد الأذونات' : currentLang === 'fr' ? 'Confirmer les permissions' : 'Request & Confirm Permissions')}
          </button>
        </div>

        <p className="text-xs dark:text-slate-400 text-slate-600">
          {currentLang === 'ar'
            ? 'يتطلب التطبيق أذونات الميكروفون لتسجيل الصوت المحيط، والموقع الجغرافي لتتبع السلامة، والكاميرا لميزات الحماية. اضغط للتأكيد.'
            : currentLang === 'fr'
            ? 'L application nécessite les permissions du microphone pour l enregistrement audio ambiant, de la localisation pour le suivi de sécurité, et de la caméra. Cliquez pour confirmer.'
            : 'The app requires microphone permission for ambient audio recording, location for safety tracking, and camera access. Tap to request and confirm runtime permissions.'}
        </p>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="p-2.5 rounded-xl border dark:bg-slate-800/80 bg-slate-100 dark:border-slate-700 border-slate-300 flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-800">
            <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">GPS: {permStatus.location ? '✓' : 'Tap'}</span>
          </div>
          <div className="p-2.5 rounded-xl border dark:bg-slate-800/80 bg-slate-100 dark:border-slate-700 border-slate-300 flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-800">
            <Mic className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="truncate">Mic: {permStatus.microphone ? '✓' : 'Tap'}</span>
          </div>
          <div className="p-2.5 rounded-xl border dark:bg-slate-800/80 bg-slate-100 dark:border-slate-700 border-slate-300 flex items-center gap-1.5 text-xs font-bold dark:text-slate-200 text-slate-800">
            <Camera className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Cam: {permStatus.camera ? '✓' : 'Tap'}</span>
          </div>
        </div>
      </div>

      {/* 7. Developer Credits & Dedication Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/40 border border-slate-800/90 rounded-2xl p-4 space-y-3.5 shadow-md relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex items-center gap-2.5 text-white font-bold text-xs border-b border-slate-800/80 pb-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs text-slate-200 font-bold block">
              {currentLang === 'ar' ? 'معلومات التطوير والتصميم' : currentLang === 'fr' ? 'Développement & Conception' : 'Development & Design'}
            </span>
            <span className="text-[11px] text-blue-400 font-extrabold flex items-center gap-1 mt-0.5">
              <span>Toufik Bendjeddah</span>
              <Sparkles className="w-3 h-3" />
            </span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
            <Heart className="w-3.5 h-3.5 fill-rose-500/30 text-rose-400 shrink-0" />
            <span>{currentLang === 'ar' ? 'إهداء خاص:' : currentLang === 'fr' ? 'Dédicace spéciale:' : 'Special Dedication:'}</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            {currentLang === 'ar'
              ? 'إهداء إلى أمي الغالية، إخوتي، رفيقة دربي إيمان، وجميع أصدقائي.'
              : currentLang === 'fr'
              ? 'Dédicacé à ma mère, mes frères et sœurs, mon âme sœur Imane, et tous mes amis.'
              : 'Dedicated to my mother, my siblings, my soulmate Imane, and my friends.'}
          </p>
        </div>
      </div>

      {/* Lock App Immediately Button */}
      <button
        onClick={onLockApp}
        className="w-full py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-colors"
      >
        <Lock className="w-4 h-4 text-amber-400" />
        <span>{AppStrings.getLockAppNow(currentLang)}</span>
      </button>

      {/* CHANGE PIN MODAL */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleChangePinSubmit} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 space-y-3.5 shadow-2xl">
            <h3 className="text-sm font-bold text-white">{AppStrings.getChangePin(currentLang)}</h3>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Current PIN:</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={oldPin}
                onChange={(e) => setOldPin(sanitizeDigits(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white text-center tracking-widest font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">New 4-Digit PIN:</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={newPin}
                onChange={(e) => setNewPin(sanitizeDigits(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white text-center tracking-widest font-bold"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">Confirm New PIN:</label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(sanitizeDigits(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white text-center tracking-widest font-bold"
                required
              />
            </div>

            {pinError && <p className="text-xs font-bold text-red-400">{pinError}</p>}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingPin}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold"
              >
                Update PIN
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
