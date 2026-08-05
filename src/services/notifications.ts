// Browser Native Web Push Notification Manager
export class NotificationService {
  public static async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
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

  public static sendAlertNotification(title: string, body: string, icon = 'pwa-192x192.png') {
    if (!('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon,
          badge: icon,
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
  }
}
