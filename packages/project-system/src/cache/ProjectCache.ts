export class ProjectCache {
  // Simple LRU cache implementation for metadata and thumbnails
  private maxItems: number;
  private cache: Map<string, any> = new Map();

  constructor(maxItems: number = 1000) {
    this.maxItems = maxItems;
  }

  public get(key: string): any | undefined {
    const item = this.cache.get(key);
    if (item) {
      // Refresh LRU
      this.cache.delete(key);
      this.cache.set(key, item);
    }
    return item;
  }

  public set(key: string, value: any) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxItems) {
      // Evict oldest (first item in Map)
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }

  public clear() {
    this.cache.clear();
  }
}
