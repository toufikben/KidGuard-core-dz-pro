import { Device } from '@capacitor/device';
import { Capacitor } from '@capacitor/core';

export class BatteryService {
  private static pollInterval: any = null;

  /**
   * Fetch the current real battery level (0 - 100).
   */
  public static async getRealBatteryLevel(): Promise<number | null> {
    try {
      if (Capacitor.isNativePlatform()) {
        const info = await Device.getBatteryInfo();
        if (info && typeof info.batteryLevel === 'number') {
          // info.batteryLevel is usually between 0.0 and 1.0, or integer percentage
          const level = info.batteryLevel <= 1 ? Math.round(info.batteryLevel * 100) : Math.round(info.batteryLevel);
          return Math.max(0, Math.min(100, level));
        }
      }

      // Fallback for web browser environment using Battery Status API
      if ('getBattery' in navigator) {
        const battery: any = await (navigator as any).getBattery();
        if (battery && typeof battery.level === 'number') {
          return Math.round(battery.level * 100);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch real device battery level:', err);
    }
    return null;
  }

  /**
   * Start periodic real battery monitoring.
   */
  public static startMonitoring(onBatteryUpdate: (level: number) => void, intervalMs: number = 30000): () => void {
    // Initial fetch
    this.getRealBatteryLevel().then((level) => {
      if (level !== null) {
        onBatteryUpdate(level);
      }
    });

    // Setup polling interval
    this.pollInterval = setInterval(async () => {
      const level = await this.getRealBatteryLevel();
      if (level !== null) {
        onBatteryUpdate(level);
      }
    }, intervalMs);

    // Return cleanup function
    return () => {
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }
    };
  }
}
