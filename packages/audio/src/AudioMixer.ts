import { AudioEngine } from './AudioEngine';

export interface TrackNodes {
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
  analyserNode: AnalyserNode;
}

export class AudioMixer {
  private static instance: AudioMixer;
  private trackNodes: Map<string, TrackNodes> = new Map();

  private constructor() {}

  public static getInstance(): AudioMixer {
    if (!AudioMixer.instance) {
      AudioMixer.instance = new AudioMixer();
    }
    return AudioMixer.instance;
  }

  public registerTrack(trackId: string) {
    const engine = AudioEngine.getInstance();
    const ctx = engine.getContext();
    const master = engine.getMasterNode();
    
    if (!ctx || !master || this.trackNodes.has(trackId)) return;

    const gainNode = ctx.createGain();
    const pannerNode = ctx.createStereoPanner();
    const analyserNode = ctx.createAnalyser();
    analyserNode.fftSize = 256;
    analyserNode.smoothingTimeConstant = 0.2;

    // Route: track -> gain -> panner -> analyser -> master
    gainNode.connect(pannerNode);
    pannerNode.connect(analyserNode);
    analyserNode.connect(master);

    this.trackNodes.set(trackId, { gainNode, pannerNode, analyserNode });
  }

  public unregisterTrack(trackId: string) {
    const nodes = this.trackNodes.get(trackId);
    if (nodes) {
      nodes.gainNode.disconnect();
      nodes.pannerNode.disconnect();
      nodes.analyserNode.disconnect();
      this.trackNodes.delete(trackId);
    }
  }

  public setTrackVolume(trackId: string, volume: number) {
    const nodes = this.trackNodes.get(trackId);
    const ctx = AudioEngine.getInstance().getContext();
    if (nodes && ctx) {
      nodes.gainNode.gain.setTargetAtTime(volume, ctx.currentTime, 0.05);
    }
  }

  public setTrackPan(trackId: string, pan: number) {
    const nodes = this.trackNodes.get(trackId);
    const ctx = AudioEngine.getInstance().getContext();
    if (nodes && ctx) {
      nodes.pannerNode.pan.setTargetAtTime(pan, ctx.currentTime, 0.05);
    }
  }

  public getTrackNode(trackId: string): GainNode | null {
    return this.trackNodes.get(trackId)?.gainNode || null;
  }

  public getTrackPeak(trackId: string): number {
    const nodes = this.trackNodes.get(trackId);
    if (!nodes) return 0;
    
    const dataArray = new Uint8Array(nodes.analyserNode.frequencyBinCount);
    nodes.analyserNode.getByteTimeDomainData(dataArray);
    
    let max = 0;
    for (let i = 0; i < dataArray.length; i++) {
      const val = Math.abs(dataArray[i] - 128);
      if (val > max) max = val;
    }
    
    return max / 128.0;
  }
}
