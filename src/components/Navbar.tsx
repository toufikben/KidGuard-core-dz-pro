import React from 'react';
import { Shield, Lock, Bell, ChevronDown } from 'lucide-react';
import { KidProfile, AppLanguageCode } from '../types';
import { AppStrings, getKidAvatarEmoji } from '../i18n/translations';

interface NavbarProps {
  currentLang: AppLanguageCode;
  kids: KidProfile[];
  selectedKid: KidProfile | null;
  onSelectKid: (kid: KidProfile) => void;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onLockApp: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentLang,
  kids,
  selectedKid,
  onSelectKid,
  unreadAlertsCount,
  onOpenAlerts,
  onLockApp,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isDropdownOpen) {
        setIsDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        {/* Logo & Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border border-blue-500/30 shadow-md shadow-blue-500/10 shrink-0">
            <img
              src="/app_icon.png"
              alt="KidGuard Desktop Icon"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center gap-1.5 whitespace-nowrap">
              <span>{AppStrings.getAppName(currentLang)}</span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 shrink-0">
                PRO
              </span>
            </h1>
            <p className="text-xs text-slate-400 hidden sm:block truncate">
              {AppStrings.getAppSubTitle(currentLang)}
            </p>
          </div>
        </div>

        {/* Right Section: Kid Selector, Alerts Badge & Lock App */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Active Kid Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              data-testid="kid_selector_dropdown"
              aria-label={AppStrings.getSelectChild(currentLang)}
              aria-expanded={isDropdownOpen}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-200 transition-colors max-w-[110px] sm:max-w-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {selectedKid ? (
                <>
                  <span className="text-sm sm:text-base shrink-0">{getKidAvatarEmoji(selectedKid.avatarPreset, selectedKid.name)}</span>
                  <span className="truncate">{selectedKid.name}</span>
                </>
              ) : (
                <span className="truncate">{AppStrings.getSelectChild(currentLang)}</span>
              )}
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl py-1 z-50">
                <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 border-b border-slate-700/60 uppercase">
                  {AppStrings.getSelectChild(currentLang)}
                </div>
                {kids.map((kid) => (
                  <button
                    key={kid.id}
                    onClick={() => {
                      onSelectKid(kid);
                      setIsDropdownOpen(false);
                    }}
                    aria-label={`Select child ${kid.name}`}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left hover:bg-slate-700 transition-colors ${
                      selectedKid?.id === kid.id ? 'bg-blue-600/20 text-blue-400 font-bold' : 'text-slate-200'
                    }`}
                  >
                    <span className="text-lg">{getKidAvatarEmoji(kid.avatarPreset, kid.name)}</span>
                    <div className="flex-1">
                      <div>{kid.name}</div>
                      <div className="text-[10px] text-slate-400">{kid.batteryPercent}% 🔋</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Unread Alerts Button */}
          <button
            onClick={onOpenAlerts}
            data-testid="alerts_badge_button"
            aria-label={`${AppStrings.getNavAlerts(currentLang)} (${unreadAlertsCount} unread)`}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={AppStrings.getNavAlerts(currentLang)}
          >
            <Bell className="w-4 h-4" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold min-w-4 text-center animate-pulse">
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Lock App Button */}
          <button
            onClick={onLockApp}
            data-testid="lock_app_button"
            aria-label={AppStrings.getLockAppNow(currentLang)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-300 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            title={AppStrings.getLockAppNow(currentLang)}
          >
            <Lock className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
