export interface SyncOperation {
  id: string;
  projectId: string;
  type: 'UPDATE_PROJECT' | 'ADD_COMMENT' | 'RESOLVE_COMMENT';
  payload: any;
  timestamp: number;
}

export class OfflineQueue {
  private static dbName = 'corem_offline_sync';
  private static storeName = 'operations';

  private static async getDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(this.dbName, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(this.storeName, { keyPath: 'id' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  static async enqueue(op: Omit<SyncOperation, 'id' | 'timestamp'>): Promise<void> {
    const db = await this.getDB();
    const operation: SyncOperation = {
      ...op,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).add(operation);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  static async getQueue(): Promise<SyncOperation[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readonly');
      const req = tx.objectStore(this.storeName).getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(tx.error);
    });
  }

  static async dequeue(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.storeName, 'readwrite');
      tx.objectStore(this.storeName).delete(id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
