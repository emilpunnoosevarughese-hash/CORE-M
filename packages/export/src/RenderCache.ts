export class RenderCache {
  private static instance: RenderCache;
  // Key: frame hash, Value: cache timestamp
  private cacheMap: Map<string, number> = new Map();
  // We mock the actual ImageData/WebGLTexture cache here since it requires complex memory management
  
  private constructor() {}

  public static getInstance(): RenderCache {
    if (!RenderCache.instance) {
      RenderCache.instance = new RenderCache();
    }
    return RenderCache.instance;
  }

  public getCachedFrame(hash: string): boolean {
    if (this.cacheMap.has(hash)) {
      this.cacheMap.set(hash, Date.now()); // Update LRU timestamp
      return true;
    }
    return false;
  }

  public setCachedFrame(hash: string) {
    this.cacheMap.set(hash, Date.now());
    this.enforceMemoryLimit();
  }

  private enforceMemoryLimit() {
    // In a real app we'd track actual VRAM/RAM bytes
    // For now we assume max 1000 frames cached
    if (this.cacheMap.size > 1000) {
      const sortedKeys = Array.from(this.cacheMap.entries())
        .sort((a, b) => a[1] - b[1]); // Oldest first
      
      const numToRemove = this.cacheMap.size - 1000;
      for (let i = 0; i < numToRemove; i++) {
        this.cacheMap.delete(sortedKeys[i][0]);
      }
    }
  }

  public clearCache() {
    this.cacheMap.clear();
  }
}
