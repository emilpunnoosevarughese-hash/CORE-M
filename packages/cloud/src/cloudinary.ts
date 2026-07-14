/**
 * Cloudinary Chunked Upload Utility
 */

export interface CloudinaryUploadOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  chunkSize?: number; // default 20MB
  onProgress?: (percent: number, speedBytesPerSec: number) => void;
  signal?: AbortSignal; // For canceling the upload
}

export async function uploadToCloudinaryChunked(file: File, options: CloudinaryUploadOptions): Promise<any> {
  const { cloudName, uploadPreset, folder = 'coreM_assets' } = options;
  const chunkSize = options.chunkSize || 20 * 1024 * 1024; // 20MB by default
  const totalSize = file.size;
  const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36);
  
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

  let start = 0;
  let end = Math.min(chunkSize, totalSize);
  let chunkCount = Math.ceil(totalSize / chunkSize);
  let currentChunk = 0;
  
  let startTime = Date.now();
  let uploadedBytes = 0;

  let responseData: any = null;

  while (start < totalSize) {
    if (options.signal?.aborted) {
      throw new Error('Upload aborted');
    }

    const chunk = file.slice(start, end);
    const formData = new FormData();
    formData.append('file', chunk);
    formData.append('upload_preset', uploadPreset);
    formData.append('folder', folder);
    formData.append('cloud_name', cloudName);

    const headers = new Headers();
    headers.append('X-Unique-Upload-Id', uniqueUploadId);
    headers.append('Content-Range', `bytes ${start}-${end - 1}/${totalSize}`);

    const res = await fetch(url, {
      method: 'POST',
      body: formData,
      headers,
      signal: options.signal
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || 'Upload failed');
    }

    responseData = await res.json();
    uploadedBytes = end;
    currentChunk++;

    if (options.onProgress) {
      const elapsedSecs = (Date.now() - startTime) / 1000;
      const speed = uploadedBytes / (elapsedSecs || 1);
      const percent = Math.min((uploadedBytes / totalSize) * 100, 100);
      options.onProgress(percent, speed);
    }

    start = end;
    end = Math.min(start + chunkSize, totalSize);
  }

  return responseData;
}
