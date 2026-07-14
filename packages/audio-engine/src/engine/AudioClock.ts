export class AudioClock {
  private static instance: AudioClock;
  private audioContext: BaseAudioContext | null = null;
  private startTime: number = 0;
  private pausedTime: number = 0;
  private isPlaying: boolean = false;

  private constructor() {}

  public static getInstance(): AudioClock {
    if (!AudioClock.instance) {
      AudioClock.instance = new AudioClock();
    }
    return AudioClock.instance;
  }

  public setContext(context: BaseAudioContext) {
    this.audioContext = context;
  }

  public start(localTimeOffset: number = 0) {
    if (!this.audioContext) return;
    this.isPlaying = true;
    this.startTime = this.audioContext.currentTime - localTimeOffset;
  }

  public stop() {
    if (!this.audioContext) return;
    this.isPlaying = false;
    this.pausedTime = this.audioContext.currentTime - this.startTime;
  }

  public seek(localTimeOffset: number) {
    if (!this.audioContext) return;
    this.pausedTime = localTimeOffset;
    if (this.isPlaying) {
      this.startTime = this.audioContext.currentTime - localTimeOffset;
    }
  }

  /**
   * Returns the exact playback time based on the Web Audio API hardware clock.
   * This is the absolute master clock for all timeline and video synchronization.
   */
  public getCurrentTime(): number {
    if (!this.audioContext) return 0;
    if (this.isPlaying) {
      return this.audioContext.currentTime - this.startTime;
    }
    return this.pausedTime;
  }
}
