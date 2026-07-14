import { TexturePool } from './TexturePool';
import { FramePool } from './FramePool';
import { DeviceProfiler } from './DeviceProfiler';

export class GpuMemoryManager {
  private texturePool: TexturePool;
  private framePool: FramePool;
  private maxMemoryBytes: number;
  
  // Approximate tracking
  private estimatedVramUsage: number = 0;

  constructor(texturePool: TexturePool, framePool: FramePool) {
    this.texturePool = texturePool;
    this.framePool = framePool;
    
    // Default to 1GB if detection fails, otherwise use 50% of available RAM as a soft cap for VRAM
    this.maxMemoryBytes = 1024 * 1024 * 1024;
    DeviceProfiler.getProfile().then(profile => {
      // 1 GiB = 1024 * 1024 * 1024 bytes
      // Capping at 2GB for WebGL to be safe, regardless of system RAM, unless Ultra tier
      const cap = profile.tier === 'Ultra' ? 4 : 2;
      this.maxMemoryBytes = Math.min(profile.deviceMemoryGiB * 0.5, cap) * 1024 * 1024 * 1024;
    });
  }

  /**
   * Called every frame or tick to assess memory pressure and run eviction if needed.
   */
  tick() {
    this.updateEstimates();

    if (this.estimatedVramUsage > this.maxMemoryBytes * 0.8) {
      // High pressure: Evict aggressively (older than 1 second)
      this.evict(1000);
    } else if (this.estimatedVramUsage > this.maxMemoryBytes * 0.5) {
      // Moderate pressure (older than 3 seconds)
      this.evict(3000);
    } else {
      // Standard cleanup (older than 5 seconds)
      this.evict(5000);
    }
  }

  private evict(maxAgeMs: number) {
    const texEvicted = this.texturePool.evictStale(maxAgeMs);
    const fboEvicted = this.framePool.evictStale(maxAgeMs);
    
    if (texEvicted > 0 || fboEvicted > 0) {
       // Recalculate immediately after eviction
       this.updateEstimates();
    }
  }

  private updateEstimates() {
    // Rough estimate: RGBA 8-bit texture is width * height * 4 bytes
    // We assume an average of 1920x1080 for math, though we could track accurately if we iterate the pools
    
    const activeTex = this.texturePool.getActiveCount();
    const pooledTex = this.texturePool.getPooledCount();
    const activeFbo = this.framePool.getActiveCount();
    const pooledFbo = this.framePool.getPooledCount();

    const totalTextures = activeTex + pooledTex;
    // FBOs contain textures, but those textures are managed by the TexturePool, 
    // so we just count the TexturePool sizes to avoid double counting VRAM.
    
    const AVERAGE_TEX_BYTES = 1920 * 1080 * 4; // ~8MB
    this.estimatedVramUsage = totalTextures * AVERAGE_TEX_BYTES;
  }

  getStats() {
    return {
      estimatedVramBytes: this.estimatedVramUsage,
      maxMemoryBytes: this.maxMemoryBytes,
      pressure: this.estimatedVramUsage / this.maxMemoryBytes
    };
  }
}
