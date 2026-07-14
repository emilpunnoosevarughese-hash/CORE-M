import { ProjectManager } from '../project/ProjectManager';
import { ProjectSerializer } from '../project/ProjectSerializer';

export class AutoSaveManager {
  private static readonly AUTOSAVE_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes
  private static readonly MAX_ROLLING_BACKUPS = 10;
  private timerId: any = null;

  public start() {
    if (this.timerId) clearInterval(this.timerId);
    this.timerId = setInterval(() => this.executeAutoSave(), AutoSaveManager.AUTOSAVE_INTERVAL_MS);
  }

  public stop() {
    if (this.timerId) clearInterval(this.timerId);
  }

  private async executeAutoSave() {
    try {
      const pm = ProjectManager.getInstance();
      const meta = pm.getMetadata();
      if (!meta) return;

      // 1. Serialize in background worker
      const blob = await pm.saveProject();

      // 2. Persist to IndexedDB (Recovery Cache)
      await this.persistToRecoveryCache(meta.id, blob);

    } catch (e) {
      console.error('Autosave failed:', e);
    }
  }

  private async persistToRecoveryCache(projectId: string, blob: Blob) {
    // Open a dedicated DB for Recovery payloads
    const db = await this.openRecoveryDB();
    const transaction = db.transaction('autosaves', 'readwrite');
    const store = transaction.objectStore('autosaves');
    
    // Fetch all current autosaves for this project
    const index = store.index('projectId');
    const request = index.getAll(projectId);

    request.onsuccess = () => {
      const records = request.result || [];
      records.sort((a, b) => a.timestamp - b.timestamp);

      // LRU Eviction: If we have more than MAX, delete the oldest
      if (records.length >= AutoSaveManager.MAX_ROLLING_BACKUPS) {
        store.delete(records[0].id);
      }

      // Add new
      store.put({
        id: crypto.randomUUID(),
        projectId,
        timestamp: Date.now(),
        blob
      });
    };
  }

  private openRecoveryDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('corem_recovery', 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('autosaves')) {
          const store = db.createObjectStore('autosaves', { keyPath: 'id' });
          store.createIndex('projectId', 'projectId', { unique: false });
        }
      };
      request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  }
}
