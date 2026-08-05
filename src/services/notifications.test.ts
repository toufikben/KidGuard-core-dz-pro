import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from './notifications';

describe('NotificationService', () => {
  beforeEach(() => {
    NotificationService.clearHistory();
    vi.restoreAllMocks();
  });

  it('generates notification ID and tracks sent logs', () => {
    const id = NotificationService.sendAlertNotification('Test Alert', 'Test Body', 'test_notif_1');
    expect(id).toBeDefined();
    expect(id).toContain('test_notif_1');

    const logs = NotificationService.getSentLogs();
    expect(logs.length).toBe(1);
    expect(logs[0].title).toBe('Test Alert');
    expect(logs[0].tag).toBe('test_notif_1');
  });

  it('prevents notification flooding for duplicate events within cooldown', () => {
    const id1 = NotificationService.sendAlertNotification('Geofence Alert', 'Child left safe zone', 'geofence_breach_out');
    expect(id1).not.toBeNull();

    // Immediate duplicate call with same tag and body
    const id2 = NotificationService.sendAlertNotification('Geofence Alert', 'Child left safe zone', 'geofence_breach_out');
    expect(id2).toBeNull(); // Suppressed due to anti-flooding

    expect(NotificationService.getSentLogs().length).toBe(1);
  });

  it('allows new notification when content or tag changes', () => {
    NotificationService.sendAlertNotification('Geofence Alert', 'Child left safe zone', 'tag_1');
    const id2 = NotificationService.sendAlertNotification('Low Battery', 'Battery at 10%', 'tag_2');

    expect(id2).not.toBeNull();
    expect(NotificationService.getSentLogs().length).toBe(2);
  });
});
