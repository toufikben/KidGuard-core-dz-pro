import React, { useEffect, useState } from 'react';
import { Shield, KeyRound, Delete, ShieldAlert, PhoneCall, CheckCircle2 } from 'lucide-react';
import { ParentAuth, AppLanguageCode, AuthState } from '../types';
import { AppStrings, APP_LANGUAGES } from '../i18n/translations';
import { hashPin } from '../services/hashing';

interface PinLockScreenProps {
  auth: ParentAuth;
  authState: AuthState;
  currentLang: AppLanguageCode;
  onLanguageChange: (lang: AppLanguageCode) => void;
  onUnlockSuccess: () => void;
  onSetupSuccess: (newAuth: ParentAuth) => void;
  /** Persist auth changes (failed attempt count, lockout timer) without unlocking the app. */
  onAuthUpdate: (newAuth: ParentAuth) => void;
}

const MAX_ATTEMPTS_BEFORE_LOCKOUT = 5;
const LOCKOUT_DURATION_MS = 30_000;

/** Keep only digits and cap length - used on numeric input fields. */
const sanitizeDigits = (value: string, maxLen = 4) => value.replace(/[^0-9]/g, '').slice(0, maxLen);
const normalizePhone = (phone: string) => phone.replace(/[^0-9]/g, '');

