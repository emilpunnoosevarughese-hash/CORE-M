export class CacheManager {
  private static cache = new Map<string, any>();
  private static lru = new Map<string, number>();
  private static maxItems = 1000;

  static setMaxItems(limit: number) {
    this.maxItems = limit;
    this.enforceLimit();
  }

  static get<T>(key: string): T | undefined {
    if (this.cache.has(key)) {
      this.lru.set(key, Date.now());
      return this.cache.get(key) as T;
    }
    return undefined;
  }

  static set<T>(key: string, value: T) {
    this.cache.set(key, value);
    this.lru.set(key, Date.now());
    this.enforceLimit();
  }

  static remove(key: string) {
    this.cache.delete(key);
    this.lru.delete(key);
  }

  static clear() {
    this.cache.clear();
    this.lru.clear();
  }

  private static enforceLimit() {
    if (this.cache.size <= this.maxItems) return;
    
    // Convert LRU map to array, sort by timestamp
    const sorted = Array.from(this.lru.entries()).sort((a, b) => a[1] - b[1]);
    
    // Remove oldest entries until we're under limit
    const toRemove = sorted.slice(0, this.cache.size - this.maxItems);
    for (const [key] of toRemove) {
      // If it's a bitmap, close it to free memory faster
      const item = this.cache.get(key);
      if (item && item instanceof ImageBitmap) {
        item.close();
      }
      this.cache.delete(key);
      this.lru.delete(key);
    }
  }
}
