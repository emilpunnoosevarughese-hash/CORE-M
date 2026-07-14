import { PacketSerializer, SyncPacket, PacketType } from './PacketSerializer';

export interface TransportConfig {
  wsUrl: string;
  iceServers?: RTCIceServer[];
}

export class TransportManager {
  private static instance: TransportManager;
  
  private ws: WebSocket | null = null;
  private dataChannel: RTCDataChannel | null = null;
  private rtcConnection: RTCPeerConnection | null = null;

  public onMessage: ((packet: SyncPacket) => void) | null = null;
  public onConnectionStateChange: ((state: 'connected' | 'disconnected' | 'reconnecting') => void) | null = null;

  private isConnected = false;
  private config!: TransportConfig;

  private constructor() {}

  public static getInstance(): TransportManager {
    if (!TransportManager.instance) {
      TransportManager.instance = new TransportManager();
    }
    return TransportManager.instance;
  }

  public connect(config: TransportConfig) {
    this.config = config;
    this.initializeWebSocket();
  }

  private initializeWebSocket() {
    try {
      this.ws = new WebSocket(this.config.wsUrl);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        this.isConnected = true;
        this.onConnectionStateChange?.('connected');
        // Upon WS success, we could attempt WebRTC DataChannel upgrade here
      };

      this.ws.onmessage = (event) => {
        if (event.data instanceof ArrayBuffer) {
          const packet = PacketSerializer.deserialize(event.data);
          this.onMessage?.(packet);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.onConnectionStateChange?.('disconnected');
        // HTTP Polling fallback logic would be triggered here in a complete implementation
      };
    } catch (e) {
      console.error('WebSocket connection failed:', e);
    }
  }

  public send(packet: SyncPacket) {
    const buffer = PacketSerializer.serialize(packet);
    
    // Prefer WebRTC DataChannel if open (lowest latency)
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(buffer);
    } 
    // Fallback to WebSocket
    else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(buffer);
    } 
    // If no transport is available, it should be caught by MessageQueue
    else {
      throw new Error('No active transport layer available');
    }
  }

  public disconnect() {
    if (this.dataChannel) this.dataChannel.close();
    if (this.rtcConnection) this.rtcConnection.close();
    if (this.ws) this.ws.close();
  }
}
