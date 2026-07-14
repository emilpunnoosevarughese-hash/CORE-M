import { ConnectionManager } from '../network/ConnectionManager';

export type NotificationType = 
  | 'export_complete'
  | 'export_failed'
  | 'render_finished'
  | 'project_shared'
  | 'collaboration_invite'
  | 'new_comment'
  | 'asset_uploaded'
  | 'autosave_complete'
  | 'recovery_available';

export class NotificationBridge {
  private static instance: NotificationBridge;
  private connection = ConnectionManager.getInstance();

  private constructor() {}

  public static getInstance(): NotificationBridge {
    if (!NotificationBridge.instance) {
      NotificationBridge.instance = new NotificationBridge();
    }
    return NotificationBridge.instance;
  }

  /**
   * Dispatches a push notification payload to the connected mobile device.
   * This ties into the host application's EventBus to listen for system-wide events asynchronously.
   */
  public pushNotification(type: NotificationType, title: string, message: string, metadata?: any) {
    this.connection.sendCommand({
      type: 'notification',
      payload: {
        id: crypto.randomUUID(),
        type,
        title,
        message,
        timestamp: Date.now(),
        metadata
      }
    });
  }
}
