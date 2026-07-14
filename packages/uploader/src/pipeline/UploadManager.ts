import { useUploaderStore } from '../store';
import { MediaProcessor } from './MediaProcessor';
import type { StorageProvider } from '../providers/StorageProvider';
import { LocalProvider } from '../providers/LocalProvider';

// Use LocalProvider by default for local reliability and speed
const defaultProvider: StorageProvider = new LocalProvider();

class UploadManagerClass {
  private processing = false;
  private provider = defaultProvider;

  setProvider(provider: StorageProvider) {
    this.provider = provider;
  }

  startQueue() {
    if (this.processing) return;
    this.processing = true;
    this.processNext();
  }

  private async processNext() {
    const store = useUploaderStore.getState();
    const pendingIds = Object.keys(store.items).filter(id => store.items[id].status === 'pending');
    
    if (pendingIds.length === 0) {
      this.processing = false;
      return;
    }

    const id = pendingIds[0];
    const item = store.items[id];
    
    store.setStatus(id, 'uploading');

    try {
      // 1. Extract Metadata
      const metadata = await MediaProcessor.extractMetadata(item.file, id);
      
      // 2. Upload to Storage
      const startTime = Date.now();
      let lastUploaded = 0;
      let lastTime = startTime;

      const result = await this.provider.upload(
        item.file,
        (progress) => {
          const now = Date.now();
          const timeDelta = (now - lastTime) / 1000; // in seconds
          const bytesDelta = progress.bytesUploaded - lastUploaded;
          
          let speed = 0;
          if (timeDelta > 0 && bytesDelta > 0) {
            speed = bytesDelta / timeDelta;
          }

          useUploaderStore.getState().updateProgress(
            id, 
            progress.percentage, 
            speed, 
            progress.totalBytes
          );

          lastUploaded = progress.bytesUploaded;
          lastTime = now;
        },
        item.abortController?.signal
      );

      // 3. Mark Complete and attach metadata to store so AssetLibrary can consume it
      useUploaderStore.getState().completeUpload(id, result.url, metadata);

    } catch (err: any) {
      if (err.message !== 'Aborted') {
        store.setStatus(id, 'error', err.message);
      }
    }

    // Process next in queue
    this.processNext();
  }
}

export const UploadManager = new UploadManagerClass();
