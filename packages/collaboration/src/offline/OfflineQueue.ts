import { DeltaOperation } from '../sync/ConflictResolver';

/**
 * Persists operations locally using IndexedDB when the WebSocket disconnects,
 * allowing full offline editing capabilities.
 */
export class OfflineQueue {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'corem_offline_queue';

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('operations')) {
          db.createObjectStore('operations', { autoIncrement: true });
        }
      };
      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };
      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  }

  public async pushOperation(op: DeltaOperation): Promise<void> {
    if (!this.db) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('operations', 'readwrite');
      const store = tx.objectStore('operations');
      const request = store.add(op);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async popAllOperations(): Promise<DeltaOperation[]> {
    if (!this.db) return [];
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('operations', 'readwrite');
      const store = tx.objectStore('operations');
      const request = store.getAll();
      
      request.onsuccess = () => {
        store.clear(); // Clear the queue after retrieving
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  }
}
