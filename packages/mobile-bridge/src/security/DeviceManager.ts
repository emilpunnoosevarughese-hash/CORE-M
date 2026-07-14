export interface TrustedDevice {
  id: string;
  name: string;
  lastConnected: number;
}

export class DeviceManager {
  private static instance: DeviceManager;
  private trustedDevices: Map<string, TrustedDevice> = new Map();

  private constructor() {}

  public static getInstance(): DeviceManager {
    if (!DeviceManager.instance) {
      DeviceManager.instance = new DeviceManager();
    }
    return DeviceManager.instance;
  }

  public registerDevice(id: string, name: string) {
    this.trustedDevices.set(id, {
      id,
      name,
      lastConnected: Date.now()
    });
  }

  public isTrusted(id: string): boolean {
    return this.trustedDevices.has(id);
  }

  public revokeDevice(id: string) {
    this.trustedDevices.delete(id);
  }

  public getTrustedDevices(): TrustedDevice[] {
    return Array.from(this.trustedDevices.values());
  }
}
