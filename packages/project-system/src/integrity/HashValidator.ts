export class HashValidator {
  private static worker: Worker | null = null;

  private static getWorker(): Worker {
    if (!this.worker) {
      this.worker = new Worker(new URL('../workers/checksum.worker.ts', import.meta.url), { type: 'module' });
    }
    return this.worker;
  }

  /**
   * Generates a SHA-256 hash for a given file asynchronously using a Web Worker.
   * This is used to verify file integrity and detect duplicates/missing media.
   */
  public static async generateHash(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const messageId = crypto.randomUUID();

      const handler = (e: MessageEvent) => {
        if (e.data.messageId === messageId) {
          worker.removeEventListener('message', handler);
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.hash);
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'hash', messageId, file });
    });
  }
}
