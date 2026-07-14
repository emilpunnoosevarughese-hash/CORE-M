import type { StorageProvider, StorageCapabilities, UploadProgress, UploadResult } from './StorageProvider';

export class IndexedDBProvider implements StorageProvider {
  name = 'indexeddb';
  capabilities: StorageCapabilities = {
    supportsChunking: false,
    supportsStreaming: false,
    supportsResume: false,
    isLocal: true
  };

  async upload(
    file: File, 
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<UploadResult> {
    // Stores blob directly to IndexedDB for offline workflow
    
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) return reject(new Error('Aborted'));
      
      const req = indexedDB.open('corem_offline_storage', 1);
      req.onupgradeneeded = (e: any) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('assets')) {
          db.createObjectStore('assets', { keyPath: 'id' });
        }
      };

      req.onsuccess = (e: any) => {
        const db = e.target.result;
        const tx = db.transaction('assets', 'readwrite');
        const store = tx.objectStore('assets');
        
        const id = `idb_${Date.now()}_${file.name}`;
        store.put({ id, file, name: file.name, type: file.type, size: file.size, timestamp: Date.now() });

        tx.oncomplete = () => {
          if (onProgress) {
            onProgress({ bytesUploaded: file.size, totalBytes: file.size, percentage: 100 });
          }
          
          const url = URL.createObjectURL(file);
          resolve({
            url,
            secureUrl: url,
            providerId: id,
            format: file.type.split('/')[1] || 'unknown',
            size: file.size
          });
        };
        
        tx.onerror = () => reject(new Error('IndexedDB storage failed'));
      };

      req.onerror = () => reject(new Error('Failed to open IndexedDB'));
    });
  }
}