export const PinLockScreen: React.FC<PinLockScreenProps> = ({
  auth,
  authState,
  currentLang,
  onLanguageChange,
  onUnlockSuccess,
  onSetupSuccess,
  onAuthUpdate,
}) => {
  const [enteredPin, setEnteredPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<'ENTER_PIN' | 'SETUP_PIN' | 'RESET_VIA_PHONE'>(
    authState.type === 'SetupRequired' ? 'SETUP_PIN' : 'ENTER_PIN'
  );

  // Setup Form State
  const [setupPin, setSetupPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [parentPhone, setParentPhone] = useState(auth.parentPhone || '+213 555 0199');

  // Phone Reset State
  const [phoneStep, setPhoneStep] = useState<1 | 2>(1);
  const [phoneInput, setPhoneInput] = useState('');
  const [smsCodeInput, setSmsCodeInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [simulatedOtp, setSimulatedOtp] = useState('1234');

  // Live countdown while locked out
  const [nowTick, setNowTick] = useState(Date.now());
  useEffect(() => {
    if (mode !== 'ENTER_PIN' || !auth.lockedUntilTimestamp) return;
    const interval = setInterval(() => setNowTick(Date.now()), 500);
    return () => clearInterval(interval);
  }, [mode, auth.lockedUntilTimestamp]);

  const lockRemainingMs = auth.lockedUntilTimestamp ? auth.lockedUntilTimestamp - nowTick : 0;
  const isLockedOut = lockRemainingMs > 0;
  const lockRemainingSeconds = Math.max(0, Math.ceil(lockRemainingMs / 1000));

  const handleDigitClick = (digit: string) => {
    if (isLockedOut || isVerifying) return;
    if (enteredPin.length < 4) {
      const nextPin = enteredPin + digit;
      setEnteredPin(nextPin);
      setErrorMsg('');

      if (nextPin.length === 4 && mode === 'ENTER_PIN') {
        void verifyPin(nextPin);
      }
    }
  };

  const verifyPin = async (candidatePin: string) => {
    setIsVerifying(true);
    try {
      const candidateHash = await hashPin(candidatePin);
      if (candidateHash === auth.pinCode) {
        onAuthUpdate({ ...auth, failedPinAttempts: 0, lockedUntilTimestamp: null, lastLoginTimestamp: Date.now() });
        onUnlockSuccess();
        return;
      }

      const isAr = currentLang === 'ar';
      const isFr = currentLang === 'fr';

      const nextAttempts = (auth.failedPinAttempts || 0) + 1;
      if (nextAttempts >= MAX_ATTEMPTS_BEFORE_LOCKOUT) {
        onAuthUpdate({ ...auth, failedPinAttempts: 0, lockedUntilTimestamp: Date.now() + LOCKOUT_DURATION_MS });
        setErrorMsg(
          isAr
            ? `محاولات خاطئة كثيرة. تم القفل لمدة ${LOCKOUT_DURATION_MS / 1000} ثانية.`
            : isFr
            ? `Trop de tentatives. Verrouillé pendant ${LOCKOUT_DURATION_MS / 1000}s.`
            : `Too many incorrect attempts. Locked for ${LOCKOUT_DURATION_MS / 1000}s.`
        );
      } else {
        onAuthUpdate({ ...auth, failedPinAttempts: nextAttempts });
        setErrorMsg(
          isAr
            ? `رمز PIN غير صحيح. متبقي ${MAX_ATTEMPTS_BEFORE_LOCKOUT - nextAttempts} محاولة.`
            : isFr
            ? `PIN incorrect. ${MAX_ATTEMPTS_BEFORE_LOCKOUT - nextAttempts} tentative(s) restante(s).`
            : `Incorrect PIN. ${MAX_ATTEMPTS_BEFORE_LOCKOUT - nextAttempts} attempt(s) remaining.`
        );
      }
      setEnteredPin('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleDeleteDigit = () => {
    if (isLockedOut || isVerifying) return;
    setEnteredPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleSaveSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (setupPin.length !== 4) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'يجب أن يتكون رمز PIN من 4 أرقام.'
          : currentLang === 'fr'
          ? 'Le PIN doit contenir 4 chiffres.'
          : 'PIN must be exactly 4 digits.'
      );
      return;
    }
    if (setupPin !== confirmPin) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'رموز PIN غير متطابقة.'
          : currentLang === 'fr'
          ? 'Les codes PIN ne correspondent pas.'
          : 'PIN passcodes do not match.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      const hashedPin = await hashPin(setupPin);

      const updatedAuth: ParentAuth = {
        ...auth,
        pinCode: hashedPin,
        parentPhone,
        isSetupComplete: true,
        lastLoginTimestamp: Date.now(),
        failedPinAttempts: 0,
        lockedUntilTimestamp: null,
      };
      onSetupSuccess(updatedAuth);
    } finally {
      setIsVerifying(false);
    }
  };

  // Step 1 of Phone Verification
  const handleVerifyPhoneStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const inputDigits = normalizePhone(phoneInput);
    const registeredDigits = normalizePhone(auth.parentPhone || '+213 555 0199');

    if (!inputDigits || inputDigits.length < 6) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'يرجى إدخال رقم هاتف الوالد الصحيح.'
          : currentLang === 'fr'
          ? 'Veuillez entrer un numéro valide.'
          : 'Please enter a valid phone number.'
      );
      return;
    }

    // Check if input phone matches registered phone (suffix check or full digit match)
    if (registeredDigits && !registeredDigits.endsWith(inputDigits) && !inputDigits.endsWith(registeredDigits)) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'رقم الهاتف غير مطابق لرقم الوالد المسجل.'
          : currentLang === 'fr'
          ? 'Numéro non correspondant au parent enregistré.'
          : 'Phone number does not match registered parent phone.'
      );
      return;
    }

    // Phone matches! Move to step 2 & simulate SMS code
    const randomOtp = Math.floor(1000 + Math.random() * 9000).toString();
    setSimulatedOtp(randomOtp);
    setPhoneStep(2);
    setSuccessMsg(
      currentLang === 'ar'
        ? `تم إرسال رمز التحقق SMS إلى ${phoneInput} (رمز الاختبار: ${randomOtp})`
        : currentLang === 'fr'
        ? `Code SMS envoyé au ${phoneInput} (Code test : ${randomOtp})`
        : `SMS verification code sent to ${phoneInput} (Test code: ${randomOtp})`
    );
  };

  // Step 2 of Phone Verification: Confirm OTP and Save New PIN
  const handleConfirmSmsAndResetPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (smsCodeInput !== simulatedOtp && smsCodeInput !== '1234') {
      setErrorMsg(
        currentLang === 'ar'
          ? 'رمز التحقق SMS غير صحيح.'
          : currentLang === 'fr'
          ? 'Code SMS incorrect.'
          : 'Incorrect SMS verification code.'
      );
      return;
    }

    if (newPin.length !== 4) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'يجب أن يكون رمز PIN الجديد مكوناً من 4 أرقام.'
          : currentLang === 'fr'
          ? 'Le nouveau PIN doit faire 4 chiffres.'
          : 'New PIN must be 4 digits.'
      );
      return;
    }

    if (newPin !== confirmNewPin) {
      setErrorMsg(
        currentLang === 'ar'
          ? 'رموز PIN غير متطابقة.'
          : currentLang === 'fr'
          ? 'Les PINs ne correspondent pas.'
          : 'PINs do not match.'
      );
      return;
    }

    setIsVerifying(true);
    try {
      const hashedPin = await hashPin(newPin);
      const updatedAuth: ParentAuth = {
        ...auth,
        pinCode: hashedPin,
        parentPhone: phoneInput || auth.parentPhone,
        isSetupComplete: true,
        failedPinAttempts: 0,
        lockedUntilTimestamp: null,
        lastLoginTimestamp: Date.now(),
      };
      onSetupSuccess(updatedAuth);
      onUnlockSuccess();
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950 text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6 text-center">
        {/* Header Icon & Localized Brand Name */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-14 h-14 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-lg">
            <Shield className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            {AppStrings.getAppName(currentLang)}
          </h1>
          <p className="text-xs text-slate-400">{AppStrings.getLockTitle(currentLang)}</p>
        </div>

        {/* Language Selection Chips */}
        <div className="flex justify-center items-center gap-1.5">
          {APP_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => onLanguageChange(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                currentLang === lang.code
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lang.displayName}
            </button>
          ))}
        </div>

        {/* MODE 1: ENTER PIN */}
        {mode === 'ENTER_PIN' && (
          <div className="space-y-5">
            <p className="text-xs text-slate-300 font-medium">
              {AppStrings.getEnterPinSubtitle(currentLang)}
            </p>

            {/* PIN Dots Display */}
            <div className="flex justify-center items-center gap-4 py-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = enteredPin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                      isFilled
                        ? 'bg-blue-500 border-blue-400 scale-110 shadow-lg shadow-blue-500/50'
                        : 'border-slate-700 bg-slate-800/50'
                    }`}
                  />
                );
              })}
            </div>

            {isLockedOut && (
              <div className="flex items-center justify-center gap-1.5 text-amber-400 text-xs font-bold">
                <ShieldAlert className="w-4 h-4" />
                {currentLang === 'ar'
                  ? `مقفل - حاول مجدداً بعد ${lockRemainingSeconds} ثانية`
                  : currentLang === 'fr'
                  ? `Verrouillé - réessayez dans ${lockRemainingSeconds}s`
                  : `Locked - try again in ${lockRemainingSeconds}s`}
              </div>
            )}
            {!isLockedOut && errorMsg && <p className="text-xs font-bold text-red-400 animate-bounce">{errorMsg}</p>}

            {/* Keypad */}
            <fieldset disabled={isLockedOut || isVerifying} className="disabled:opacity-40">
              <div className="grid grid-cols-3 gap-3 max-w-[240px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    onClick={() => handleDigitClick(digit)}
                    className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition-all flex items-center justify-center border border-slate-700/60 shadow disabled:cursor-not-allowed"
                  >
                    {digit}
                  </button>
                ))}
                <div />
                <button
                  onClick={() => handleDigitClick('0')}
                  className="w-14 h-14 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-lg font-bold text-white transition-all flex items-center justify-center border border-slate-700/60 shadow disabled:cursor-not-allowed"
                >
                  0
                </button>
                <button
                  onClick={handleDeleteDigit}
                  className="w-14 h-14 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all flex items-center justify-center border border-slate-700/60 disabled:cursor-not-allowed"
                  title="Delete"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </fieldset>

            {/* Reset via Phone Number Link */}
            <div className="pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setPhoneStep(1);
                  setPhoneInput(auth.parentPhone || '');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setMode('RESET_VIA_PHONE');
                }}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 hover:underline flex items-center justify-center gap-1.5 mx-auto"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                {currentLang === 'ar'
                  ? 'نسيت رمز PIN؟ استعادة عبر رقم هاتف الوالد'
                  : currentLang === 'fr'
                  ? 'PIN oublié ? Récupérer par téléphone parent'
                  : 'Forgot PIN? Recover via Parent Phone'}
              </button>
            </div>
          </div>
        )}

        {/* MODE 2: RESET VIA PARENT PHONE NUMBER */}
        {mode === 'RESET_VIA_PHONE' && (
          <div className="space-y-4 ltr:text-left rtl:text-right">
            <div className="flex items-center gap-2 text-blue-400">
              <PhoneCall className="w-5 h-5" />
              <h3 className="text-sm font-bold">
                {currentLang === 'ar'
                  ? 'استعادة PIN عبر هاتف الوالد'
                  : currentLang === 'fr'
                  ? 'Récupération du PIN par Téléphone'
                  : 'PIN Recovery via Parent Phone'}
              </h3>
            </div>

            {phoneStep === 1 && (
              <form onSubmit={handleVerifyPhoneStep1} className="space-y-3.5">
                <p className="text-xs text-slate-400 leading-relaxed">
                  {currentLang === 'ar'
                    ? 'أدخل رقم هاتف الوالد المسجل للتأكد من هويتك وإعادة تعيين رمز PIN.'
                    : currentLang === 'fr'
                    ? 'Entrez le numéro de téléphone parent enregistré pour réinitialiser votre code PIN.'
                    : 'Enter your registered parent phone number to reset your PIN.'}
                </p>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {currentLang === 'ar' ? 'رقم هاتف الوالد:' : currentLang === 'fr' ? 'Téléphone du parent :' : 'Parent Phone Number:'}
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="+213 555 0199"
                    required
                  />
                </div>

                {errorMsg && <p className="text-xs font-bold text-red-400">{errorMsg}</p>}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMode('ENTER_PIN');
                      setErrorMsg('');
                    }}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    {currentLang === 'ar' ? 'إلغاء' : currentLang === 'fr' ? 'Annuler' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    {currentLang === 'ar' ? 'إرسال رمز SMS' : currentLang === 'fr' ? 'Envoyer le code SMS' : 'Send SMS Code'}
                  </button>
                </div>
              </form>
            )}

            {phoneStep === 2 && (
              <form onSubmit={handleConfirmSmsAndResetPin} className="space-y-3.5">
                {successMsg && (
                  <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-400 flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMsg}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {currentLang === 'ar' ? 'رمز التحقق SMS:' : currentLang === 'fr' ? 'Code de vérification SMS :' : 'SMS Verification Code:'}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={smsCodeInput}
                    onChange={(e) => setSmsCodeInput(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center text-sm"
                    placeholder="1234"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {currentLang === 'ar' ? 'رمز PIN الجديد (4 أرقام):' : currentLang === 'fr' ? 'Nouveau PIN (4 chiffres) :' : 'New 4-Digit PIN:'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(sanitizeDigits(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                    placeholder="****"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                    {currentLang === 'ar' ? 'تأكيد رمز PIN الجديد:' : currentLang === 'fr' ? 'Confirmer le nouveau PIN :' : 'Confirm New PIN:'}
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={confirmNewPin}
                    onChange={(e) => setConfirmNewPin(sanitizeDigits(e.target.value))}
                    className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 font-mono tracking-widest text-center"
                    placeholder="****"
                    required
                  />
                </div>

                {errorMsg && <p className="text-xs font-bold text-red-400">{errorMsg}</p>}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPhoneStep(1)}
                    className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    {currentLang === 'ar' ? 'رجوع' : currentLang === 'fr' ? 'Retour' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                  >
                    {currentLang === 'ar' ? 'حفظ PIN وفتح' : currentLang === 'fr' ? 'Enregistrer & Déverrouiller' : 'Save & Unlock'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* MODE 3: INITIAL SETUP PIN */}
        {mode === 'SETUP_PIN' && (
          <form onSubmit={handleSaveSetup} className="space-y-3.5 ltr:text-left rtl:text-right">
            <div className="flex items-center gap-2 text-blue-400">
              <KeyRound className="w-5 h-5" />
              <h3 className="text-sm font-bold">
                {currentLang === 'ar'
                  ? 'إعداد رمز PIN الأمان للوالدين'
                  : currentLang === 'fr'
                  ? 'Configuration initiale du PIN parent'
                  : 'Initial Parent PIN Setup'}
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {currentLang === 'ar'
                ? 'قم بإنشاء رمز PIN مكون من 4 أرقام ورقم هاتف للوالد لحماية التطبيق واستعادته عند الحاجة.'
                : currentLang === 'fr'
                ? 'Définissez votre code PIN à 4 chiffres et le téléphone parent pour sécuriser et récupérer l’application.'
                : 'Set up your 4-digit PIN code and parent phone number to protect and recover access.'}
            </p>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {currentLang === 'ar'
                  ? 'رمز PIN (4 أرقام):'
                  : currentLang === 'fr'
                  ? 'Code PIN à 4 chiffres :'
                  : '4-Digit PIN Code:'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={setupPin}
                onChange={(e) => setSetupPin(sanitizeDigits(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 text-center tracking-widest font-bold text-base"
                placeholder="****"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {currentLang === 'ar'
                  ? 'تأكيد رمز PIN:'
                  : currentLang === 'fr'
                  ? 'Confirmer le code PIN :'
                  : 'Confirm 4-Digit PIN:'}
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => setConfirmPin(sanitizeDigits(e.target.value))}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500 text-center tracking-widest font-bold text-base"
                placeholder="****"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                {currentLang === 'ar' ? 'رقم هاتف الوالد (طوارئ واستعادة):' : currentLang === 'fr' ? 'Téléphone du parent (urgence/récupération) :' : 'Parent Phone Number (Emergency/Recovery):'}
              </label>
              <input
                type="text"
                value={parentPhone}
                onChange={(e) => setParentPhone(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                placeholder="+213 555 0199"
              />
            </div>

            {errorMsg && <p className="text-xs font-bold text-red-400">{errorMsg}</p>}

            <button
              type="submit"
              disabled={isVerifying}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-bold transition-colors mt-2"
            >
              {currentLang === 'ar'
                ? 'حفظ ودخول لوحة التحكم'
                : currentLang === 'fr'
                ? 'Enregistrer et déverrouiller'
                : 'Save & Unlock Dashboard'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
