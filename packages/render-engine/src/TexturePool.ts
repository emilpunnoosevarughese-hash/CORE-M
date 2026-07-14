export interface PooledTexture {
  id: string;
  texture: WebGLTexture;
  width: number;
  height: number;
  lastUsed: number;
  refCount: number;
  format: number;
  type: number;
}

export class TexturePool {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private pool: Map<string, PooledTexture[]> = new Map(); // Keyed by `${width}x${height}_${format}_${type}`
  private activeTextures: Set<PooledTexture> = new Set();
  
  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext) {
    this.gl = gl;
  }

  private getPoolKey(width: number, height: number, format: number, type: number): string {
    return `${width}x${height}_${format}_${type}`;
  }

  /**
   * Acquire a texture from the pool or create a new one if none available.
   */
  acquire(width: number, height: number, format: number = this.gl.RGBA, type: number = this.gl.UNSIGNED_BYTE): PooledTexture {
    const key = this.getPoolKey(width, height, format, type);
    let list = this.pool.get(key);
    
    if (!list) {
      list = [];
      this.pool.set(key, list);
    }

    let pooledTex: PooledTexture;
    
    if (list.length > 0) {
      pooledTex = list.pop()!;
      pooledTex.refCount = 1;
      pooledTex.lastUsed = performance.now();
    } else {
      // Create new texture
      const tex = this.gl.createTexture()!;
      this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
      
      // Default parameters
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
      this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);

      // Allocate memory
      this.gl.texImage2D(this.gl.TEXTURE_2D, 0, format, width, height, 0, format, type, null);
      
      pooledTex = {
        id: Math.random().toString(36).substring(7),
        texture: tex,
        width,
        height,
        lastUsed: performance.now(),
        refCount: 1,
        format,
        type
      };
    }

    this.activeTextures.add(pooledTex);
    return pooledTex;
  }

  /**
   * Release a texture back to the pool.
   */
  release(pooledTex: PooledTexture) {
    pooledTex.refCount--;
    if (pooledTex.refCount <= 0) {
      pooledTex.refCount = 0;
      this.activeTextures.delete(pooledTex);
      
      const key = this.getPoolKey(pooledTex.width, pooledTex.height, pooledTex.format, pooledTex.type);
      const list = this.pool.get(key) || [];
      list.push(pooledTex);
      this.pool.set(key, list);
    }
  }

  /**
   * Evict textures that haven't been used in a while (LRU cleanup).
   */
  evictStale(maxAgeMs: number = 5000) {
    const now = performance.now();
    let evictedCount = 0;
    
    for (const [key, list] of this.pool.entries()) {
      const kept: PooledTexture[] = [];
      for (const tex of list) {
        if (now - tex.lastUsed > maxAgeMs) {
          this.gl.deleteTexture(tex.texture);
          evictedCount++;
        } else {
          kept.push(tex);
        }
      }
      this.pool.set(key, kept);
    }
    
    return evictedCount;
  }

  /**
   * Clear all pooled textures.
   */
  clear() {
    for (const list of this.pool.values()) {
      for (const tex of list) {
        this.gl.deleteTexture(tex.texture);
      }
    }
    this.pool.clear();
    
    // Note: We don't delete active textures, they are still in use!
  }

  getActiveCount() {
    return this.activeTextures.size;
  }

  getPooledCount() {
    let count = 0;
    for (const list of this.pool.values()) count += list.length;
    return count;
  }
}
