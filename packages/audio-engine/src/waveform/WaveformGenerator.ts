export class WaveformGenerator {
  private static worker: Worker | null = null;
  private static peakCache = new Map<string, Float32Array>();

  private static getWorker(): Worker {
    if (!this.worker) {
      // In a real bundler setup, this path would be resolved by the bundler (e.g. Vite ?worker)
      // We scaffold a mock worker interface for architectural correctness.
      this.worker = new Worker(new URL('../workers/waveform.worker.ts', import.meta.url), { type: 'module' });
    }
    return this.worker;
  }

  /**
   * Dispatches decoding and peak generation to a background worker to prevent UI thread blocking.
   */
  public static async generatePeaks(audioUrl: string, clipId: string, samplesPerPixel: number = 100): Promise<Float32Array> {
    const cacheKey = `${clipId}_${samplesPerPixel}`;
    if (this.peakCache.has(cacheKey)) {
      return this.peakCache.get(cacheKey)!;
    }

    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      
      const messageHandler = (e: MessageEvent) => {
        if (e.data.clipId === clipId) {
          worker.removeEventListener('message', messageHandler);
          if (e.data.error) {
            reject(new Error(e.data.error));
          } else {
            this.peakCache.set(cacheKey, e.data.peaks);
            resolve(e.data.peaks);
          }
        }
      };

      worker.addEventListener('message', messageHandler);
      worker.postMessage({ type: 'generate', audioUrl, clipId, samplesPerPixel });
    });
  }
}
