import { ConnectionManager } from '../network/ConnectionManager';

export class SyncBridge {
  private static instance: SyncBridge;
  private connectionManager = ConnectionManager.getInstance();

  private constructor() {}

  public static getInstance(): SyncBridge {
    if (!SyncBridge.instance) {
      SyncBridge.instance = new SyncBridge();
    }
    return SyncBridge.instance;
  }

  /**
   * Pushes exact timecode updates from the host to the mobile device.
   * This operates asynchronously and doesn't impact the main AudioClock.
   */
  public syncTimecode(timeSeconds: number, frame: number) {
    this.connectionManager.sendCommand({
      type: 'sync_timecode',
      timeSeconds,
      frame
    });
  }

  /**
   * Streams low-res vector arrays for rendering Scopes (Waveform/Vectorscope) natively on the mobile device GPU.
   */
  public syncScopes(waveformLumaArray: Uint8Array) {
    this.connectionManager.sendCommand({
      type: 'sync_scopes',
      waveform: Array.from(waveformLumaArray) // Over WS, we serialize array
    });
  }
}
