import type { StorageProvider, StorageCapabilities, UploadProgress, UploadResult } from './StorageProvider';

const CLOUD_NAME = import.meta.env?.VITE_CLOUDINARY_CLOUD_NAME || 'ahd5zxxg';
const UPLOAD_PRESET = import.meta.env?.VITE_CLOUDINARY_UPLOAD_PRESET || 'corem_preset';

export class CloudinaryProvider implements StorageProvider {
  name = 'cloudinary';
  capabilities: StorageCapabilities = {
    supportsChunking: true,
    supportsStreaming: true,
    supportsResume: true,
    isLocal: false
  };

  private pausedUploads = new Map<string, { abort: () => void }>();

  async upload(
    file: File, 
    onProgress?: (progress: UploadProgress) => void,
    abortSignal?: AbortSignal
  ): Promise<UploadResult> {
    const chunkSize = 20 * 1024 * 1024; // 20MB
    const totalSize = file.size;
    const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const url = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

    let start = 0;
    let end = Math.min(chunkSize, totalSize);
    let uploadedBytes = 0;
    let responseData: any = null;

    while (start < totalSize) {
      if (abortSignal?.aborted) {
        throw new Error('Upload aborted');
      }

      const chunk = file.slice(start, end);
      const formData = new FormData();
      formData.append('file', chunk);
      formData.append('upload_preset', UPLOAD_PRESET);
      formData.append('cloud_name', CLOUD_NAME);

      const headers = new Headers();
      headers.append('X-Unique-Upload-Id', uniqueUploadId);
      headers.append('Content-Range', `bytes ${start}-${end - 1}/${totalSize}`);

      const res = await fetch(url, {
        method: 'POST',
        body: formData,
        headers,
        signal: abortSignal
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || 'Upload failed');
      }

      responseData = await res.json();
      uploadedBytes = end;

      if (onProgress) {
        onProgress({
          bytesUploaded: uploadedBytes,
          totalBytes: totalSize,
          percentage: Math.min((uploadedBytes / totalSize) * 100, 100)
        });
      }

      start = end;
      end = Math.min(start + chunkSize, totalSize);
    }

    if (!responseData) throw new Error('Upload failed: no response');

    return {
      url: responseData.secure_url,
      secureUrl: responseData.secure_url,
      streamingUrl: responseData.secure_url, // In prod, Cloudinary generates HLS dynamically
      providerId: responseData.public_id,
      format: responseData.format,
      size: responseData.bytes
    };
  }
}
