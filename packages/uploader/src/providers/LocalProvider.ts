import type { StorageProvider, UploadProgress, UploadResult } from './StorageProvider';
import { BlobManager } from '../pipeline/BlobManager';

export class LocalProvider implements StorageProvider {
  name = 'local';
  capabilities = {
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
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) return reject(new Error('Aborted'));
      
      const id = crypto.randomUUID();
      
      // Simulate a fast chunked upload for UI testing
      let uploaded = 0;
      const total = file.size;
      const chunkSize = Math.max(1024 * 1024, total / 20); // max 20 chunks or 1MB chunks

      const interval = setInterval(() => {
        if (abortSignal?.aborted) {
          clearInterval(interval);
          return reject(new Error('Aborted'));
        }

        uploaded += chunkSize;
        if (uploaded > total) uploaded = total;

        if (onProgress) {
          onProgress({
            bytesUploaded: uploaded,
            totalBytes: total,
            percentage: (uploaded / total) * 100
          });
        }

        if (uploaded === total) {
          clearInterval(interval);
          const url = URL.createObjectURL(file);
          BlobManager.register(id, url);
          resolve({
            url,
            secureUrl: url,
            streamingUrl: url,
            providerId: `local_${Date.now()}_${file.name}`,
            format: file.type.split('/')[1] || 'unknown',
            size: total
          });
        }
      }, 50); // 50ms per chunk simulated speed
    });
  }
}
