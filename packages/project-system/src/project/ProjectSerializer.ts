// This file represents the interface to the background worker responsible for heavy serialization.
export class ProjectSerializer {
  private static worker: Worker | null = null;

  private static getWorker(): Worker {
    if (!this.worker) {
      // Use URL structure suitable for modern bundlers like Vite
      this.worker = new Worker(new URL('../workers/project.worker.ts', import.meta.url), { type: 'module' });
    }
    return this.worker;
  }

  /**
   * Serializes the entire project state asynchronously.
   * @param projectState The full memory state of the project (Timeline, Assets, Metadata)
   * @param format 'json' for development, 'binary' (MessagePack) for production
   * @returns A promise resolving to a Blob representing the file to save.
   */
  public static async serialize(projectState: any, format: 'json' | 'binary' = 'binary'): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const messageId = crypto.randomUUID();

      const handler = (e: MessageEvent) => {
        if (e.data.messageId === messageId) {
          worker.removeEventListener('message', handler);
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.blob);
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'serialize', messageId, projectState, format });
    });
  }

  public static async deserialize(blob: Blob, format: 'json' | 'binary' = 'binary'): Promise<any> {
    return new Promise((resolve, reject) => {
      const worker = this.getWorker();
      const messageId = crypto.randomUUID();

      const handler = (e: MessageEvent) => {
        if (e.data.messageId === messageId) {
          worker.removeEventListener('message', handler);
          if (e.data.error) reject(new Error(e.data.error));
          else resolve(e.data.projectState);
        }
      };

      worker.addEventListener('message', handler);
      worker.postMessage({ type: 'deserialize', messageId, blob, format });
    });
  }
}
