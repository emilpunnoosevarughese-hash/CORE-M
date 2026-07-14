import { HardwareProfiler } from './HardwareProfiler';

export interface PoolElement<T> {
  id: string;
  element: T;
  lastUsed: number;
  priority: number;
  inUse: boolean;
}

export class MediaPool {
  private static videoElements: Map<string, PoolElement<HTMLVideoElement>> = new Map();
  private static audioElements: Map<string, PoolElement<HTMLAudioElement>> = new Map();
  
  static init() {
    HardwareProfiler.init();
    
    // Listen to hardware profile changes (e.g. memory pressure scaling)
    HardwareProfiler.subscribe(() => {
      this.enforceLimits();
    });
  }

  static acquireVideo(assetId: string, sourceUrl: string, priority: number = 0): HTMLVideoElement | null {
    const profile = HardwareProfiler.getProfile();
    const now = Date.now();

    // Check if we already have it
    let record = this.videoElements.get(assetId);
    if (record) {
      record.lastUsed = now;
      record.priority = priority;
      record.inUse = true;
      if (record.element.src !== sourceUrl) {
        record.element.src = sourceUrl;
        record.element.load();
      }
      return record.element;
    }

    // Check if we are at limit
    if (this.videoElements.size >= profile.maxVideoDecoders) {
      // Find lowest priority element to evict
      let lowestPri = Infinity;
      let oldestUsed = Infinity;
      let victimId: string | null = null;
      
      for (const [id, r] of this.videoElements.entries()) {
        if (!r.inUse) {
          if (r.priority < lowestPri || (r.priority === lowestPri && r.lastUsed < oldestUsed)) {
            lowestPri = r.priority;
            oldestUsed = r.lastUsed;
            victimId = id;
          }
        }
      }

      // If all elements are in use, we must force evict the lowest priority if it's strictly lower than the requested priority
      if (!victimId) {
        for (const [id, r] of this.videoElements.entries()) {
          if (r.priority < priority) {
            if (r.priority < lowestPri || (r.priority === lowestPri && r.lastUsed < oldestUsed)) {
              lowestPri = r.priority;
              oldestUsed = r.lastUsed;
              victimId = id;
            }
          }
        }
      }
      
      if (victimId) {
        const victim = this.videoElements.get(victimId)!;
        victim.element.pause();
        victim.element.removeAttribute('src');
        victim.element.load(); // flush
        this.videoElements.delete(victimId);
      } else {
        // Cannot acquire decoder budget
        return null;
      }
    }

    // Create new
    const video = document.createElement('video');
    video.id = `corem-vid-${assetId}`;
    if (sourceUrl.startsWith('http') && !sourceUrl.startsWith('blob:')) {
      video.crossOrigin = 'anonymous';
    }
    video.src = sourceUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    // Do not use display: 'none', as some browsers optimize out hardware video decoding 
    // for hidden elements, resulting in black frames during createImageBitmap/drawImage.
    video.style.position = 'absolute';
    video.style.opacity = '0.001';
    video.style.pointerEvents = 'none';
    video.style.zIndex = '-1000';
    video.style.width = '1px';
    video.style.height = '1px';
    video.onerror = () => {
      console.error(`MediaPool: Failed to load video asset ${assetId} from ${sourceUrl}`, video.error);
      video.dataset.error = 'true';
      // Dispatch a global event to trigger proxy generation prompt
      window.dispatchEvent(new CustomEvent('corem-media-error', { detail: { assetId, sourceUrl } }));
    };
    document.body.appendChild(video);
    
    this.videoElements.set(assetId, {
      id: assetId,
      element: video,
      lastUsed: now,
      priority,
      inUse: true
    });
    
    return video;
  }

