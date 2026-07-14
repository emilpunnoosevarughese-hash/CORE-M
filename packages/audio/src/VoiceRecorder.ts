import { AudioEngine } from './AudioEngine';

export class VoiceRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  
  // Real-time monitoring
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;

  public async requestPermissions(): Promise<boolean> {
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      return true;
    } catch (e) {
      console.error("Microphone access denied", e);
      return false;
    }
  }

  public startRecording() {
    if (!this.stream) return;
    
    this.chunks = [];
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType: 'audio/webm' });

    this.mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        this.chunks.push(e.data);
      }
    };

    this.mediaRecorder.start(100); // 100ms chunks

    // Set up monitoring
    const ctx = AudioEngine.getInstance().getContext();
    if (ctx) {
      this.sourceNode = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 256;
      this.sourceNode.connect(this.analyser);
      // NOTE: We do NOT connect to ctx.destination to avoid feedback loops!
    }
  }

  public stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob());
        return;
      }

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.chunks, { type: 'audio/webm' });
        this.chunks = [];
        resolve(blob);
      };

      this.mediaRecorder.stop();
      
      // Cleanup monitoring
      if (this.sourceNode) {
        this.sourceNode.disconnect();
        this.sourceNode = null;
      }
      if (this.analyser) {
        this.analyser.disconnect();
        this.analyser = null;
      }
    });
  }

  public getLivePeak(): number {
    if (!this.analyser) return 0;
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteTimeDomainData(dataArray);
    
    let max = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = Math.abs(dataArray[i] - 128);
      if (val > max) max = val;
    }
    
    return max / 128.0;
  }
}
