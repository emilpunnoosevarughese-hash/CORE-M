export class AudioEngine {
  private static instance: AudioEngine;
  private ctx: AudioContext | null = null;
  private isInitialized = false;

  private masterGain: GainNode | null = null;
  private masterAnalyser: AnalyserNode | null = null;

  private constructor() {}

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Must be called on a user gesture (e.g. clicking "Play" or interacting with the timeline).
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Standardize Web Audio API across browsers
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) {
      console.warn("Web Audio API is not supported in this browser");
      return;
    }

    this.ctx = new AudioContextClass({ latencyHint: 'interactive' });
    
    // Create Master Bus
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = 1.0;

    // Create Peak Analyser for the Master Bus
    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 256;
    this.masterAnalyser.smoothingTimeConstant = 0.2;

    // Route: MasterGain -> Analyser -> Destination
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);

    // If context is suspended (some browsers do this initially), try to resume
    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    this.isInitialized = true;
    console.log(`AudioEngine initialized: ${this.ctx.sampleRate}Hz`);
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterNode(): GainNode | null {
    return this.masterGain;
  }

  public setMasterVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      // Linear ramp to avoid clicks
      this.masterGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.05);
    }
  }

  public getMasterPeak(): number {
    if (!this.masterAnalyser) return 0;
    const dataArray = new Uint8Array(this.masterAnalyser.frequencyBinCount);
    this.masterAnalyser.getByteTimeDomainData(dataArray);
    
    let max = 0;
    for (let i = 0; i < dataArray.length; i++) {
      // value ranges from 0 to 255, center is 128
      const val = Math.abs(dataArray[i] - 128);
      if (val > max) max = val;
    }
    
    // Convert to 0.0 - 1.0 range
    return max / 128.0;
  }
}
