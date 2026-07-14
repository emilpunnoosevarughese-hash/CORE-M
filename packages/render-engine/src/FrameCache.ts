import type { PooledTexture } from './TexturePool';

export interface CacheEntry {
  hash: string;
  texture: PooledTexture;
  timestamp: number;
}

/**
 * High-level smart rendering cache.
 * Instead of re-rendering static nodes (like text that hasn't changed or clips with no movement),
 * the Compositor pulls directly from this cache based on a hash.
 */
export class FrameCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxEntries: number = 50;

  get(hash: string): PooledTexture | null {
    const entry = this.cache.get(hash);
    if (entry) {
      entry.timestamp = performance.now();
      return entry.texture;
    }
    return null;
  }

  set(hash: string, texture: PooledTexture) {
    // Increase ref count to hold onto the texture
    texture.refCount++;
    this.cache.set(hash, { hash, texture, timestamp: performance.now() });

    if (this.cache.size > this.maxEntries) {
      this.evictOldest();
    }
  }

  private evictOldest() {
    let oldestHash: string | null = null;
    let oldestTime = Infinity;

    for (const [hash, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTime) {
        oldestTime = entry.timestamp;
        oldestHash = hash;
      }
    }

    if (oldestHash) {
      const entry = this.cache.get(oldestHash)!;
      // We don't delete the texture from the GPU, we just release our hold on it
      // so the TexturePool can recycle it if refCount drops to 0.
      entry.texture.refCount--;
      this.cache.delete(oldestHash);
    }
  }

  clear() {
    for (const entry of this.cache.values()) {
      entry.texture.refCount--;
    }
    this.cache.clear();
  }
}
