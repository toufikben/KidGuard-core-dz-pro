import React from 'react';
import { Radar, ShieldAlert, Route, Bell, Users, Settings } from 'lucide-react';
import { AppLanguageCode } from '../types';
import { AppStrings } from '../i18n/translations';

export type ActiveTab = 'radar' | 'geofence' | 'history' | 'alerts' | 'kids' | 'settings';

interface BottomNavProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  currentLang: AppLanguageCode;
  unreadAlertsCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  currentLang,
  unreadAlertsCount,
}) => {
  const tabs = [
    {
      id: 'radar' as ActiveTab,
      label: AppStrings.getNavRadar(currentLang),
      icon: Radar,
      testTag: 'nav_tab_radar',
    },
    {
      id: 'geofence' as ActiveTab,
      label: AppStrings.getNavGeofences(currentLang),
      icon: ShieldAlert,
      testTag: 'nav_tab_geofence',
    },
    {
      id: 'history' as ActiveTab,
      label: AppStrings.getNavHistory(currentLang),
      icon: Route,
      testTag: 'nav_tab_history',
    },
    {
      id: 'alerts' as ActiveTab,
      label: AppStrings.getNavAlerts(currentLang),
      icon: Bell,
      testTag: 'nav_tab_alerts',
      badge: unreadAlertsCount > 0 ? unreadAlertsCount : undefined,
    },
    {
      id: 'kids' as ActiveTab,
      label: AppStrings.getNavKids(currentLang),
      icon: Users,
      testTag: 'nav_tab_kids',
    },
    {
      id: 'settings' as ActiveTab,
      label: AppStrings.getNavSettings(currentLang),
      icon: Settings,
      testTag: 'nav_tab_settings',
    },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur border-t border-slate-800 px-2 py-1.5 sm:py-2">
      <div role="tablist" aria-label="Application sections" className="max-w-xl mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              aria-label={tab.badge ? `${tab.label} (${tab.badge} unread alerts)` : tab.label}
              onClick={() => onTabChange(tab.id)}
              data-testid={tab.testTag}
              className={`relative flex-1 min-w-0 flex flex-col items-center gap-0.5 px-1 py-1 sm:py-1.5 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'scale-110' : ''} transition-transform`} />
                {tab.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-2 px-1 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-bold min-w-3.5 text-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] sm:text-[11px] leading-tight text-center truncate max-w-full">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