  static acquireAudio(assetId: string, sourceUrl: string, priority: number = 0): HTMLAudioElement | null {
    const profile = HardwareProfiler.getProfile();
    const now = Date.now();

    let record = this.audioElements.get(assetId);
    if (record) {
      record.lastUsed = now;
      record.priority = priority;
      record.inUse = true;
      if (record.element.src !== sourceUrl) {
        record.element.src = sourceUrl;
        record.element.load();
      }
      return record.element;
    }

    if (this.audioElements.size >= profile.maxAudioDecoders) {
      // Find lowest priority element to evict
      let lowestPri = Infinity;
      let oldestUsed = Infinity;
      let victimId: string | null = null;
      
      for (const [id, r] of this.audioElements.entries()) {
        if (!r.inUse) {
          if (r.priority < lowestPri || (r.priority === lowestPri && r.lastUsed < oldestUsed)) {
            lowestPri = r.priority;
            oldestUsed = r.lastUsed;
            victimId = id;
          }
        }
      }

      if (!victimId) {
        for (const [id, r] of this.audioElements.entries()) {
          if (r.priority < priority) {
            if (r.priority < lowestPri || (r.priority === lowestPri && r.lastUsed < oldestUsed)) {
              lowestPri = r.priority;
              oldestUsed = r.lastUsed;
              victimId = id;
            }
          }
        }
      }
      
      if (victimId) {
        const victim = this.audioElements.get(victimId)!;
        victim.element.pause();
        victim.element.removeAttribute('src');
        victim.element.load();
        this.audioElements.delete(victimId);
      } else {
        return null;
      }
    }

    const audio = document.createElement('audio');
    audio.id = `corem-aud-${assetId}`;
    if (sourceUrl.startsWith('http') && !sourceUrl.startsWith('blob:')) {
      audio.crossOrigin = 'anonymous';
    }
    audio.src = sourceUrl;
    audio.style.display = 'none';
    audio.onerror = () => {
      console.error(`MediaPool: Failed to load audio asset ${assetId} from ${sourceUrl}`, audio.error);
    };
    document.body.appendChild(audio);
    
    this.audioElements.set(assetId, {
      id: assetId,
      element: audio,
      lastUsed: now,
      priority,
      inUse: true
    });
    
    return audio;
  }

  static release(assetId: string) {
    const vid = this.videoElements.get(assetId);
    if (vid) vid.inUse = false;
    
    const aud = this.audioElements.get(assetId);
    if (aud) aud.inUse = false;
  }
  
  static releaseAll() {
    this.videoElements.forEach(v => v.inUse = false);
    this.audioElements.forEach(a => a.inUse = false);
  }

  static unlockAudio() {
    // Call this synchronously on user interaction (e.g. Play button click)
    // to unlock audio contexts.
    for (const [_, record] of this.audioElements.entries()) {
      if (record.element.paused && record.element.readyState >= 2) {
        record.element.play().catch(() => {});
        record.element.pause(); // Just want to unlock it
      }
    }
  }

  private static enforceLimits() {
    const profile = HardwareProfiler.getProfile();
    
    while (this.videoElements.size > profile.maxVideoDecoders) {
       // Evict lowest priority
       let lowestPri = Infinity;
       let victimId: string | null = null;
       for (const [id, r] of this.videoElements.entries()) {
         if (r.priority < lowestPri) {
           lowestPri = r.priority;
           victimId = id;
         }
       }
       if (victimId) {
         const victim = this.videoElements.get(victimId)!;
         victim.element.pause();
         victim.element.removeAttribute('src');
         victim.element.load();
         if (victim.element.parentNode) victim.element.parentNode.removeChild(victim.element);
         this.videoElements.delete(victimId);
       } else break;
    }

    while (this.audioElements.size > profile.maxAudioDecoders) {
       let lowestPri = Infinity;
       let victimId: string | null = null;
       for (const [id, r] of this.audioElements.entries()) {
         if (r.priority < lowestPri) {
           lowestPri = r.priority;
           victimId = id;
         }
       }
       if (victimId) {
         const victim = this.audioElements.get(victimId)!;
         victim.element.pause();
         victim.element.removeAttribute('src');
         victim.element.load();
         if (victim.element.parentNode) victim.element.parentNode.removeChild(victim.element);
         this.audioElements.delete(victimId);
       } else break;
    }
  }
}
