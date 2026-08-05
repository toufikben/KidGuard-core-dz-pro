import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, AlertTriangle, ShieldAlert, Battery, CheckCircle, Trash2, Clock, MapPin, Hand } from 'lucide-react';
import { AlertEvent, AppLanguageCode } from '../types';
import { AppStrings } from '../i18n/translations';

interface AlertsScreenProps {
  alerts: AlertEvent[];
  currentLang: AppLanguageCode;
  onMarkAllRead: () => void;
  onDeleteAlert: (id: number) => void;
}

interface SwipeableAlertCardProps {
  alert: AlertEvent;
  onDeleteAlert: (id: number) => void;
  getBadgeStyle: (type: AlertEvent['alertType']) => {
    bg: string;
    badgeBg: string;
    icon: React.ElementType;
  };
}

const SwipeableAlertCard: React.FC<SwipeableAlertCardProps> = ({ alert, onDeleteAlert, getBadgeStyle }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const style = getBadgeStyle(alert.alertType);
  const IconComp = style.icon;
  const timeStr = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = new Date(alert.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });

  const handleDragEnd = (_: unknown, info: { offset: { x: number }; velocity: { x: number } }) => {
    // Trigger delete if swiped left far enough or fast enough
    if (info.offset.x < -70 || info.velocity.x < -250) {
      setIsDeleting(true);
      setTimeout(() => {
        onDeleteAlert(alert.id);
      }, 200);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    setTimeout(() => {
      onDeleteAlert(alert.id);
    }, 200);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: isDeleting ? 0 : 1,
        y: 0,
        scale: isDeleting ? 0.9 : 1,
        x: isDeleting ? -250 : 0,
      }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative rounded-2xl overflow-hidden group touch-pan-y"
    >
      {/* Background delete reveal layer */}
      <div className="absolute inset-0 bg-gradient-to-r from-red-700 to-red-600 rounded-2xl flex items-center justify-end pr-5 text-white font-bold text-xs gap-2 select-none">
        <span className="text-[11px] uppercase tracking-wider opacity-90">Delete Alert</span>
        <Trash2 className="w-5 h-5 animate-pulse" />
      </div>

      {/* Foreground Draggable Card */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -110, right: 0 }}
        dragElastic={{ left: 0.2, right: 0 }}
        dragSnapToOrigin
        onDragEnd={handleDragEnd}
        className={`p-4 rounded-2xl border transition-all relative cursor-grab active:cursor-grabbing bg-slate-900 ${style.bg} ${
          !alert.isRead ? 'ring-1 ring-blue-500/50 shadow-lg' : ''
        }`}
      >
        {!alert.isRead && (
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-blue-500 animate-ping" />
        )}

        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-2xl ${style.badgeBg} shadow-sm shrink-0 mt-0.5`}>
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-extrabold text-white">{alert.title}</span>
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                  {alert.kidName}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{alert.message}</p>

              <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-2">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{dateStr}, {timeStr}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-slate-300">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span>({alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)})</span>
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            className="p-1.5 rounded-xl hover:bg-slate-800/80 text-slate-400 hover:text-red-400 transition-colors shrink-0"
            title="Delete Alert"
            data-testid={`delete_alert_${alert.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export const AlertsScreen: React.FC<AlertsScreenProps> = ({
  alerts,
  currentLang,
  onMarkAllRead,
  onDeleteAlert,
}) => {
  const getBadgeStyle = (type: AlertEvent['alertType']) => {
    switch (type) {
      case 'SOS':
        return {
          bg: 'bg-red-950/60 border-red-800 text-red-200',
          badgeBg: 'bg-red-600 text-white',
          icon: AlertTriangle,
        };
      case 'BREACH_OUT':
      case 'TAMPER_ALERT':
        return {
          bg: 'bg-amber-950/40 border-amber-800 text-amber-200',
          badgeBg: 'bg-amber-500 text-slate-950',
          icon: ShieldAlert,
        };
      case 'LOW_BATTERY':
        return {
          bg: 'bg-slate-900 border-slate-800 text-slate-200',
          badgeBg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
          icon: Battery,
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-800 text-slate-200',
          badgeBg: 'bg-blue-600 text-white',
          icon: Bell,
        };
    }
  };

  const unreadCount = alerts.filter((a) => !a.isRead).length;

  return (
    <div className="space-y-4 pb-20 max-w-4xl mx-auto px-4 pt-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-400" />
            <span>{AppStrings.getAlertsTitle(currentLang)}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Real-time emergency SOS alarms & geofence breaches.</span>
            {alerts.length > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-blue-400/90 font-medium">
                <Hand className="w-3 h-3" /> Swipe left to delete
              </span>
            )}
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            data-testid="mark_all_read_button"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow transition-colors"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            <span>{AppStrings.getMarkAllRead(currentLang)}</span>
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">{AppStrings.getNoAlerts(currentLang)}</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Your child is safely inside designated safe zone boundaries.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {alerts.map((alert) => (
              <SwipeableAlertCard
                key={alert.id}
                alert={alert}
                onDeleteAlert={onDeleteAlert}
                getBadgeStyle={getBadgeStyle}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

