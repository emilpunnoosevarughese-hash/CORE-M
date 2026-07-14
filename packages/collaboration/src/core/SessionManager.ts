import { SyncEngine } from '../sync/SyncEngine';
import { TransportManager } from '../network/TransportManager';
import { PresenceManager } from '../presence/PresenceManager';

export class SessionManager {
  private static instance: SessionManager;
  private isConnected = false;
  private sessionId: string | null = null;

  private constructor() {}

  public static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  public joinSession(url: string, token: string) {
    const transport = TransportManager.getInstance();
    
    transport.connect({
      wsUrl: `${url}?token=${token}`
    });

    transport.onConnectionStateChange = (state) => {
      this.isConnected = state === 'connected';
      // When connected, OfflineQueue usually flushes to SyncEngine
    };
  }

  public leaveSession() {
    TransportManager.getInstance().disconnect();
    this.isConnected = false;
    this.sessionId = null;
  }

  public getIsConnected(): boolean {
    return this.isConnected;
  }
}
