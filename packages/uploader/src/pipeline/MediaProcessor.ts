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

  private static async validateFileSecurity(file: File): Promise<void> {
    const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024; // 2GB
    if (file.size > MAX_FILE_SIZE) {
      throw new Error(`Security Error: File exceeds maximum allowed size.`);
    }

    // Read first 4 bytes for magic byte verification
    const buffer = await file.slice(0, 4).arrayBuffer();
    const view = new DataView(buffer);
    const magic = view.getUint32(0, false).toString(16).toUpperCase();

    const allowedMagics = [
      '89504E47', // PNG
      'FFD8FFE0', 'FFD8FFE1', 'FFD8FFE2', 'FFD8FFE3', 'FFD8FFE8', // JPEG
      '47494638', // GIF
      '00000018', '00000020', '00000014', '66747970', // MP4/Quicktime variants (starts with length, then ftyp)
      '1A45DFA3', // MKV/WebM
      '52494646', // WAV/AVI (RIFF)
      '4F676753', // OGG
    ];

    // For ftyp (mp4), the first 4 bytes are usually the box size. 
    // We check if the next 4 bytes (offset 4) spell 'ftyp' (66747970).
    let isMP4 = false;
    if (file.size >= 8) {
      const ftypBuffer = await file.slice(4, 8).arrayBuffer();
      const ftypView = new DataView(ftypBuffer);
      if (ftypView.getUint32(0, false).toString(16).toUpperCase() === '66747970') {
        isMP4 = true;
      }
    }

    let isValid = false;
    for (const m of allowedMagics) {
      if (magic.startsWith(m) || magic === m) isValid = true;
    }
    
    // MP3 (ID3 or sync word) is tricky, fallback to strict MIME check if magic bytes aren't definitive 
    // but only for explicitly allowed MIME types.
    if (!isValid && !isMP4 && file.type === 'audio/mpeg') {
      isValid = true; 
    }

    if (!isValid && !isMP4) {
      throw new Error(`Security Error: Invalid file signature (Magic Bytes). The file content does not match its extension.`);
    }
  }

  static async extractMetadata(file: File, id: string): Promise<MediaMetadata> {
    await this.validateFileSecurity(file);

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
        // Enforce strict duration limit (e.g. max 10 hours for a web editor)
        if (video.duration > 36000) {
           URL.revokeObjectURL(url);
           reject(new Error("Security Error: Video exceeds maximum duration of 10 hours."));
           return;
        }

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
        reject(new Error('Failed to process video'));
      };

      video.src = url;
    });
  }

  private static async processAudio(file: File): Promise<MediaMetadata> {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const audio = document.createElement('audio');
      
      audio.onloadedmetadata = () => {
        if (audio.duration > 36000) {
           URL.revokeObjectURL(url);
           reject(new Error("Security Error: Audio exceeds maximum duration of 10 hours."));
           return;
        }
        URL.revokeObjectURL(url);
        
        // Run progressive waveform extraction asynchronously
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
          duration: audio.duration,
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
        // Enforce maximum dimensions to prevent memory exhaustion / zip bombs
        if (img.width > 16384 || img.height > 16384) {
           URL.revokeObjectURL(url);
           reject(new Error("Security Error: Image dimensions exceed maximum allowed size (16384x16384)."));
           return;
        }

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
