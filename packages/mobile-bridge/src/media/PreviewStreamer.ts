import { ConnectionManager } from '../network/ConnectionManager';

export class PreviewStreamer {
  private static instance: PreviewStreamer;
  
  private targetCanvas: HTMLCanvasElement | null = null;
  private mediaStream: MediaStream | null = null;
  private peerConnection: RTCPeerConnection | null = null;

  private isFallbackMode = false;
  private fallbackInterval: any = null;

  private constructor() {}

  public static getInstance(): PreviewStreamer {
    if (!PreviewStreamer.instance) {
      PreviewStreamer.instance = new PreviewStreamer();
    }
    return PreviewStreamer.instance;
  }

  /**
   * Binds the live editor canvas to the streaming engine.
   */
  public attachCanvas(canvas: HTMLCanvasElement) {
    this.targetCanvas = canvas;
  }

  public async startWebRTCStreaming(remoteOffer: RTCSessionDescriptionInit) {
    if (!this.targetCanvas) throw new Error('No canvas attached');

    try {
      // Primary: WebRTC Hardware Encoded Stream
      this.mediaStream = this.targetCanvas.captureStream(30); // 30 FPS target for mobile
      
      this.peerConnection = new RTCPeerConnection();
      
      // Add tracks to connection
      this.mediaStream.getTracks().forEach(track => {
        if (this.peerConnection && this.mediaStream) {
          this.peerConnection.addTrack(track, this.mediaStream);
        }
      });

      await this.peerConnection.setRemoteDescription(remoteOffer);
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // In real implementation, send `answer` back via WebSocket signaling
    } catch (e) {
      console.warn('WebRTC streaming failed, engaging WebSocket fallback', e);
      this.startFallbackStreaming();
    }
  }

  /**
   * Fallback for older devices/browsers that don't support captureStream WebRTC efficiently.
   * Compresses the frame to JPEG and sends via WebSocket.
   */
  private startFallbackStreaming() {
    this.isFallbackMode = true;
    const connection = ConnectionManager.getInstance();

    this.fallbackInterval = setInterval(() => {
      if (this.targetCanvas) {
        // High compression, low resolution to maintain sub-100ms latency
        const dataUrl = this.targetCanvas.toDataURL('image/jpeg', 0.5);
        connection.sendCommand({ type: 'preview_frame', data: dataUrl });
      }
    }, 1000 / 15); // 15 FPS fallback
  }

  public stopStreaming() {
    if (this.peerConnection) this.peerConnection.close();
    if (this.fallbackInterval) clearInterval(this.fallbackInterval);
    this.isFallbackMode = false;
  }
}
