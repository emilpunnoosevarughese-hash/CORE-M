import { SyncEngine } from '../sync/SyncEngine';

export class SyncScheduler {
  private static instance: SyncScheduler;
  
  // Dynamic sync interval based on NetworkProfiler
  private syncIntervalMs = 1000 / 10; // Default 10 times a second
  private timerId: any = null;
  private isPlaybackActive = false;

  private constructor() {}

  public static getInstance(): SyncScheduler {
    if (!SyncScheduler.instance) {
      SyncScheduler.instance = new SyncScheduler();
    }
    return SyncScheduler.instance;
  }

  public setPlaybackState(isPlaying: boolean) {
    this.isPlaybackActive = isPlaying;
  }

  public start() {
    if (this.timerId) clearInterval(this.timerId);
    
    // We use a robust polling loop for delta aggregation.
    // In reality, this might be tied to requestIdleCallback to guarantee zero playback interruption.
    this.timerId = setInterval(() => this.tick(), this.syncIntervalMs);
  }

  public stop() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private tick() {
    // If playback is very demanding, we can throttle the sync interval
    if (this.isPlaybackActive) {
      // Throttle delta flush to avoid stressing the UI thread during playback
      return;
    }

    SyncEngine.getInstance().performDeltaSync();
  }
}
