import type { PooledTexture } from './TexturePool';
import { TexturePool } from './TexturePool';

export interface PooledFrameBuffer {
  id: string;
  fbo: WebGLFramebuffer;
  texture: PooledTexture;
  width: number;
  height: number;
  lastUsed: number;
  refCount: number;
}

export class FramePool {
  private gl: WebGL2RenderingContext | WebGLRenderingContext;
  private texturePool: TexturePool;
  private pool: Map<string, PooledFrameBuffer[]> = new Map();
  private activeFbos: Set<PooledFrameBuffer> = new Set();

  constructor(gl: WebGL2RenderingContext | WebGLRenderingContext, texturePool: TexturePool) {
    this.gl = gl;
    this.texturePool = texturePool;
  }

  private getPoolKey(width: number, height: number): string {
    return `${width}x${height}`;
  }

  acquire(width: number, height: number): PooledFrameBuffer {
    const key = this.getPoolKey(width, height);
    let list = this.pool.get(key);
    
    if (!list) {
      list = [];
      this.pool.set(key, list);
    }

    let pooledFbo: PooledFrameBuffer;

    if (list.length > 0) {
      pooledFbo = list.pop()!;
      pooledFbo.refCount = 1;
      pooledFbo.lastUsed = performance.now();
    } else {
      // Create new Framebuffer
      const fbo = this.gl.createFramebuffer()!;
      // Acquire texture for attachment
      const tex = this.texturePool.acquire(width, height);
      
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, fbo);
      this.gl.framebufferTexture2D(this.gl.FRAMEBUFFER, this.gl.COLOR_ATTACHMENT0, this.gl.TEXTURE_2D, tex.texture, 0);

      // Verify status
      const status = this.gl.checkFramebufferStatus(this.gl.FRAMEBUFFER);
      if (status !== this.gl.FRAMEBUFFER_COMPLETE) {
        throw new Error(`Framebuffer incomplete: ${status}`);
      }

      pooledFbo = {
        id: Math.random().toString(36).substring(7),
        fbo,
        texture: tex,
        width,
        height,
        lastUsed: performance.now(),
        refCount: 1
      };
    }

    this.activeFbos.add(pooledFbo);
    return pooledFbo;
  }

  release(pooledFbo: PooledFrameBuffer) {
    pooledFbo.refCount--;
    if (pooledFbo.refCount <= 0) {
      pooledFbo.refCount = 0;
      this.activeFbos.delete(pooledFbo);
      
      const key = this.getPoolKey(pooledFbo.width, pooledFbo.height);
      const list = this.pool.get(key) || [];
      list.push(pooledFbo);
      this.pool.set(key, list);
    }
  }

  evictStale(maxAgeMs: number = 5000) {
    const now = performance.now();
    let evictedCount = 0;

    for (const [key, list] of this.pool.entries()) {
      const kept: PooledFrameBuffer[] = [];
      for (const fbo of list) {
        if (now - fbo.lastUsed > maxAgeMs) {
          this.gl.deleteFramebuffer(fbo.fbo);
          this.texturePool.release(fbo.texture);
          evictedCount++;
        } else {
          kept.push(fbo);
        }
      }
      this.pool.set(key, kept);
    }

    return evictedCount;
  }

  clear() {
    for (const list of this.pool.values()) {
      for (const fbo of list) {
        this.gl.deleteFramebuffer(fbo.fbo);
        this.texturePool.release(fbo.texture);
      }
    }
    this.pool.clear();
  }

  getActiveCount() {
    return this.activeFbos.size;
  }

  getPooledCount() {
    let count = 0;
    for (const list of this.pool.values()) count += list.length;
    return count;
  }
}
