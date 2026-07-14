import { AudioClock } from './AudioClock';

export class AudioEngine {
  private static instance: AudioEngine;
  private context: AudioContext | OfflineAudioContext | null = null;
  private clock: AudioClock = AudioClock.getInstance();
  private isInitialized: boolean = false;

  private constructor() {
    this.attachInteractionListeners();
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Automatically initializes or resumes the AudioContext on first user interaction,
   * satisfying browser autoplay policies without an explicit startup screen.
   */
  private attachInteractionListeners() {
    if (typeof window === 'undefined') return;

    const handleInteraction = () => {
      if (!this.isInitialized) {
        this.initializeOnlineContext();
      } else if (this.context && this.context.state === 'suspended') {
        (this.context as AudioContext).resume();
      }
      
      // We keep the listeners active to catch subsequent suspensions (e.g. tab backgrounding)
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('pointerdown', handleInteraction, { passive: true });
    window.addEventListener('keydown', handleInteraction, { passive: true });
  }

  private initializeOnlineContext() {
    try {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)({
        latencyHint: 'interactive',
        sampleRate: 48000 // Professional standard
      });
      this.clock.setContext(this.context);
      this.isInitialized = true;
      console.log(`AudioEngine initialized: ${this.context.sampleRate}Hz`);
    } catch (e) {
      console.error('Failed to initialize AudioContext', e);
    }
  }

  /**
   * Creates an OfflineAudioContext for rendering exports.
   * This ensures the export path uses the exact same node graph.
   */
  public createOfflineContext(channels: number, lengthFrames: number, sampleRate: number = 48000): OfflineAudioContext {
    return new OfflineAudioContext(channels, lengthFrames, sampleRate);
  }

  public getContext(): BaseAudioContext {
    if (!this.context) {
      this.initializeOnlineContext();
    }
    return this.context!;
  }
}
