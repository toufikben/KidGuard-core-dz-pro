import { AppLanguageCode } from '../types';

export const APP_LANGUAGES = [
  { code: 'en' as AppLanguageCode, displayName: 'English 🇺🇸', isRtl: false },
  { code: 'ar' as AppLanguageCode, displayName: 'العربية 🇸🇦', isRtl: true },
  { code: 'fr' as AppLanguageCode, displayName: 'Français 🇫🇷', isRtl: false },
];

export const AppStrings = {
  getAppName(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'حامي الطفل';
      case 'fr': return 'KidGuard';
      default: return 'KidGuard';
    }
  },
  getAppSubTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'نظام تتبع الأمان والجغرافية';
      case 'fr': return 'Système de suivi GPS et de géorepérage';
      default: return 'GPS Tracking & Geofence Safety System';
    }
  },
  getLiveTrackingActive(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'التتبع المباشر نشط';
      case 'fr': return 'Suivi en direct actif';
      default: return 'Live Tracking Active';
    }
  },
  getOutsideGeofence(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'خارج منطقة الأمان المحُددة!';
      case 'fr': return 'Hors de la zone de sécurité !';
      default: return 'Outside Safe Geofence Zone!';
    }
  },
  getSafeInZone(lang: AppLanguageCode, zoneName: string): string {
    switch (lang) {
      case 'ar': return `آمن في ${zoneName}`;
      case 'fr': return `En sécurité à ${zoneName}`;
      default: return `Safe in ${zoneName}`;
    }
  },
  getMonitoringStatus(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'جاري المراقبة...';
      case 'fr': return 'Surveillance en cours...';
      default: return 'Monitoring...';
    }
  },
  getSpeedLabel(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'السرعة';
      case 'fr': return 'Vitesse';
      default: return 'Speed';
    }
  },
  getModeLabel(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'وضع GPS';
      case 'fr': return 'Mode GPS';
      default: return 'GPS Mode';
    }
  },
  getAccuracyLabel(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'الدقة';
      case 'fr': return 'Précision';
      default: return 'Accuracy';
    }
  },
  getLiveGps(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'GPS مباشر';
      case 'fr': return 'GPS en direct';
      default: return 'Live GPS';
    }
  },
  getOutdoorSim(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'محاكاة خارجية';
      case 'fr': return 'Simulateur extérieur';
      default: return 'Outdoor Sim';
    }
  },
  getRadarMapTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'خريطة الرادار الفورية';
      case 'fr': return 'Carte radar en temps réel';
      default: return 'Real-Time Radar Map';
    }
  },
  getSimulateWalkToggle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'محاكاة الحركة';
      case 'fr': return 'Simuler marche';
      default: return 'Simulate Walk';
    }
  },
  getPanicSos(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'طوارئ SOS';
      case 'fr': return 'SOS Urgence';
      default: return 'Panic SOS';
    }
  },
  getCheckIn(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'تسجيل حضور';
      case 'fr': return 'Pointage';
      default: return 'Check-In';
    }
  },
  getEmergencyHotline(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'خط طوارئ الوالدين';
      case 'fr': return "Ligne d'urgence parentale";
      default: return 'Emergency Contact Hotline';
    }
  },
  getTapToCall(lang: AppLanguageCode, phone: string): string {
    switch (lang) {
      case 'ar': return `انقر للاتصال بـ ${phone}`;
      case 'fr': return `Appuyer pour appeler ${phone}`;
      default: return `Tap to call ${phone}`;
    }
  },
  getNavRadar(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'الرادار';
      case 'fr': return 'Radar';
      default: return 'Radar';
    }
  },
  getNavGeofences(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'المناطق الآمنة';
      case 'fr': return 'Zones sûres';
      default: return 'Safe Zones';
    }
  },
  getNavHistory(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'المسارات';
      case 'fr': return 'Historique';
      default: return 'Breadcrumbs';
    }
  },
  getNavAlerts(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'التنبيهات';
      case 'fr': return 'Alertes';
      default: return 'Alerts';
    }
  },
  getNavKids(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'الأطفال';
      case 'fr': return 'Enfants';
      default: return 'Kids';
    }
  },
  getNavSettings(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'الإعدادات';
      case 'fr': return 'Paramètres';
      default: return 'Settings';
    }
  },
  getGeofenceTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'مناطق الأمان الجغرافية';
      case 'fr': return 'Zones de géorepérage';
      default: return 'Geofence Safe Zones';
    }
  },
  getNoGeofences(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'لم يتم تكوين مناطق آمنة';
      case 'fr': return 'Aucune zone configurée';
      default: return 'No Geofence Zones Configured';
    }
  },
  getAddZoneHint(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'انقر على زر + لإضافة حدود آمنة مثل المنزل، المدرسة، أو الحديقة.';
      case 'fr': return "Appuyez sur + pour ajouter des limites sûres comme la maison ou l'école.";
      default: return 'Tap + button to add safe boundaries like Home, School, or Park.';
    }
  },
  formatRadiusText(lang: AppLanguageCode, meters: number): string {
    if (meters < 1000) {
      switch (lang) {
        case 'ar': return `${meters} متر`;
        case 'fr': return `${meters} m`;
        default: return `${meters} meters`;
      }
    } else {
      const km = meters / 1000.0;
      const formattedKm = km % 1.0 === 0 ? km.toFixed(0) : km.toFixed(1);
      switch (lang) {
        case 'ar': return `${formattedKm} كم (${meters} متر)`;
        case 'fr': return `${formattedKm} km`;
        default: return `${formattedKm} km`;
      }
    }
  },
  getSafeRadius(lang: AppLanguageCode, meters: number): string {
    const text = this.formatRadiusText(lang, meters);
    switch (lang) {
      case 'ar': return `نصف القطر الآمن: ${text}`;
      case 'fr': return `Rayon de sécurité : ${text}`;
      default: return `Safe Radius: ${text}`;
    }
  },
  getAlertsTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'سجل تنبيهات الأمان';
      case 'fr': return "Journal d'alertes de sécurité";
      default: return 'Safety Alerts Log';
    }
  },
  getMarkAllRead(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'تعليم الكل كمقروء';
      case 'fr': return 'Tout marquer comme lu';
      default: return 'Mark All Read';
    }
  },
  getNoAlerts(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'كل شيء آمن! لا توجد تنبيهات';
      case 'fr': return 'Tout est clair ! Aucune alerte';
      default: return 'All Clear! No Active Alerts';
    }
  },
  getSettingsTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'إعدادات الوالدين والأمان';
      case 'fr': return 'Paramètres et sécurité parentale';
      default: return 'Parent Settings & Security';
    }
  },
  getLanguageSelector(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'لغة التطبيق';
      case 'fr': return "Langue de l'application";
      default: return 'App Language';
    }
  },
  getChangePin(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'تغيير رمز PIN للوالدين';
      case 'fr': return 'Changer le code PIN parent';
      default: return 'Change Parent PIN Passcode';
    }
  },
  getLockAppNow(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'قفل التطبيق فوراً';
      case 'fr': return "Verrouiller l'application";
      default: return 'Lock App Immediately';
    }
  },
  getLockTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'قفل الأمان كيد جارد';
      case 'fr': return 'Verrou de sécurité KidGuard';
      default: return 'KidGuard Safety Lock';
    }
  },
  getEnterPinSubtitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'أدخل رمز PIN المكون من 4 أرقام للدخول';
      case 'fr': return 'Entrez votre PIN à 4 chiffres';
      default: return 'Enter your 4-digit PIN to access dashboard';
    }
  },
  getForgotPin(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'نسيت رمز PIN؟';
      case 'fr': return 'Code PIN oublié ?';
      default: return 'Forgot Parent PIN?';
    }
  },
  getSelectChild(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'اختر الطفل';
      case 'fr': return 'Sélectionner un enfant';
      default: return 'Select Child';
    }
  },
  getMapZonePickerTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'اختيار منطقة الأمان من الخريطة 🗺️';
      case 'fr': return 'Sélectionner la zone sur la carte 🗺️';
      default: return 'Select Safe Zone on Map 🗺️';
    }
  },
  getMapTapHint(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'انقر على الخريطة لتحديد موقع مركز منطقة الأمان وضبط نصف القطر';
      case 'fr': return 'Appuyez sur la carte pour définir le centre de la zone et ajuster le rayon';
      default: return 'Tap anywhere on the map to set safe zone center & adjust radius';
    }
  },
  getParentPhoneLabel(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'رقم هاتف الأب / الوالد 📞';
      case 'fr': return 'Numéro de téléphone du parent 📞';
      default: return 'Parent Phone Number 📞';
    }
  },
  getAlertActionTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'طريقة التنبيه عند خروج الطفل من المنطقة الآمنة';
      case 'fr': return "Action d'alerte en cas de sortie de zone";
      default: return 'Alert Action When Child Exits Safe Zone';
    }
  },
  getCallParentBtnText(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'اتصل بالأب الآن 📞';
      case 'fr': return 'Appeler le parent 📞';
      default: return 'Call Parent Now 📞';
    }
  },
  getSendSmsBtnText(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'أرسل رسالة للأب 💬';
      case 'fr': return 'Envoyer SMS au parent 💬';
      default: return 'SMS Parent 💬';
    }
  },
  getEditParentPhoneTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'تغيير / إضافة رقم هاتف الوالد و SOS 📞';
      case 'fr': return 'Ajouter / Modifier le numéro du parent & SOS 📞';
      default: return 'Add / Change Parent & SOS Phone 📞';
    }
  },
  getThemeTitle(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'مظهر التطبيق 🎨';
      case 'fr': return "Thème de l'application 🎨";
      default: return 'App Theme 🎨';
    }
  },
  getThemeDesc(lang: AppLanguageCode): string {
    switch (lang) {
      case 'ar': return 'اختر بين المظهر الفاتح (الأبيض)، الداكن، أو حسب إعدادات الجهاز';
      case 'fr': return 'Choisissez entre le thème clair (blanc), sombre ou système';
      default: return 'Choose Light (White), Dark or System default theme';
    }
  },
};

export function getKidAvatarEmoji(preset: string | undefined, name: string): string {
  switch (preset) {
    case 'boy_1': return '👦';
    case 'girl_1': return '👧';
    case 'superhero': return '🦸';
    case 'bear': return '🧸';
    case 'star': return '🌟';
    case 'rocket': return '🚀';
    default:
      if (name.toLowerCase() === 'leo') return '👦';
      if (name.toLowerCase() === 'maya') return '👧';
      return '👶';
  }
}
