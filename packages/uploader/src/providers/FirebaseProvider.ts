import type { StorageProvider, StorageCapabilities, UploadProgress, UploadResult } from './StorageProvider';

export class FirebaseProvider implements StorageProvider {
  name = 'firebase';
  capabilities: StorageCapabilities = {
    supportsChunking: false,
    supportsStreaming: false,
    supportsResume: true,
    isLocal: false
  };

  async upload(
    file: File, 
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<UploadResult> {
    // In a real implementation, we would use Firebase Storage SDK:
    // uploadBytesResumable(ref, file)
    
    return new Promise((resolve, reject) => {
      if (abortSignal?.aborted) return reject(new Error('Aborted'));
      
      let uploaded = 0;
      const total = file.size;
      const chunkSize = Math.max(1024 * 1024, total / 10);

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
          const key = `uploads/${Date.now()}_${file.name}`;
          const url = `https://firebasestorage.googleapis.com/v0/b/mock/o/${encodeURIComponent(key)}?alt=media`;
          resolve({
            url,
            secureUrl: url,
            providerId: key,
            format: file.type.split('/')[1] || 'unknown',
            size: total
          });
        }
      }, 100);
    });
  }
}
