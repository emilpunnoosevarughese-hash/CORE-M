export interface AssetRecord {
  id: string;
  hash: string;
  fileName: string;
  originalPath: string;
  proxyPath?: string;
  thumbnailBlob?: Blob;
  duration?: number;
  resolution?: { width: number, height: number };
  codec?: string;
  fps?: number;
  audioChannels?: number;
  metadata: Record<string, any>;
  importDate: number;
  lastModified: number;
  tags: string[];
  rating: number;
  usageCount: number;
}

/**
 * Handles the IndexedDB storage of asset metadata.
 * Real media files are NOT stored here to prevent quota explosion.
 */
export class AssetDatabase {
  private static readonly DB_NAME = 'corem_assets';
  private static readonly STORE_NAME = 'assets';
  private db: IDBDatabase | null = null;

  public async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(AssetDatabase.DB_NAME, 1);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(AssetDatabase.STORE_NAME)) {
          const store = db.createObjectStore(AssetDatabase.STORE_NAME, { keyPath: 'id' });
          store.createIndex('hash', 'hash', { unique: false });
          store.createIndex('originalPath', 'originalPath', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = (e.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
    });
  }

  public async putAsset(asset: AssetRecord): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(AssetDatabase.STORE_NAME, 'readwrite');
      const store = transaction.objectStore(AssetDatabase.STORE_NAME);
      const request = store.put(asset);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  public async getAsset(id: string): Promise<AssetRecord | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(AssetDatabase.STORE_NAME, 'readonly');
      const store = transaction.objectStore(AssetDatabase.STORE_NAME);
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  public async getAssetByHash(hash: string): Promise<AssetRecord[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) return reject(new Error('DB not initialized'));
      const transaction = this.db.transaction(AssetDatabase.STORE_NAME, 'readonly');
      const store = transaction.objectStore(AssetDatabase.STORE_NAME);
      const index = store.index('hash');
      const request = index.getAll(hash);
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }
}
