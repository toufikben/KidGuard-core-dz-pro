import { Geolocation } from '@capacitor/geolocation';
import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';

export interface PermissionStatus {
  location: boolean;
  microphone: boolean;
  camera: boolean;
}

export class PermissionService {
  /**
   * Request Location permission from user at runtime
   */
  static async requestLocationPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Geolocation.requestPermissions();
        return perm.location === 'granted' || perm.coarseLocation === 'granted';
      } else {
        // Web fallback
        return new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve(false);
            return;
          }
          navigator.geolocation.getCurrentPosition(
            () => resolve(true),
            () => resolve(false),
            { timeout: 5000 }
          );
        });
      }
    } catch (e) {
      console.warn('Location permission request failed:', e);
      return false;
    }
  }

  /**
   * Request Microphone / Audio Recording permission at runtime
   */
  static async requestMicrophonePermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        // Native audio recording permission prompt via mediaDevices
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          stream.getTracks().forEach((track) => track.stop());
          return true;
        }
        return true;
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return false;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
    } catch (e) {
      console.warn('Microphone permission denied or failed:', e);
      return false;
    }
  }

  /**
   * Request Camera permission at runtime
   */
  static async requestCameraPermission(): Promise<boolean> {
    try {
      if (Capacitor.isNativePlatform()) {
        const perm = await Camera.requestPermissions();
        return perm.camera === 'granted';
      } else {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          return false;
        }
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        stream.getTracks().forEach((track) => track.stop());
        return true;
      }
    } catch (e) {
      console.warn('Camera permission request failed:', e);
      return false;
    }
  }

  /**
   * Request all essential permissions with user confirmation prompt
   */
  static async requestAllPermissions(): Promise<PermissionStatus> {
    const location = await this.requestLocationPermission();
    const microphone = await this.requestMicrophonePermission();
    const camera = await this.requestCameraPermission();

    return {
      location,
      microphone,
      camera,
    };
  }
}
