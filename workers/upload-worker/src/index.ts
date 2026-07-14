/// <reference lib="webworker" />

export interface CloudinaryUploadOptions {
  cloudName: string;
  uploadPreset: string;
  folder?: string;
  chunkSize?: number;
}

const activeUploads = new Map<string, AbortController>();

self.onmessage = async (e: MessageEvent) => {
  const { type, payload } = e.data;

  if (type === 'START_UPLOAD') {
    const { id, file, options } = payload;
    const { cloudName, uploadPreset, folder = 'coreM_assets', chunkSize = 20 * 1024 * 1024 } = options;
    
    const abortController = new AbortController();
    activeUploads.set(id, abortController);

    try {
      const totalSize = file.size;
      const uniqueUploadId = Math.random().toString(36).substring(2) + Date.now().toString(36);
      const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;

      let start = 0;
      let end = Math.min(chunkSize, totalSize);
      let startTime = Date.now();
      let responseData: any = null;

      while (start < totalSize) {
        if (abortController.signal.aborted) {
          throw new Error('ABORTED');
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

        // Retry logic for robust uploads
        let attempts = 0;
        let res: Response | null = null;
        
        while (attempts < 3) {
          try {
            res = await fetch(url, {
              method: 'POST',
              body: formData,
              headers,
              signal: abortController.signal
            });
            if (res.ok) break;
          } catch (err: any) {
            if (err.name === 'AbortError') throw new Error('ABORTED');
          }
          attempts++;
          await new Promise(r => setTimeout(r, 2000 * attempts)); // Exponential backoff
        }

        if (!res || !res.ok) {
          throw new Error('Upload chunk failed after retries');
        }

        responseData = await res.json();
        
        const elapsedSecs = (Date.now() - startTime) / 1000;
        const speed = end / (elapsedSecs || 1);
        const progress = Math.min((end / totalSize) * 100, 100);
        
        self.postMessage({ type: 'PROGRESS', id, progress, speed });

        start = end;
        end = Math.min(start + chunkSize, totalSize);
      }

      self.postMessage({ type: 'SUCCESS', id, data: responseData });
    } catch (err: any) {
      if (err.message === 'ABORTED') {
        self.postMessage({ type: 'PAUSED', id });
      } else {
        self.postMessage({ type: 'ERROR', id, error: err.message });
      }
    } finally {
      activeUploads.delete(id);
    }
  } else if (type === 'PAUSE_UPLOAD') {
    const { id } = payload;
    const controller = activeUploads.get(id);
    if (controller) {
      controller.abort();
    }
  }
};
