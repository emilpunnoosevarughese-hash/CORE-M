export type ConnectionTransport = 'webrtc' | 'websocket' | 'relay';

export class ConnectionManager {
  private static instance: ConnectionManager;
  private activeTransport: ConnectionTransport = 'websocket';
  
  private ws: WebSocket | null = null;
  private peerConnection: RTCPeerConnection | null = null;

  public onMessage: ((payload: any) => void) | null = null;
  public onConnectionStateChange: ((state: 'connected' | 'disconnected') => void) | null = null;

  private constructor() {}

  public static getInstance(): ConnectionManager {
    if (!ConnectionManager.instance) {
      ConnectionManager.instance = new ConnectionManager();
    }
    return ConnectionManager.instance;
  }

  public async initializeLocalWebSocket(port: number = 8080) {
    // In a real desktop environment (e.g. Electron/Tauri), this would spawn a local ws server.
    // In a pure web environment, we rely on a signaling relay to establish WebRTC directly.
    this.activeTransport = 'websocket';
    this.onConnectionStateChange?.('connected');
  }

  public sendCommand(payload: any) {
    if (this.activeTransport === 'websocket') {
      // Send via WS
    } else if (this.activeTransport === 'webrtc') {
      // Send via DataChannel
    }
  }

  public disconnect() {
    if (this.ws) this.ws.close();
    if (this.peerConnection) this.peerConnection.close();
    this.onConnectionStateChange?.('disconnected');
  }
}
