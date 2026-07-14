export type DeviceTier = 'very_low' | 'low' | 'medium' | 'high' | 'ultra';

export interface HardwareProfile {
  tier: DeviceTier;
  maxVideoDecoders: number;
  maxAudioDecoders: number;
  memoryLimitMB: number;
  cpuCores: number;
  maxTextureCacheSize: number;
  maxFrameCacheSize: number;
  isMemoryConstrained: boolean;
}

export class HardwareProfiler {
  private static profile: HardwareProfile | null = null;
  private static subscribers = new Set<(profile: HardwareProfile) => void>();

  static init() {
    if (this.profile) return;
    this.profile = this.evaluateHardware();
    
    // Periodically monitor memory pressure if supported
    if ('memory' in performance) {
      setInterval(() => this.checkMemoryPressure(), 5000);
    }
  }

  static getProfile(): HardwareProfile {
    if (!this.profile) this.init();
    return this.profile!;
  }

  static subscribe(callback: (profile: HardwareProfile) => void) {
    this.subscribers.add(callback);
    if (this.profile) callback(this.profile);
    return () => this.subscribers.delete(callback);
  }

  private static notify() {
    if (this.profile) {
      this.subscribers.forEach(cb => cb(this.profile!));
    }
  }

  private static evaluateHardware(): HardwareProfile {
    let cores = 4;
    if (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) {
      cores = navigator.hardwareConcurrency;
    }

    let memoryGB = 4;
    // @ts-ignore
    if (typeof navigator !== 'undefined' && navigator.deviceMemory) {
      // @ts-ignore
      memoryGB = navigator.deviceMemory;
    }

    let tier: DeviceTier = 'medium';
    let maxVideo = 8;
    let maxAudio = 16;
    let memoryLimitMB = 512;
    let maxTextureCacheSize = 256;
    let maxFrameCacheSize = 30;

    if (cores <= 2 && memoryGB <= 2) {
      tier = 'very_low';
      maxVideo = 2;
      maxAudio = 4;
      memoryLimitMB = 128;
      maxTextureCacheSize = 64;
      maxFrameCacheSize = 5;
    } else if (cores <= 4 && memoryGB <= 4) {
      tier = 'low';
      maxVideo = 4;
      maxAudio = 8;
      memoryLimitMB = 256;
      maxTextureCacheSize = 128;
      maxFrameCacheSize = 15;
    } else if (cores >= 12 && memoryGB >= 16) {
      tier = 'ultra';
      maxVideo = 32;
      maxAudio = 64;
      memoryLimitMB = 4096;
      maxTextureCacheSize = 1024;
      maxFrameCacheSize = 120;
    } else if (cores >= 8 && memoryGB >= 8) {
      tier = 'high';
      maxVideo = 16;
      maxAudio = 32;
      memoryLimitMB = 2048;
      maxTextureCacheSize = 512;
      maxFrameCacheSize = 60;
    } else {
      tier = 'medium';
      maxVideo = 8;
      maxAudio = 16;
      memoryLimitMB = 512;
      maxTextureCacheSize = 256;
      maxFrameCacheSize = 30;
    }

    return {
      tier,
      maxVideoDecoders: maxVideo,
      maxAudioDecoders: maxAudio,
      memoryLimitMB,
      cpuCores: cores,
      maxTextureCacheSize,
      maxFrameCacheSize,
      isMemoryConstrained: false
    };
  }

  private static checkMemoryPressure() {
    if (!this.profile) return;
    const mem = (performance as any).memory;
    if (mem && mem.usedJSHeapSize) {
      const usedMB = mem.usedJSHeapSize / (1024 * 1024);
      const isConstrained = usedMB > (this.profile.memoryLimitMB * 0.8); // 80% threshold
      
      if (isConstrained !== this.profile.isMemoryConstrained) {
        this.profile.isMemoryConstrained = isConstrained;
        
        // Dynamically scale down decoders on pressure
        if (isConstrained) {
          this.profile.maxVideoDecoders = Math.max(2, Math.floor(this.profile.maxVideoDecoders * 0.5));
          this.profile.maxAudioDecoders = Math.max(4, Math.floor(this.profile.maxAudioDecoders * 0.5));
        } else {
          // Restore
          const base = this.evaluateHardware();
          this.profile.maxVideoDecoders = base.maxVideoDecoders;
          this.profile.maxAudioDecoders = base.maxAudioDecoders;
        }
        
        this.notify();
      }
    }
  }
}
