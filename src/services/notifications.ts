// Browser Native Web Push Notification Manager with Anti-Flooding & Notification ID Tracking

export interface SentNotificationLog {
  notificationId: string;
  title: string;
  body: string;
  timestamp: number;
  tag: string;
}

export class NotificationService {
  private static lastSentMap = new Map<string, { body: string; timestamp: number }>();
  private static sentLogs: SentNotificationLog[] = [];
  private static defaultCooldownMs = 5000; // 5-second cooldown for identical notification tag

  public static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.warn('This browser does not support desktop notifications.');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  /**
   * Sends desktop notification with anti-flooding duplicate prevention,
   * notification ID / tag tracking, and internal log history.
   */
  public static sendAlertNotification(
    title: string,
    body: string,
    notificationId?: string,
    icon = 'pwa-192x192.png',
    cooldownMs = NotificationService.defaultCooldownMs
  ): string | null {
    const hasWindowNotif = typeof window !== 'undefined' && 'Notification' in window;

    const tag = notificationId || title.replace(/[\s\W]+/g, '_').toLowerCase();
    const now = Date.now();

    // Prevent notification flooding if same tag & body sent within cooldown window
    const lastSent = this.lastSentMap.get(tag);
    if (lastSent && lastSent.body === body && now - lastSent.timestamp < cooldownMs) {
      return null;
    }

    this.lastSentMap.set(tag, { body, timestamp: now });

    const generatedId = `${tag}_${now}`;
    const logEntry: SentNotificationLog = {
      notificationId: generatedId,
      title,
      body,
      timestamp: now,
      tag,
    };

    this.sentLogs.unshift(logEntry);
    if (this.sentLogs.length > 50) {
      this.sentLogs.pop();
    }

    if (hasWindowNotif && Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          badge: icon,
          tag, // Browser replaces duplicate popups sharing the same tag
          vibrate: [200, 100, 200, 100, 200],
          requireInteraction: true,
        } as NotificationOptions);

        notif.onclick = () => {
          window.focus();
          notif.close();
        };
      } catch (e) {
        console.warn('Notification send failed:', e);
      }
    }

    return generatedId;
  }

  public static getSentLogs(): SentNotificationLog[] {
    return [...this.sentLogs];
  }

  public static clearHistory(): void {
    this.lastSentMap.clear();
    this.sentLogs = [];
  }
}

