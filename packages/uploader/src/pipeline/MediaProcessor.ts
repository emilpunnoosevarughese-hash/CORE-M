export interface MediaMetadata {
  duration: number; // in seconds
  width: number;
  height: number;
  fps: number;
  hasAudio: boolean;
  thumbnailUrl?: string;
  waveform?: Float32Array; // Future usage
  hash?: string;
  proxyUrl?: string;
}

export class MediaProcessor {
  private static workerInstance: Worker | null = null;
  private static workerTimeout: ReturnType<typeof setTimeout> | null = null;
  private static callbacks = new Map<string, (result: any) => void>();

  private static getWorker(): Worker {
    if (this.workerTimeout) clearTimeout(this.workerTimeout);
    
    // Idle timeout to terminate worker and free memory (30 seconds)
    this.workerTimeout = setTimeout(() => {
      if (this.workerInstance && this.callbacks.size === 0) {
        this.workerInstance.terminate();
        this.workerInstance = null;
      }
    }, 30000);

    if (!this.workerInstance) {
      this.workerInstance = new Worker(new URL('../workers/ingestion.worker.ts', import.meta.url), { type: 'module' });
      this.workerInstance.onmessage = (e) => {
        if (e.data.type === 'PROCESS_COMPLETE') {
          const cb = this.callbacks.get(e.data.payload.id);
          if (cb) {
            cb(e.data.payload);
            this.callbacks.delete(e.data.payload.id);
          }
        }
      };
    }
    return this.workerInstance;
  }

  static async extractMetadata(file: File, id: string): Promise<MediaMetadata> {
    const workerPromise = new Promise<{hash: string, proxyUrl?: string}>((resolve) => {
      this.callbacks.set(id, resolve);
      this.getWorker().postMessage({ type: 'PROCESS_MEDIA', payload: { file, generateProxy: true, id } });
    });

    let baseMeta: MediaMetadata = { duration: 0, width: 0, height: 0, fps: 0, hasAudio: false };
    
    if (file.type.startsWith('video/')) {
      baseMeta = await this.processVideo(file);
    } else if (file.type.startsWith('audio/')) {
      baseMeta = await this.processAudio(file);
    } else if (file.type.startsWith('image/')) {
      baseMeta = await this.processImage(file);
    }

    const { hash, proxyUrl } = await workerPromise;
    
    return { ...baseMeta, hash, proxyUrl };
  }

  private static async processVideo(file: File): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.muted = true;
      video.preload = 'metadata';
      video.playsInline = true;

      video.onloadedmetadata = () => {
        // Attempt to extract thumbnail (seek to 1 second or middle)
        video.currentTime = Math.min(1, video.duration / 2);
      };

      video.onseeked = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = (320 / video.videoWidth) * video.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          URL.revokeObjectURL(url);
          resolve({
            duration: video.duration,
            width: video.videoWidth,
            height: video.videoHeight,
            fps: 30, // Default fallback, precise FPS needs MP4Box parsing
            hasAudio: true, // Need WebAudio to verify truly, assuming true for video
            thumbnailUrl
          });
        }
      };

      video.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load video metadata'));
      };

      video.src = url;
    });
  }

  private static async processAudio(file: File): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      
      audio.onloadedmetadata = () => {
        const duration = audio.duration;
        // Run progressive waveform extraction asynchronously
        // NOTE: revoke the blob URL only AFTER the fetch completes, not before
        setTimeout(async () => {
          try {
            const { WaveformGenerator } = await import('@corem/audio');
            const { CacheManager } = await import('@corem/playback');
            const res = await fetch(url);
            const arrayBuffer = await res.arrayBuffer();
            const rawData = await WaveformGenerator.decodeAudio(arrayBuffer);
            // Default: 100 samples per pixel for typical zoom levels
            const peaks = WaveformGenerator.generatePeaks(rawData, 100);
            CacheManager.set(`waveform-${file.name}`, peaks);
          } catch(e) {
            console.warn('Progressive waveform extraction failed:', e);
          } finally {
            // Revoke only after we're done with the blob URL
            URL.revokeObjectURL(url);
          }
        }, 0);

        resolve({
          duration,
          width: 0,
          height: 0,
          fps: 0,
          hasAudio: true
        });
      };
      
      audio.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load audio metadata'));
      };
      
      audio.src = url;
    });
  }

  private static async processImage(file: File): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = (320 / img.width) * img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.7);
          
          URL.revokeObjectURL(url);
          resolve({
            duration: 0,
            width: img.width,
            height: img.height,
            fps: 0,
            hasAudio: false,
            thumbnailUrl
          });
        }
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image metadata'));
      };
      
      img.src = url;
    });
  }
}
