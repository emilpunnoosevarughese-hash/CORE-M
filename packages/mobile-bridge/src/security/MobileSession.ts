import { DeviceManager } from './DeviceManager';

export class MobileSession {
  private static activeControllerId: string | null = null;

  /**
   * Only one device can have active control privileges at a time
   * unless collaborative control is explicitly enabled.
   */
  public static requestControl(deviceId: string): boolean {
    const dm = DeviceManager.getInstance();
    if (!dm.isTrusted(deviceId)) return false;

    if (this.activeControllerId === null || this.activeControllerId === deviceId) {
      this.activeControllerId = deviceId;
      return true;
    }
    
    // Someone else has control
    return false;
  }

  public static releaseControl(deviceId: string) {
    if (this.activeControllerId === deviceId) {
      this.activeControllerId = null;
    }
  }

  public static hasControl(deviceId: string): boolean {
    return this.activeControllerId === deviceId;
  }
}
